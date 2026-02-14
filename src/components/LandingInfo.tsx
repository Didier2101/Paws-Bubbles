"use client";

import { motion } from 'framer-motion';
import { Clock, MapPin, Phone, Star, Award, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface BusinessHour {
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function LandingInfo() {
    const { data: hours = [] } = useQuery<BusinessHour[]>({
        queryKey: ['business-hours'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('business_hours')
                .select('*')
                .order('day_of_week', { ascending: true });
            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 Hour
    });

    const formatTime = (time: string) => {
        if (!time) return '';
        return time.substring(0, 5);
    };

    return (
        <section id="info" className="py-24 bg-gray-50 relative overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div>
                            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase italic text-gray-900">
                                EL HOGAR DE <br />
                                <span className="text-indigo-600">LOS CONSENTIDOS</span>
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
                                En Paws & Bubbles no solo bañamos mascotas, creamos experiencias de relajación y bienestar. Nuestro equipo está certificado internacionalmente para tratar a cada peludo con la paciencia y el amor que merecen.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
                                <Star className="w-8 h-8 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                                <div className="text-2xl font-bold text-gray-900">4.9/5</div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Valoración</div>
                            </div>
                            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
                                <Award className="w-8 h-8 text-indigo-600 mb-4 group-hover:scale-110 transition-transform" />
                                <div className="text-2xl font-bold text-gray-900">+5k</div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Mascotas</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=Carrera+18+1+H+12"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-indigo-600 transition-colors"
                                >
                                    <div className="text-sm font-bold text-gray-900">Ubicación Central</div>
                                    <div className="text-xs text-gray-500 font-medium">Carrera 18 1 H 12 - Ver en Maps</div>
                                </a>
                            </div>
                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <a href="tel:3028645014" className="hover:text-emerald-600 transition-colors">
                                    <div className="text-sm font-bold text-gray-900">Llámanos</div>
                                    <div className="text-xs text-gray-500 font-medium">+57 302 864 5014</div>
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="glass p-8 md:p-12 rounded-[48px] border border-gray-200 shadow-xl relative bg-white/60"
                    >
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center -rotate-12 shadow-2xl border-4 border-white">
                            <Clock className="w-10 h-10 text-white" />
                        </div>

                        <h3 className="text-2xl font-extrabold mb-8 tracking-tight uppercase text-gray-900">Horarios de <span className="text-indigo-600">Atención</span></h3>

                        <div className="space-y-3">
                            {DAYS.map((day, idx) => {
                                const h = hours.find(h => h.day_of_week === idx);
                                return (
                                    <div key={day} className="flex items-center justify-between py-3 border-b border-gray-200/60">
                                        <span className={`text-sm font-bold ${idx === new Date().getDay() ? 'text-indigo-600' : 'text-gray-500'}`}>
                                            {day} {idx === new Date().getDay() && '• Hoy'}
                                        </span>
                                        <div className="text-sm font-black">
                                            {h?.is_closed ? (
                                                <span className="text-red-500/70">CERRADO</span>
                                            ) : (
                                                <span className="text-gray-900">
                                                    {formatTime(h?.open_time || '')} - {formatTime(h?.close_time || '')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                            <Heart className="w-5 h-5 text-indigo-600" />
                            <p className="text-xs text-indigo-800 font-medium">Recomendamos reservar con 2 días de antelación.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
