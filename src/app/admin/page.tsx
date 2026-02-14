"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { PawPrint, Lock, Mail, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (error) throw error;
            router.push('/admin/dashboard');
        } catch (error: unknown) {
            console.error("Login detail error:", error);
            const message = error instanceof Error ? error.message : "Error al iniciar sesión";
            Swal.fire({
                title: 'Error de Acceso',
                text: message,
                icon: 'error',
                background: '#ffffff',
                color: '#111827',
                confirmButtonColor: '#4f46e5',
                customClass: {
                    popup: 'rounded-[32px] border border-gray-200 shadow-xl'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-50 via-gray-50 to-gray-50">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex p-3 rounded-2xl bg-indigo-600 mb-6 shadow-xl shadow-indigo-600/20">
                        <PawPrint className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel Ejecutivo</h1>
                    <p className="text-gray-500">Acceso exclusivo para administradores</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="glass p-8 rounded-[32px] border border-gray-200 space-y-6 shadow-xl bg-white">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Email Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@pawsandbubbles.com"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:border-indigo-600 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:border-indigo-600 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-600/20">
                            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Entrar al Panel <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-gray-500 text-sm">
                    ¿Problemas de acceso? Contacta a soporte técnico.
                </p>
            </div>
        </div>
    );
}
