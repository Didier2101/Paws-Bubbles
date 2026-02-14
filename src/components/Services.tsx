"use client";

import { motion } from 'framer-motion';
import { Sparkles, Scissors, Droplets, ArrowRight, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const ICON_MAP: Record<string, React.ReactNode> = {
    "Pequeño": <Droplets className="w-6 h-6" />,
    "Mediano": <Scissors className="w-6 h-6" />,
    "Grande": <Sparkles className="w-6 h-6" />,
};

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
    pet_size: string;
}

export default function Services() {
    const { data: dbServices = [], isLoading } = useQuery<Service[]>({
        queryKey: ['services'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('price', { ascending: true });
            if (error) throw error;
            return data as Service[];
        },
        staleTime: 1000 * 60 * 10,
    });

    // Triple the services for infinite looping
    const displayServices = [...dbServices, ...dbServices, ...dbServices];

    return (
        <section id="services" className="py-32 bg-gray-50 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10 mb-16 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black tracking-widest uppercase mb-4"
                >
                    <Star className="w-3 h-3" /> EXPERIENCIA PREMIUM
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase italic text-gray-900">
                    ELIGE TU <span className="text-gradient">ESTILO</span>
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-sm leading-relaxed">
                    Desliza para explorar nuestros servicios o pasa el ratón para pausar y agendar.
                </p>
            </div>

            {/* Marquee with Pause on Hover */}
            <div className="relative">
                <div className="flex overflow-hidden py-10">
                    <motion.div
                        animate={{ x: [0, -100 * dbServices.length + "%"] }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: 400, // Extremely slow - almost imperceptible
                                ease: "linear",
                            }
                        }}
                        whileHover={{ animationPlayState: "paused" }}
                        className="flex gap-8 whitespace-nowrap px-4"
                    >
                        {isLoading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="min-w-[400px] h-[300px] rounded-[48px] bg-gray-200 animate-pulse" />
                            ))
                        ) : (
                            displayServices.map((service, index) => (
                                <div
                                    key={`${service.id}-${index}`}
                                    className="min-w-[400px] group relative bg-white border border-gray-100 rounded-[48px] p-10 hover:bg-gray-50 hover:border-indigo-200 transition-all duration-500 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-indigo-500/10"
                                >
                                    {/* Icon & Index */}
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                            {ICON_MAP[service.pet_size] || <Droplets className="w-8 h-8" />}
                                        </div>
                                        <div className="text-4xl font-black text-gray-100 group-hover:text-indigo-50 transition-colors uppercase italic">
                                            {service.pet_size[0]}
                                        </div>
                                    </div>

                                    {/* Title & Price */}
                                    <h3 className="text-3xl font-black mb-2 tracking-tight text-gray-900 uppercase italic group-hover:text-indigo-600 transition-colors">
                                        {service.name}
                                    </h3>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="text-2xl font-black text-indigo-600">${service.price.toLocaleString()}</div>
                                        <div className="px-3 py-1 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-widest border border-gray-200">{service.pet_size}</div>
                                    </div>

                                    <p className="text-gray-500 text-sm whitespace-normal leading-relaxed mb-10 line-clamp-2">
                                        {service.description}
                                    </p>

                                    <Link
                                        href="/reserva"
                                        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gray-100 border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-indigo-600 hover:text-white transition-all duration-300 group/btn"
                                    >
                                        Agendar ahora <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>

                                    {/* Glow bottom decor */}
                                    <div className="absolute bottom-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>
                            ))
                        )}
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mt-12"
                >
                    <Link
                        href="/servicios"
                        className="group flex items-center gap-3 px-8 py-4 rounded-3xl bg-white border border-gray-200 text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-lg hover:shadow-indigo-600/20"
                    >
                        Ver todos los servicios <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            </div>

            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none opacity-20">
                <div className="absolute top-[30%] left-[60%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
            </div>
        </section>
    );
}
