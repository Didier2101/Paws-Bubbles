"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    Calendar, CheckCircle,
    LogOut, RefreshCw, PawPrint, Edit, Settings, Trash2, Scissors, Menu, X
} from 'lucide-react';
import { Appointment, Service, BusinessHour } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<User | null>(null);
    const [currentTab, setCurrentTab] = useState<'reservations' | 'services' | 'settings'>('reservations');
    const [showAddService, setShowAddService] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();

    const [newService, setNewService] = useState({
        name: '',
        description: '',
        price: '',
        duration_minutes: '',
        pet_size: 'Pequeño'
    });
    const [editingService, setEditingService] = useState<Service | null>(null);

    // Fetch Appointments with React Query
    const { data: appointments = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-appointments'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .order('appointment_date', { ascending: true })
                .order('start_time', { ascending: true });
            if (error) throw error;
            return data as Appointment[];
        }
    });

    // Fetch Services with React Query
    const { data: services = [] } = useQuery({
        queryKey: ['admin-services'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('price', { ascending: true });
            if (error) throw error;
            return data as Service[];
        }
    });

    // Fetch Business Hours
    const { data: businessHours = [] } = useQuery({
        queryKey: ['admin-business-hours'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('business_hours')
                .select('*')
                .order('day_of_week', { ascending: true });
            if (error) throw error;
            return data as BusinessHour[];
        }
    });

    // Mutations
    const updateHourMutation = useMutation({
        mutationFn: async (hour: BusinessHour) => {
            const { error } = await supabase
                .from('business_hours')
                .update({
                    open_time: hour.open_time,
                    close_time: hour.close_time,
                    is_closed: hour.is_closed
                })
                .eq('id', hour.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-business-hours'] });
            toast.success("Horario actualizado");
        }
    });

    const createServiceMutation = useMutation({
        mutationFn: async (service: Omit<Service, 'id' | 'created_at'>) => {
            const { error } = await supabase.from('services').insert([service]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-services'] });
            toast.success("Servicio agregado");
            setShowAddService(false);
            setNewService({ name: '', description: '', price: '', duration_minutes: '', pet_size: 'Pequeño' });
        }
    });

    const updateServiceMutation = useMutation({
        mutationFn: async (service: Service) => {
            const { error } = await supabase
                .from('services')
                .update({
                    name: service.name,
                    description: service.description,
                    price: service.price,
                    duration_minutes: service.duration_minutes,
                    pet_size: service.pet_size
                })
                .eq('id', service.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-services'] });
            toast.success("Servicio actualizado");
            setEditingService(null);
            setShowAddService(false);
        }
    });

    const deleteServiceMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-services'] });
            toast.success("Servicio eliminado");
        }
    });

    const calculateEndTime = (startTime: string, durationMinutes: number) => {
        if (!startTime) return '';
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    };

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: Appointment['status'] }) => {
            const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
            toast.success("Cita actualizada");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('appointments').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
            toast.success("Cita eliminada");
        }
    });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) router.push('/admin');
            else setUser(user);
        };
        checkUser();

        // Admin real-time subscription
        const channel = supabase
            .channel('admin-appointments-all')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'appointments'
                },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });

                    const newApt = payload.new as Appointment;
                    const oldApt = payload.old as Appointment;

                    if (payload.eventType === 'UPDATE' && newApt.status === 'cancelled' && oldApt.status !== 'cancelled') {
                        toast.error(`¡ALERTA! El cliente ${newApt.client_name} ha cancelado la cita de ${newApt.pet_name}.`, {
                            duration: 0,
                        });
                    } else if (payload.eventType === 'INSERT') {
                        toast.success(`NUEVA RESERVA: ${newApt.pet_name} (${newApt.service_name})`);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router, queryClient]);

    const deleteAppointment = async (apt: Appointment) => {
        const { value: reason } = await Swal.fire({
            title: 'Cancelar Cita',
            text: `Indica el motivo de cancelación para ${apt.client_name}:`,
            input: 'text',
            inputValue: 'Inconveniente con el horario',
            showCancelButton: true,
            confirmButtonText: 'Confirmar Cancelación',
            cancelButtonText: 'Volver',
            confirmButtonColor: '#ef4444',
            background: '#18181b',
            color: '#fff',
            inputAttributes: {
                autocapitalize: 'off'
            },
            customClass: {
                popup: 'rounded-[32px] border border-white/10'
            }
        });

        if (!reason) return;

        deleteMutation.mutate(apt.id, {
            onSuccess: () => {
                const message = `Hola ${apt.client_name}, tu cita para ${apt.pet_name} el día ${apt.appointment_date} ha sido cancelada. Motivo: ${reason}.`;
                const whatsappUrl = `https://wa.me/${apt.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            }
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin');
    };

    const handleAddService = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { ...newService, price: parseInt(newService.price), duration_minutes: parseInt(newService.duration_minutes) };
        if (editingService) updateServiceMutation.mutate({ ...data, id: editingService.id } as Service);
        else createServiceMutation.mutate(data as Omit<Service, 'id' | 'created_at'>);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex">
            <aside className="w-64 border-r border-white/5 bg-black hidden md:flex flex-col">
                <div className="p-8 border-b border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-600"><PawPrint className="w-5 h-5 text-white" /></div>
                    <span className="font-bold tracking-tight">Admin P&B</span>
                </div>
                <nav className="flex-1 p-6 space-y-2">
                    <button onClick={() => setCurrentTab('reservations')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all font-bold ${currentTab === 'reservations' ? 'bg-white/5 text-indigo-400 border border-indigo-500/20' : 'text-gray-500 hover:bg-white/5'}`}>
                        <Calendar className="w-5 h-5" /> Reservas
                    </button>
                    <button onClick={() => setCurrentTab('services')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all font-bold ${currentTab === 'services' ? 'bg-white/5 text-indigo-400 border border-indigo-500/20' : 'text-gray-500 hover:bg-white/5'}`}>
                        <Scissors className="w-5 h-5" /> Servicios
                    </button>
                    <button onClick={() => setCurrentTab('settings')} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all font-bold ${currentTab === 'settings' ? 'bg-white/5 text-indigo-400 border border-indigo-500/20' : 'text-gray-500 hover:bg-white/5'}`}>
                        <Settings className="w-5 h-5" /> Ajustes
                    </button>
                </nav>
                <div className="p-6 border-t border-white/5">
                    <button onClick={handleLogout} className="w-full p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-3 transition-all font-bold">
                        <LogOut className="w-4 h-4" /> Salir
                    </button>
                </div>
            </aside>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <>
                    <div
                        onClick={() => setMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] md:hidden"
                    />
                    <aside className="fixed top-0 left-0 bottom-0 w-64 border-r border-white/5 bg-black z-[101] md:hidden flex flex-col">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-600"><PawPrint className="w-5 h-5 text-white" /></div>
                                <span className="font-bold tracking-tight">Admin P&B</span>
                            </div>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-white/10 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                            <button onClick={() => { setCurrentTab('reservations'); setMobileMenuOpen(false); }} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all font-bold ${currentTab === 'reservations' ? 'bg-white/5 text-indigo-400 border border-indigo-500/20' : 'text-gray-500 hover:bg-white/5'}`}>
                                <Calendar className="w-5 h-5" /> Reservas
                            </button>
                            <button onClick={() => { setCurrentTab('services'); setMobileMenuOpen(false); }} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all font-bold ${currentTab === 'services' ? 'bg-white/5 text-indigo-400 border border-indigo-500/20' : 'text-gray-500 hover:bg-white/5'}`}>
                                <Scissors className="w-5 h-5" /> Servicios
                            </button>
                            <button onClick={() => { setCurrentTab('settings'); setMobileMenuOpen(false); }} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all font-bold ${currentTab === 'settings' ? 'bg-white/5 text-indigo-400 border border-indigo-500/20' : 'text-gray-500 hover:bg-white/5'}`}>
                                <Settings className="w-5 h-5" /> Ajustes
                            </button>
                        </nav>
                        <div className="p-4 border-t border-white/5">
                            <button onClick={handleLogout} className="w-full p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-3 transition-all font-bold">
                                <LogOut className="w-4 h-4" /> Salir
                            </button>
                        </div>
                    </aside>
                </>
            )}

            <main className="flex-1 overflow-auto">
                <header className="h-16 md:h-20 border-b border-white/5 bg-black/50 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg md:text-xl font-bold">Panel de Control</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button onClick={() => refetch()} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                            <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isLoading ? 'animate-spin text-indigo-400' : 'text-gray-400'}`} />
                        </button>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">{user.email?.[0].toUpperCase()}</div>
                    </div>
                </header>

                <div className="p-4 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
                        <div className="glass p-6 rounded-3xl border border-white/5">
                            <div className="text-gray-500 text-sm mb-1 uppercase tracking-widest font-bold">Total Reservas</div>
                            <div className="text-3xl font-bold">{appointments.length}</div>
                        </div>
                        <div className="glass p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
                            <div className="text-emerald-500/70 text-sm mb-1 uppercase tracking-widest font-bold">Ingresos</div>
                            <div className="text-3xl font-bold text-emerald-400">${appointments.reduce((a, c) => a + (c.price || 0), 0).toLocaleString()}</div>
                        </div>
                        <div className="glass p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5">
                            <div className="text-indigo-500/70 text-sm mb-1 uppercase tracking-widest font-bold">Servicios</div>
                            <div className="text-3xl font-bold text-indigo-400">{services.length}</div>
                        </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-[32px] overflow-hidden">
                        {currentTab === 'reservations' ? (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/5 text-gray-500 text-xs font-bold uppercase tracking-widest">
                                                <th className="px-8 py-5">Mascota / Dueño</th>
                                                <th className="px-6 py-5">Servicio</th>
                                                <th className="px-6 py-5">Horario (Inicio - Fin)</th>
                                                <th className="px-6 py-5">Estado</th>
                                                <th className="px-8 py-5 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {appointments.map(apt => (
                                                <tr key={apt.id} className="hover:bg-white/[0.02] transition-all group">
                                                    <td className="px-8 py-5">
                                                        <div className="font-bold">{apt.pet_name} <span className="text-[10px] text-gray-500">({apt.pet_type})</span></div>
                                                        <div className="text-xs text-gray-500">{apt.client_name} - {apt.client_phone}</div>
                                                    </td>
                                                    <td className="px-6 py-5 text-sm text-indigo-300">{apt.service_name}</td>
                                                    <td className="px-6 py-5 text-sm">
                                                        <div className="text-gray-400 mb-1">{format(new Date(apt.appointment_date + 'T12:00:00'), 'dd MMM', { locale: es })}</div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-indigo-400 font-bold">{apt.start_time}</span>
                                                            <span className="text-gray-600">→</span>
                                                            <span className="text-emerald-400 font-bold">{calculateEndTime(apt.start_time, apt.duration)}</span>
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Duración: {apt.duration} min</div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${apt.status === 'confirmed' ? 'text-emerald-400 border-emerald-400/20' : apt.status === 'cancelled' ? 'text-red-400 border-red-400/20' : 'text-amber-400 border-amber-400/20'}`}>
                                                            {apt.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {apt.status === 'pending' && <button onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'confirmed' })} className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><CheckCircle className="w-4 h-4" /></button>}
                                                            <button onClick={() => deleteAppointment(apt)} className="p-2 bg-red-500/10 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-white/5">
                                    {appointments.map(apt => (
                                        <div key={apt.id} className="p-4 hover:bg-white/[0.02] transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="font-bold text-base mb-1">{apt.pet_name} <span className="text-[10px] text-gray-500">({apt.pet_type})</span></div>
                                                    <div className="text-xs text-gray-500">{apt.client_name}</div>
                                                    <div className="text-xs text-gray-500">{apt.client_phone}</div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase border ${apt.status === 'confirmed' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : apt.status === 'cancelled' ? 'text-red-400 border-red-400/20 bg-red-400/5' : 'text-amber-400 border-amber-400/20 bg-amber-400/5'}`}>
                                                    {apt.status}
                                                </span>
                                            </div>

                                            <div className="space-y-2 mb-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Servicio</span>
                                                    <span className="text-indigo-300 font-medium">{apt.service_name}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Fecha</span>
                                                    <span className="text-gray-300">{format(new Date(apt.appointment_date + 'T12:00:00'), 'dd MMM yyyy', { locale: es })}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Horario</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-indigo-400 font-bold">{apt.start_time.substring(0, 5)}</span>
                                                        <span className="text-gray-600">→</span>
                                                        <span className="text-emerald-400 font-bold">{calculateEndTime(apt.start_time, apt.duration)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Duración</span>
                                                    <span className="text-gray-400">{apt.duration} min</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                {apt.status === 'pending' && (
                                                    <button
                                                        onClick={() => updateStatusMutation.mutate({ id: apt.id, status: 'confirmed' })}
                                                        className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Confirmar
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteAppointment(apt)}
                                                    className="flex-1 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : currentTab === 'services' ? (
                            <div>
                                <div className="p-6 flex justify-between items-center border-b border-white/5">
                                    <h2 className="font-bold">Servicios</h2>
                                    <button onClick={() => setShowAddService(!showAddService)} className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold">New</button>
                                </div>
                                {showAddService && (
                                    <form onSubmit={handleAddService} className="p-6 grid grid-cols-3 gap-4 border-b border-white/5">
                                        <input required value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} placeholder="Nombre" className="bg-black border border-white/10 rounded-xl p-2 text-sm" />
                                        <input required type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} placeholder="Precio" className="bg-black border border-white/10 rounded-xl p-2 text-sm" />
                                        <input required type="number" value={newService.duration_minutes} onChange={e => setNewService({ ...newService, duration_minutes: e.target.value })} placeholder="Min" className="bg-black border border-white/10 rounded-xl p-2 text-sm" />
                                        <select value={newService.pet_size} onChange={e => setNewService({ ...newService, pet_size: e.target.value })} className="bg-black border border-white/10 rounded-xl p-2 text-sm">
                                            <option value="Pequeño">Pequeño</option><option value="Mediano">Mediano</option><option value="Grande">Grande</option>
                                        </select>
                                        <input value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} placeholder="Desc" className="col-span-2 bg-black border border-white/10 rounded-xl p-2 text-sm" />
                                        <div className="col-span-3 flex justify-end gap-2">
                                            {editingService && <button type="button" onClick={() => { setEditingService(null); setShowAddService(false); }} className="text-gray-500">Cancel</button>}
                                            <button type="submit" className="bg-white text-black px-4 py-2 rounded-xl font-bold">Save</button>
                                        </div>
                                    </form>
                                )}
                                <table className="w-full text-left">
                                    <tbody>
                                        {services.map(s => (
                                            <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                                <td className="px-8 py-4 font-bold">{s.name}</td>
                                                <td className="px-6 py-4 text-emerald-400">${s.price.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-gray-500 text-sm">{s.pet_size}</td>
                                                <td className="px-8 py-4 text-right">
                                                    <button onClick={() => { setEditingService(s); setNewService({ name: s.name, description: s.description, price: s.price.toString(), duration_minutes: s.duration_minutes.toString(), pet_size: s.pet_size }); setShowAddService(true); }} className="p-2 text-indigo-400"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteServiceMutation.mutate(s.id)} className="p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8">
                                <h2 className="text-xl font-bold mb-8">Horarios de Atención</h2>
                                <div className="space-y-4">
                                    {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((day, idx) => {
                                        const bh = businessHours.find(h => h.day_of_week === idx);
                                        return (
                                            <div key={day} className="glass p-4 rounded-2xl flex items-center justify-between border border-white/5">
                                                <div className="w-20 font-bold">{day}</div>
                                                <div className="flex gap-4 items-center">
                                                    <input type="time" value={bh?.open_time?.substring(0, 5) || '09:00'} disabled={bh?.is_closed} onChange={e => updateHourMutation.mutate({ ...bh!, open_time: e.target.value })} className="bg-zinc-900 border border-white/10 rounded-lg p-1 text-xs" />
                                                    <input type="time" value={bh?.close_time?.substring(0, 5) || '17:00'} disabled={bh?.is_closed} onChange={e => updateHourMutation.mutate({ ...bh!, close_time: e.target.value })} className="bg-zinc-900 border border-white/10 rounded-lg p-1 text-xs" />
                                                    <button onClick={() => updateHourMutation.mutate({ ...bh!, is_closed: !bh?.is_closed })} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${bh?.is_closed ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                        {bh?.is_closed ? 'CERRADO' : 'ABIERTO'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
