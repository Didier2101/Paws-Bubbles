"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, ShoppingBag, PawPrint, Mail } from 'lucide-react';
import { supabase, Appointment } from '@/lib/supabase';
import { format, isAfter, subHours, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export default function MyBookingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
        const appointmentDateTime = parse(`${booking.appointment_date} ${booking.start_time}`, 'yyyy-MM-dd HH:mm:ss', new Date());
        const now = new Date();
        const limitTime = subHours(appointmentDateTime, 3);

        if (isAfter(now, limitTime)) {
            toast.error("Solo puedes cancelar hasta 3 horas antes.");
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
            const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', booking.id);
            if (error) throw error;
            toast.success("Cancelada correctamente.");
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        } catch (error) {
            console.error(error);
            toast.error("Error al cancelar.");
        }
    };

    const handleClose = () => {
        setSearchEmail('');
        setEmailToSearch('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[50] flex items-center justify-center md:items-start md:justify-end md:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ x: '100%', opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="relative w-full h-full md:h-auto md:max-h-[85vh] md:w-[400px] bg-white md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <ShoppingBag className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Mis Reservas</h2>
                                    <p className="text-xs text-slate-500 font-medium">Busca por email</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Form */}
                        <div className="p-4 bg-white border-b border-slate-100">
                            <form onSubmit={handleSearch} className="space-y-3">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={searchEmail}
                                        onChange={(e) => setSearchEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                >
                                    Buscar mis citas
                                </button>
                            </form>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                            {!emailToSearch ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                        <Mail className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-900 font-bold mb-1">Ingresa tu email</p>
                                    <p className="text-slate-500 text-sm">Para ver tus citas agendadas</p>
                                </div>
                            ) : isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 animate-pulse">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <div className="h-5 bg-slate-200 rounded w-2/3 mb-2"></div>
                                                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                                </div>
                                                <div className="w-16 h-6 bg-slate-200 rounded-lg"></div>
                                            </div>
                                            <div className="flex gap-3 mb-4">
                                                <div className="h-6 bg-slate-100 rounded-md w-20"></div>
                                                <div className="h-6 bg-slate-100 rounded-md w-16"></div>
                                            </div>
                                            <div className="h-9 bg-slate-100 rounded-xl"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                        <Calendar className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-900 font-bold mb-1">Sin citas registradas</p>
                                    <p className="text-slate-500 text-sm">No hay citas para {emailToSearch}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="text-xs font-bold text-slate-500 px-2">
                                        {bookings.length} {bookings.length === 1 ? 'cita encontrada' : 'citas encontradas'}
                                    </div>
                                    {bookings.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                                <PawPrint className="w-24 h-24 rotate-12" />
                                            </div>

                                            <div className="flex justify-between items-start mb-3 relative z-10">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {apt.pet_name}
                                                    </h3>
                                                    <p className="text-xs font-medium text-slate-500">{apt.service_name}</p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    apt.status === 'cancelled' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {apt.status === 'confirmed' ? 'Confirmada' : apt.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                                                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                    {format(new Date(apt.appointment_date + 'T12:00:00'), 'd MMM', { locale: es })}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                                                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                    {apt.start_time.substring(0, 5)}
                                                </div>
                                            </div>

                                            {apt.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleCancel(apt)}
                                                    className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-colors relative z-10"
                                                >
                                                    Cancelar Cita
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
