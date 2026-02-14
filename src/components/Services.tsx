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

    return (
        <section id="services" className="py-24 bg-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 skew-x-12 -z-10" />

            <div className="container mx-auto px-6 relative z-10 mb-16 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6"
                >
                    <Star className="w-3 h-3 text-indigo-500 fill-indigo-500" /> Experiencia Premium
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-slate-900">
                    Elige el <span className="text-indigo-600">Estilo Perfecto</span>
                </h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
                    Nuestros servicios están diseñados para consentir a tu mascota con los mejores productos y técnicas.
                </p>
            </div>

            <div className="container mx-auto px-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-[400px] rounded-3xl bg-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {dbServices.slice(0, 3).map((service, index) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group bg-white border border-slate-100 rounded-3xl p-8 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    {ICON_MAP[service.pet_size]}
                                </div>

                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                                    {ICON_MAP[service.pet_size] || <Droplets className="w-6 h-6" />}
                                </div>

                                <h3 className="text-2xl font-bold mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {service.name}
                                </h3>

                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-3xl font-bold text-slate-900">${service.price.toLocaleString()}</span>
                                    <span className="text-sm font-medium text-slate-500">/ sesión</span>
                                </div>

                                <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">
                                    {service.description}
                                </p>

                                <div className="flex items-center justify-between mt-auto">
                                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        {service.pet_size}
                                    </span>
                                    <Link
                                        href="/reserva"
                                        className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                <div className="flex justify-center mt-16">
                    <Link
                        href="/servicios"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1"
                    >
                        Ver todos los servicios <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
