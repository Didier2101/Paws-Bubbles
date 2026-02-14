"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PawPrint, Calendar, ShoppingBag, Menu, X } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { motion, AnimatePresence } from 'framer-motion';
import MyBookingsModal from './MyBookingsModal';

export default function Header() {
    const { clientEmail, clientName } = useUserStore();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [bookingsOpen, setBookingsOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-40 py-6 bg-white/80 backdrop-blur-xl border-b border-gray-200">
                <div className="container mx-auto px-6">
                    <nav className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 group text-left">
                            <div className="p-2.5 rounded-2xl bg-indigo-600 group-hover:scale-110 group-hover:rotate-12 transition-all shadow-lg shadow-indigo-600/30">
                                <PawPrint className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tight leading-none uppercase italic text-gray-900">Paws<span className="text-indigo-600">&</span>Bubbles</span>
                                <span className="text-[8px] font-bold text-gray-500 tracking-[0.2em] uppercase mt-1">Grooming Studio</span>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-10">
                            <Link
                                href="/"
                                className={`text-xs font-black uppercase tracking-widest transition-colors ${pathname === '/' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Inicio
                            </Link>
                            <Link
                                href="/servicios"
                                className={`text-xs font-black uppercase tracking-widest transition-colors ${pathname === '/servicios' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Servicios
                            </Link>
                            <Link
                                href="/reserva"
                                className={`text-xs font-black uppercase tracking-widest transition-colors ${pathname === '/reserva' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Reservar
                            </Link>

                            {clientEmail && (
                                <button
                                    onClick={() => setBookingsOpen(true)}
                                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500 transition-all"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    Mis Reservas
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {clientEmail ? (
                                <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-gray-100 border border-gray-200">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                                        {clientName?.[0]}
                                    </div>
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter max-w-[80px] truncate">{clientName}</span>
                                </div>
                            ) : (
                                <Link
                                    href="/reserva"
                                    className="hidden md:flex px-6 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-600/20 active:scale-95"
                                >
                                    Agendar Cita
                                </Link>
                            )}

                            {/* Mobile Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-3 rounded-2xl bg-gray-100 border border-gray-200 md:hidden hover:bg-gray-200 transition-colors text-gray-900"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </nav>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-32 left-6 right-6 p-8 rounded-[40px] bg-white/90 backdrop-blur-2xl border border-gray-200 shadow-2xl z-40 md:hidden"
                        >
                            <div className="flex flex-col gap-6">
                                <Link
                                    onClick={() => setMobileMenuOpen(false)}
                                    href="/"
                                    className={`text-xl font-black uppercase italic tracking-tighter text-left ${pathname === '/' ? 'text-indigo-600' : 'text-gray-900'}`}
                                >
                                    Inicio
                                </Link>
                                <Link
                                    onClick={() => setMobileMenuOpen(false)}
                                    href="/servicios"
                                    className={`text-xl font-black uppercase italic tracking-tighter text-left ${pathname === '/servicios' ? 'text-indigo-600' : 'text-gray-900'}`}
                                >
                                    Servicios
                                </Link>
                                <Link
                                    onClick={() => setMobileMenuOpen(false)}
                                    href="/reserva"
                                    className={`text-xl font-black uppercase italic tracking-tighter text-left ${pathname === '/reserva' ? 'text-indigo-600' : 'text-gray-900'}`}
                                >
                                    Reservar
                                </Link>

                                {clientEmail && (
                                    <button
                                        onClick={() => { setMobileMenuOpen(false); setBookingsOpen(true); }}
                                        className="text-xl font-black uppercase italic tracking-tighter text-indigo-600 flex items-center gap-3"
                                    >
                                        <ShoppingBag className="w-6 h-6" /> MIS RESERVAS
                                    </button>
                                )}
                                <Link
                                    onClick={() => setMobileMenuOpen(false)}
                                    href="/reserva"
                                    className="mt-4 w-full py-5 rounded-3xl bg-indigo-600 text-white text-center font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20"
                                >
                                    <Calendar className="w-5 h-5" /> AGENDAR AHORA
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Bookings Modal - Rendered outside header to avoid z-index issues */}
            <MyBookingsModal isOpen={bookingsOpen} onClose={() => setBookingsOpen(false)} />
        </>
    );
}
