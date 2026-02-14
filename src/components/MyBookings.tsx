"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, XCircle, ShoppingBag, PawPrint, Plus, Mail } from 'lucide-react';
import { supabase, Appointment } from '@/lib/supabase';
import { format, isAfter, subHours, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';

export default function MyBookings() {
    const [searchEmail, setSearchEmail] = useState('');
    const [emailToSearch, setEmailToSearch] = useState('');
    const queryClient = useQueryClient();

    const { data: bookings = [], isLoading } = useQuery({
        queryKey: ['my-bookings', emailToSearch],
        queryFn: async () => {
            if (!emailToSearch) return [];

            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .ilike('client_email', emailToSearch.trim())
                .order('appointment_date', { ascending: false })
                .order('start_time', { ascending: false });

            if (error) throw error;
            return data as Appointment[];
        },
        enabled: !!emailToSearch
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchEmail.trim()) {
            setEmailToSearch(searchEmail.trim().toLowerCase());
        }
    };

    const handleCancel = async (booking: Appointment) => {
        const appointmentDateTime = parse(
            `${booking.appointment_date} ${booking.start_time}`,
            'yyyy-MM-dd HH:mm:ss',
            new Date()
        );
        const now = new Date();
        const limitTime = subHours(appointmentDateTime, 3);

        if (isAfter(now, limitTime)) {
            toast.error('Solo puedes cancelar hasta 3 horas antes de la cita.');
            return;
        }

        const result = await Swal.fire({
            title: '¿Cancelar cita?',
            text: `¿Estás seguro de cancelar la reserva de ${booking.pet_name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener',
            background: '#ffffff',
            color: '#1e293b',
            customClass: {
                popup: 'rounded-2xl border border-slate-100 shadow-xl'
            }
        });

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', booking.id);

            if (error) throw error;

            toast.success('Cita cancelada correctamente');
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        } catch (error) {
            console.error('Error al cancelar:', error);
            toast.error('Error al cancelar la cita');
        }
    };

    return (
        <section id="my-bookings" className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
                <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-100 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-100 rounded-full blur-[120px]"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm text-slate-800 text-sm font-semibold mb-6"
                    >
                        <ShoppingBag className="w-4 h-4 text-indigo-500" />
                        <span>Gestiona tus Citas</span>
                    </motion.div>

                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
                        Mis <span className="text-indigo-600">Reservas</span>
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                        Busca tus citas agendadas ingresando tu email
                    </p>
                </div>

                {/* Search Form */}
                <div className="max-w-md mx-auto mb-12">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                placeholder="Ingresa tu email"
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white shadow-sm"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1"
                        >
                            Buscar mis citas
                        </button>
                    </form>
                </div>

                {/* Results */}
                {!emailToSearch ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="bg-white p-12 rounded-2xl text-center border border-slate-100 shadow-sm max-w-lg mx-auto"
                    >
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Busca tus citas</h3>
                        <p className="text-slate-500 mb-8">Ingresa tu email para ver todas tus reservas</p>
                    </motion.div>
                ) : isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 animate-pulse">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-full bg-slate-200"></div>
                                    <div className="flex-1">
                                        <div className="h-5 bg-slate-200 rounded-lg w-3/4 mb-2"></div>
                                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-6 bg-slate-50/50 p-4 rounded-xl">
                                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                                </div>
                                <div className="h-10 bg-slate-100 rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="bg-white p-12 rounded-2xl text-center border border-slate-100 shadow-sm max-w-lg mx-auto"
                    >
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <PawPrint className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">¡Sin citas registradas!</h3>
                        <p className="text-slate-500 mb-8">No encontramos citas para {emailToSearch}</p>

                        <a href="#booking" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-400/20 transform hover:-translate-y-1">
                            <Plus className="w-5 h-5" />
                            Agendar Primera Cita
                        </a>
                    </motion.div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <p className="text-sm font-bold text-slate-600">
                                {bookings.length} {bookings.length === 1 ? 'cita encontrada' : 'citas encontradas'} para <span className="text-indigo-600">{emailToSearch}</span>
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {bookings.map((booking) => (
                                    <motion.div
                                        key={booking.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                            <PawPrint className="w-32 h-32 rotate-12" />
                                        </div>

                                        <div className="flex items-start gap-4 mb-6 relative z-10">
                                            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                <PawPrint className="w-8 h-8 text-indigo-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                                    {booking.pet_name}
                                                </h3>
                                                <p className="text-sm text-slate-500 font-medium">{booking.pet_type}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                booking.status === 'cancelled' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                {booking.status === 'confirmed' ? 'Confirmada' : booking.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-xl p-4 mb-6 space-y-2 relative z-10">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Servicio:</span>
                                                <span className="font-bold text-slate-900">{booking.service_name}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4 text-indigo-500" />
                                                    Fecha:
                                                </span>
                                                <span className="font-bold text-slate-900">
                                                    {format(new Date(booking.appointment_date + 'T12:00:00'), 'd MMM yyyy', { locale: es })}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Hora:</span>
                                                <span className="font-bold text-slate-900">{booking.start_time.substring(0, 5)}</span>
                                            </div>
                                        </div>

                                        {booking.status !== 'cancelled' && (
                                            <button
                                                onClick={() => handleCancel(booking)}
                                                className="w-full py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all relative z-10 flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Cancelar Cita
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
