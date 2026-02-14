"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
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

export default function ServiciosPage() {
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
        <main className="min-h-screen bg-gray-50">
            <Header />

            <section className="pt-40 pb-32">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mb-20">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black tracking-widest uppercase mb-4"
                        >
                            <Star className="w-3 h-3" /> CATÁLOGO COMPLETO
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic mb-6 text-gray-900">
                            Todos nuestros <span className="text-indigo-600 text-gradient">Servicios</span>
                        </h1>
                        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
                            Explora nuestra lista completa de servicios diseñados para cada tipo de mascota. Calidad premium y cuidado excepcional garantizado.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {isLoading ? (
                            [1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-[400px] rounded-[48px] bg-gray-200 animate-pulse border border-gray-100" />
                            ))
                        ) : (
                            dbServices.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative flex flex-col h-full bg-white border border-gray-200 rounded-[48px] p-10 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-500 shadow-xl"
                                >
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                            {ICON_MAP[service.pet_size] || <Droplets className="w-8 h-8" />}
                                        </div>
                                        <div className="text-4xl font-black text-gray-100 group-hover:text-indigo-100 transition-colors uppercase italic">
                                            {service.pet_size[0]}
                                        </div>
                                    </div>

                                    <h3 className="text-3xl font-black mb-2 tracking-tight text-gray-900 uppercase italic group-hover:text-indigo-600 transition-colors">
                                        {service.name}
                                    </h3>

                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="text-2xl font-black text-indigo-600">${service.price.toLocaleString()}</div>
                                        <div className="px-3 py-1 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 uppercase tracking-widest border border-gray-200">
                                            {service.pet_size}
                                        </div>
                                    </div>

                                    <p className="text-gray-500 text-sm leading-relaxed mb-10 flex-grow">
                                        {service.description}
                                    </p>

                                    <Link
                                        href="/reserva"
                                        className="inline-flex items-center justify-center gap-3 w-full py-5 rounded-3xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 hover:shadow-lg transition-all duration-300"
                                    >
                                        Agendar ahora <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
