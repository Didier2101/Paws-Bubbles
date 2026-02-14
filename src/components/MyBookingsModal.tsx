"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, ShoppingBag } from 'lucide-react';
import { supabase, Appointment } from '@/lib/supabase';
import { useUserStore } from '@/store/useUserStore';
import { format, isAfter, subHours, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export default function MyBookingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { clientEmail } = useUserStore();
    const queryClient = useQueryClient();

    const { data: bookings = [], isLoading } = useQuery({
        queryKey: ['my-bookings', clientEmail],
        queryFn: async () => {
            if (!clientEmail) return [];
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('client_email', clientEmail)
                .neq('status', 'cancelled')
                .order('appointment_date', { ascending: false });
            if (error) throw error;
            return data as Appointment[];
        },
        enabled: isOpen && !!clientEmail
    });

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
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#333',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener',
            background: '#18181b',
            color: '#fff',
            customClass: {
                popup: 'rounded-[32px] border border-white/10'
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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
                    />
                    <motion.div
                        initial={{ opacity: 0, x: 100, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.95 }}
                        className="fixed top-6 right-6 bottom-6 w-full max-w-md bg-zinc-900 border border-white/10 rounded-[40px] shadow-2xl z-[9999] overflow-hidden flex flex-col"
                    >
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-black uppercase italic tracking-tighter">Mis Reservas</h2>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                                        <Calendar className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No tienes citas activas</p>
                                </div>
                            ) : (
                                bookings.map((apt) => (
                                    <div key={apt.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-black text-lg uppercase italic tracking-tight group-hover:text-indigo-400 transition-colors">{apt.pet_name}</h3>
                                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{apt.service_name}</div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${apt.status === 'confirmed' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                                                apt.status === 'cancelled' ? 'text-red-400 border-red-400/20 bg-red-400/5' :
                                                    'text-amber-400 border-amber-400/20 bg-amber-400/5'
                                                }`}>
                                                {apt.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mb-6">
                                            <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(apt.appointment_date + 'T12:00:00'), 'dd MMM', { locale: es })}</div>
                                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {apt.start_time.substring(0, 5)}</div>
                                        </div>

                                        {apt.status !== 'cancelled' && (
                                            <button
                                                onClick={() => handleCancel(apt)}
                                                className="w-full py-3 rounded-2xl bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/10"
                                            >
                                                Cancelar Reserva
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
