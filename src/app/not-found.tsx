"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Home, Search, AlertTriangle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-2xl"
            >
                {/* 404 Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mb-8 flex justify-center"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-600/20 blur-3xl rounded-full" />
                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                            <AlertTriangle className="w-16 h-16 text-white" />
                        </div>
                    </div>
                </motion.div>

                {/* 404 Text */}
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-4"
                >
                    404
                </motion.h1>

                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-tight"
                >
                    Página No Encontrada
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-400 mb-8 text-lg max-w-md mx-auto"
                >
                    Lo sentimos, la página que buscas no existe o ha sido movida.
                </motion.p>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link
                        href="/"
                        className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-105"
                    >
                        <Home className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                        Volver al Inicio
                    </Link>

                    <Link
                        href="/servicios"
                        className="group px-8 py-4 bg-white/5 hover:bg-white/10 border-2 border-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3"
                    >
                        <Search className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Ver Servicios
                    </Link>
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -z-10" />
            </motion.div>
        </div>
    );
}
