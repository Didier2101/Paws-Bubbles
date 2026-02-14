"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MyBookingsModal from './MyBookingsModal';

export default function Header() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [bookingsOpen, setBookingsOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-40 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="container mx-auto px-6">
                    <nav className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-all">
                                <PawPrint className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-slate-900 tracking-tight leading-none">Paws<span className="text-indigo-600">&</span>Bubbles</span>
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Grooming Studio</span>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link
                                href="/"
                                className={`text-sm font-semibold transition-colors ${pathname === '/' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Inicio
                            </Link>
                            <Link
                                href="/servicios"
                                className={`text-sm font-semibold transition-colors ${pathname === '/servicios' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Servicios
                            </Link>
                            <Link
                                href="/reserva"
                                className={`text-sm font-semibold transition-colors ${pathname === '/reserva' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Reservar
                            </Link>

                            <button
                                onClick={() => setBookingsOpen(true)}
                                className="text-sm font-semibold transition-colors text-slate-500 hover:text-indigo-600"
                            >
                                Mis Reservas
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link
                                href="/reserva"
                                className="hidden md:flex px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5"
                            >
                                Agendar Cita
                            </Link>

                            {/* Mobile Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2.5 rounded-xl bg-slate-50 text-slate-900 md:hidden hover:bg-slate-100 transition-colors"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </nav>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden md:hidden bg-white border-t border-slate-100"
                        >
                            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
                                <Link
                                    onClick={() => setMobileMenuOpen(false)}
                                    href="/"
                                    className={`text-base font-semibold ${pathname === '/' ? 'text-indigo-600' : 'text-slate-600'}`}
                                >
                                    Inicio
                                </Link>
                                <Link
                                    onClick={() => setMobileMenuOpen(false)}
                                    href="/servicios"
                                    className={`text-base font-semibold ${pathname === '/servicios' ? 'text-indigo-600' : 'text-slate-600'}`}
                                >
                                    Servicios
                                </Link>
                                <Link
                                    onClick={() => setMobileMenuOpen(false)}
                                    href="/reserva"
                                    className={`text-base font-semibold ${pathname === '/reserva' ? 'text-indigo-600' : 'text-slate-600'}`}
                                >
                                    Reservar
                                </Link>

                                <button
                                    onClick={() => { setMobileMenuOpen(false); setBookingsOpen(true); }}
                                    className="text-base font-semibold text-slate-600 text-left"
                                >
                                    Mis Reservas
                                </button>

                                <Link
                                    onClick={() => setMobileMenuOpen(false)}
                                    href="/reserva"
                                    className="mt-2 w-full py-3 rounded-xl bg-indigo-600 text-white text-center font-bold shadow-lg shadow-indigo-200"
                                >
                                    Agendar Cita
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <MyBookingsModal isOpen={bookingsOpen} onClose={() => setBookingsOpen(false)} />
        </>
    );
}
