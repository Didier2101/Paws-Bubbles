"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, Star } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative pt-32 pb-24 overflow-hidden bg-slate-50">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-100/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-100/40 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-sm text-slate-800 text-sm font-semibold mb-8">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span>Cuidado Premium para Mascotas</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight text-slate-900">
                            Dale a tu peludo el <br />
                            <span className="text-indigo-600 relative inline-block">
                                amor que merece
                                <span className="absolute bottom-2 left-0 w-full h-3 bg-indigo-200/30 -z-10 rounded-full"></span>
                            </span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Baños relajantes, cortes con estilo y atención personalizada. Agenda tu cita en segundos y regálale un día de spa inolvidable.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/reserva"
                                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:-translate-y-1"
                            >
                                <Calendar className="w-5 h-5" />
                                Agendar Cita
                            </Link>
                            <div className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-600 font-medium">
                                <Clock className="w-5 h-5 text-indigo-500" />
                                <span>Lun - Sáb: 8:00 - 17:00</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
