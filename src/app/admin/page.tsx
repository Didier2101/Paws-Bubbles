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
                background: '#18181b',
                color: '#fff',
                confirmButtonColor: '#4f46e5',
                customClass: {
                    popup: 'rounded-[32px] border border-white/10'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex p-3 rounded-2xl bg-indigo-600 mb-6 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                        <PawPrint className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Panel Ejecutivo</h1>
                    <p className="text-gray-500">Acceso exclusivo para administradores</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="glass p-8 rounded-[32px] border border-white/5 space-y-6 shadow-2xl">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Email Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@pawsandbubbles.com" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-indigo-500 outline-none transition-all text-white" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-indigo-500 outline-none transition-all text-white" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-white text-black font-extrabold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group">
                            {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <>Entrar al Panel <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </div>
                </form>

                <p className="mt-8 text-center text-gray-600 text-sm">
                    ¿Problemas de acceso? Contacta a soporte técnico.
                </p>
            </div>
        </div>
    );
}
