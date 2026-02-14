"use client";

import Booking from "./Booking";
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export default function BookingSection() {
    return (
        <section id="booking" className="py-24 bg-gray-50 relative">
            <div className="container mx-auto px-6">
                <div className="flex flex-col items-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6"
                    >
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Reserva en Línea</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-black text-center mb-6 tracking-tighter uppercase italic text-gray-900">
                        AGENDA TU <span className="text-indigo-600">CITA</span>
                    </h2>
                    <p className="text-gray-600 text-center max-w-2xl text-lg leading-relaxed">
                        Completa el formulario a continuación para asegurar el mejor cuidado para tu compañero. ¡Nos pondremos en contacto pronto!
                    </p>
                </div>

                <div className="glass p-1 md:p-1 rounded-[48px] border border-gray-200 bg-white/50">
                    <Booking />
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none opacity-40">
                <div className="absolute top-1/2 left-[10%] w-96 h-96 bg-indigo-200/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-purple-200/40 rounded-full blur-[120px]" />
            </div>
        </section>
    );
}
