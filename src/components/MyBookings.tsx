"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, XCircle, CheckCircle2, ShoppingBag } from 'lucide-react';
import { supabase, Appointment } from '@/lib/supabase';
import { useUserStore } from '@/store/useUserStore';
import { format, isAfter, subHours, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';

export default function MyBookings() {
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
                .order('appointment_date', { ascending: false })
                .order('start_time', { ascending: false });

            if (error) throw error;
            return data as Appointment[];
        },
        enabled: !!clientEmail
    });

    useEffect(() => {
        if (!clientEmail) return;

        // Subscribe to real-time updates for THIS user's bookings
        const channel = supabase
            .channel(`public:appointments:client_email=eq.${clientEmail}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'appointments',
                    filter: `client_email=eq.${clientEmail}`
                },
                (payload) => {
                    const newStatus = payload.new.status;
                    const oldStatus = payload.old.status;
                    const petName = payload.new.pet_name;

                    if (newStatus === 'confirmed' && oldStatus !== 'confirmed') {
                        toast.success(`¡Buenas noticias! Tu reserva para ${petName} ha sido CONFIRMADA.`, {
                            duration: 10000,
                            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        });
                    } else if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
                        toast.error(`Tu reserva para ${petName} ha sido cancelada.`);
                    }

                    queryClient.invalidateQueries({ queryKey: ['my-bookings', clientEmail] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [clientEmail, queryClient]);

    const handleCancel = async (booking: Appointment) => {
        // Check if it's 3 hours before
        const appointmentDateTime = parse(`${booking.appointment_date} ${booking.start_time}`, 'yyyy-MM-dd HH:mm:ss', new Date());
        const now = new Date();
        const limitTime = subHours(appointmentDateTime, 3);

        if (isAfter(now, limitTime)) {
            toast.error("Lo sentimos, solo puedes cancelar hasta 3 horas antes de la cita.");
            return;
        }

        const result = await Swal.fire({
            title: '¿Confirmar cancelación?',
            text: `¿Estás seguro de que deseas cancelar la reserva de ${booking.pet_name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener',
            background: '#ffffff',
            color: '#111827',
            customClass: {
                popup: 'rounded-[32px] border border-gray-200 shadow-xl'
            }
        });

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', booking.id);

            if (error) throw error;

            toast.success("Reserva cancelada con éxito.");
            queryClient.invalidateQueries({ queryKey: ['my-bookings', clientEmail] });
        } catch (error) {
            console.error(error);
            toast.error("Error al cancelar la reserva.");
        }
    };

    if (!clientEmail) return null;

    return (
        <section id="my-bookings" className="py-24 bg-gray-50 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6"
                    >
                        <ShoppingBag className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Tus Citas</span>
                    </motion.div>
                    <h2 className="text-5xl md:text-6xl font-black text-center mb-6 tracking-tighter text-gray-900">
                        MIS <span className="text-indigo-600 italic">RESERVAS</span>
                    </h2>
                    <p className="text-gray-600 text-center max-w-2xl text-lg leading-relaxed">
                        Gestiona tus citas programadas. Recuerda que puedes cancelar hasta con 3 horas de antelación.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : bookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="glass p-12 rounded-[40px] text-center border border-gray-200 bg-white"
                    >
                        <p className="text-gray-500 text-lg">Aún no tienes ninguna reserva realizada con este navegador.</p>
                        <a href="#booking" className="inline-block mt-6 text-indigo-600 font-bold hover:underline">¡Reserva tu primera cita ahora!</a>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {bookings.map((booking) => (
                                <motion.div
                                    key={booking.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="glass p-8 rounded-[40px] border border-gray-200 bg-white hover:border-indigo-200 transition-all group group-hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] relative"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            booking.status === 'cancelled' ? 'bg-red-50 text-red-500 border-red-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {booking.status === 'confirmed' ? 'Confirmada' :
                                                booking.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                                        </div>
                                        <div className="text-indigo-200 group-hover:text-indigo-600 transition-colors">
                                            <PawPrint className="w-8 h-8" />
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black mb-2 tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
                                        {booking.pet_name}
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-6 font-medium">
                                        {booking.service_name} • {booking.pet_type}
                                    </p>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                <Calendar className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div className="text-sm font-bold">
                                                {format(new Date(booking.appointment_date + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: es })}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                <Clock className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div className="text-sm font-bold">
                                                {booking.start_time.substring(0, 5)}
                                            </div>
                                        </div>
                                    </div>

                                    {booking.status !== 'cancelled' && (
                                        <button
                                            onClick={() => handleCancel(booking)}
                                            className="w-full py-4 rounded-2xl bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 border border-gray-100 hover:border-red-100 font-bold text-xs transition-all flex items-center justify-center gap-2 group/btn"
                                        >
                                            <XCircle className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                                            CANCELAR RESERVA
                                        </button>
                                    )}

                                    {booking.status === 'cancelled' && (
                                        <div className="text-center py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border border-gray-100 rounded-2xl bg-gray-50">
                                            Cita Finalizada/Cancelada
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-indigo-200/40 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-200/30 blur-[120px] rounded-full"></div>
        </section>
    );
}

function PawPrint({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
        >
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM7 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM17 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM4.5 13c-.8 0-1.5-.7-1.5-1.5S3.7 10 4.5 10 6 10.7 6 11.5 5.3 13 4.5 13zM19.5 13c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM12 22c-3.3 0-6-2.7-6-6 0-2.3 1.3-4.3 3.3-5.3.4-.2.8-.2 1.2 0l1.5.8 1.5-.8c.4-.2.8-.2 1.2 0 2 1 3.3 3 3.3 5.3 0 3.3-2.7 6-6 6z" />
        </svg>
    )
}
