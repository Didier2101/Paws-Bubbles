"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Clock } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-indigo-200/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-purple-200/40 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold mb-6">
                            <Sparkles className="w-3 h-3" />
                            EL SPA MÁS EXCLUSIVO PARA TU MASCOTA
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-gray-900">
                            Tu mejor amigo merece <br />
                            <span className="text-gradient">un día de spa real.</span>
                        </h1>
                        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            En Paws & Bubbles combinamos técnicas profesionales con el amor que tus mascotas merecen. Baños relajantes, cortes con estilo y atención personalizada de 8 AM a 5 PM.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/reserva"
                                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-600/20 active:scale-95"
                            >
                                <Calendar className="w-5 h-5" />
                                Agendar ahora
                            </Link>
                            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                    <span>Lun - Sáb: 8:00 - 17:00</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
