"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, CheckCircle2, CalendarPlus, PawPrint, User, Mail, Phone, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/useUserStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
    pet_size: string;
}

interface BusinessHour {
    id: string;
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
}

interface Appointment {
    id: string;
    pet_name: string;
    pet_type: string;
    service_name: string;
    duration: number;
    appointment_date: string;
    start_time: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    price: number;
    status: string;
}

export default function Booking() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const queryClient = useQueryClient();

    const { data: dbServices, isLoading: isLoadingServices } = useQuery<Service[]>({
        queryKey: ['services'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('price', { ascending: true });
            if (error) throw error;
            return data as Service[];
        }
    });

    const { clientName, clientEmail, clientPhone, setUserData } = useUserStore();

    const [formData, setFormData] = useState({
        pet_name: '',
        pet_type: '',
        service: '',
        duration: 90,
        price: 35000,
        date: '',
        time: '',
        client_name: '',
        client_email: '',
        client_phone: ''
    });

    const { data: minDate = format(startOfToday(), 'yyyy-MM-dd') } = useQuery({
        queryKey: ['min-date'],
        queryFn: async () => {
            const today = startOfToday();
            const { data: hours } = await supabase.from('business_hours').select('*').eq('day_of_week', today.getDay()).single();
            if (!hours || hours.is_closed) return format(addDays(today, 1), 'yyyy-MM-dd');
            const [h, m] = hours.close_time.split(':').map(Number);
            const closeMin = h * 60 + m;
            const now = new Date();
            const nowMin = now.getHours() * 60 + now.getMinutes();
            return nowMin >= closeMin - 45 ? format(addDays(today, 1), 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd');
        }
    });

    useEffect(() => {
        if (minDate && !formData.date) setFormData(prev => ({ ...prev, date: minDate }));
    }, [minDate, formData.date]);

    useEffect(() => {
        if (dbServices && dbServices.length > 0 && !formData.service) {
            const s = dbServices[0];
            setFormData(prev => ({ ...prev, service: s.name, pet_type: s.pet_size, duration: s.duration_minutes, price: s.price }));
        }
    }, [dbServices, formData.service]);

    const { data: availabilityData, isLoading: isLoadingAvailability } = useQuery<{ businessHour: BusinessHour, apts: Appointment[] } | null>({
        queryKey: ['availability-data', formData.date],
        queryFn: async () => {
            const { data: apts } = await supabase.from('appointments').select('*').eq('appointment_date', formData.date).neq('status', 'cancelled');
            const dateObj = new Date(formData.date + 'T12:00:00');
            const { data: businessHour } = await supabase.from('business_hours').select('*').eq('day_of_week', dateObj.getDay()).single();
            const { data: isClosedDay } = await supabase.from('closed_days').select('id').eq('closed_date', formData.date).maybeSingle();
            if (!businessHour || businessHour.is_closed || isClosedDay) return null;
            return { businessHour: businessHour as BusinessHour, apts: (apts as Appointment[]) || [] };
        },
        enabled: !!formData.date
    });

    const slots = useQuery({
        queryKey: ['slots', formData.date, formData.duration, availabilityData],
        queryFn: () => {
            if (!availabilityData) return [];
            const { businessHour, apts } = availabilityData;
            const timeToMin = (t: string) => { const p = t.split(':').map(Number); return p[0] * 60 + p[1]; };
            const occupied = apts.map(a => ({ start: timeToMin(a.start_time), end: timeToMin(a.start_time) + a.duration }));
            const openMin = timeToMin(businessHour.open_time);
            const closeMin = timeToMin(businessHour.close_time);
            const interval = 15;
            const result = [];
            const now = new Date();
            const isToday = formData.date === format(now, 'yyyy-MM-dd');
            const nowMin = now.getHours() * 60 + now.getMinutes();

            for (let m = openMin; m < closeMin; m += interval) {
                const end = m + formData.duration;
                if (end > closeMin) continue;
                const h = Math.floor(m / 60).toString().padStart(2, '0');
                const ms = (m % 60).toString().padStart(2, '0');
                const time = `${h}:${ms}`;
                const overlap = occupied.some(o => (m < o.end && end > o.start));
                const past = isToday && m <= nowMin + 45;
                result.push({ time, isAvailable: !overlap && !past });
            }
            return result;
        },
        enabled: !!availabilityData
    }).data || [];

    const isLoadingSlots = isLoadingAvailability;

    const goToNextDay = () => {
        const nextDay = format(addDays(new Date(formData.date + 'T12:00:00'), 1), 'yyyy-MM-dd');
        setFormData({ ...formData, date: nextDay, time: '' });
    };

    useEffect(() => {
        if (clientName || clientEmail || clientPhone) {
            setFormData(prev => ({ ...prev, client_name: clientName, client_email: clientEmail, client_phone: clientPhone }));
        }
    }, [clientName, clientEmail, clientPhone]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const selectServiceByPetSize = (size: string) => {
        const s = dbServices?.find(s => s.pet_size === size);
        if (s) setFormData({ ...formData, pet_type: size, service: s.name, duration: s.duration_minutes, price: s.price, time: '' });
    };

    const selectSpecificService = (s: Service) => {
        setFormData({ ...formData, service: s.name, duration: s.duration_minutes, price: s.price, time: '' });
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: existing } = await supabase.from('appointments').select('id').eq('appointment_date', formData.date).eq('start_time', formData.time).neq('status', 'cancelled').maybeSingle();
            if (existing) {
                toast.error("Lo sentimos, esta hora acaba de ser reservada.");
                queryClient.invalidateQueries({ queryKey: ['availability-data'] });
                return;
            }
            const { error } = await supabase.from('appointments').insert([{
                pet_name: formData.pet_name,
                pet_type: formData.pet_type,
                service_name: formData.service,
                duration: formData.duration,
                appointment_date: formData.date,
                start_time: formData.time,
                client_name: formData.client_name,
                client_email: formData.client_email,
                client_phone: formData.client_phone,
                price: formData.price,
                status: 'pending'
            }]);
            if (error) throw error;
            setUserData({ name: formData.client_name, email: formData.client_email, phone: formData.client_phone });
            setSuccess(true);
            toast.success("¡Reserva realizada con éxito!");
        } catch (error) {
            console.error("Booking error:", error);
            toast.error("Error al procesar la reserva");
        } finally {
            setLoading(false);
        }
    };

    const canProceedStep1 = formData.pet_name && formData.pet_type && formData.service;
    const canProceedStep2 = formData.date && formData.time;
    const canProceedStep3 = formData.client_name && formData.client_email && formData.client_phone;

    if (success) {
        return (
            <div className="flex items-center justify-center p-4 min-h-[600px]">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass p-10 rounded-[48px] text-center max-w-2xl border border-white/10 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-30">
                        <div className="absolute top-[20%] left-[50%] w-96 h-96 bg-emerald-500/30 rounded-full blur-[120px]" />
                    </div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-28 h-28 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20"
                    >
                        <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                    </motion.div>

                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">
                        ¡RESERVA <span className="text-emerald-400">CONFIRMADA!</span>
                    </h2>

                    <p className="text-gray-400 mb-4 text-base leading-relaxed">
                        Hemos recibido tu solicitud para <span className="text-white font-bold">{formData.pet_name}</span>
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Fecha</div>
                                <div className="text-white font-bold">{format(new Date(formData.date + 'T12:00:00'), 'dd MMMM yyyy', { locale: es })}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Hora</div>
                                <div className="text-white font-bold">{formData.time}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Servicio</div>
                                <div className="text-white font-bold">{formData.service}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total</div>
                                <div className="text-emerald-400 font-black text-xl">${formData.price.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            href="/"
                            className="w-full py-5 bg-white/5 border-2 border-white/10 text-white font-bold rounded-3xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                        >
                            Ir al Inicio
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-5 bg-white text-black font-black rounded-3xl hover:bg-emerald-400 hover:text-white transition-all flex items-center justify-center gap-3 group text-sm uppercase tracking-widest shadow-xl"
                        >
                            <CalendarPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            Agendar otra cita
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl w-full mx-auto p-4">
            {/* Progress Indicator */}
            <div className="mb-12">
                <div className="flex items-center justify-center gap-4 mb-6">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-4">
                            <motion.div
                                animate={{
                                    scale: step === s ? 1.1 : 1,
                                    backgroundColor: step >= s ? 'rgb(99 102 241)' : 'rgba(255,255,255,0.05)'
                                }}
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-black border-2 transition-all ${step >= s ? 'border-indigo-500 text-white' : 'border-white/10 text-gray-600'
                                    }`}
                            >
                                {s}
                            </motion.div>
                            {s < 3 && <div className={`w-16 h-1 rounded-full transition-all ${step > s ? 'bg-indigo-500' : 'bg-white/10'}`} />}
                        </div>
                    ))}
                </div>
                <div className="text-center">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                        {step === 1 && "Selecciona el Servicio"}
                        {step === 2 && "Elige Fecha y Hora"}
                        {step === 3 && "Confirma tus Datos"}
                    </h3>
                </div>
            </div>

            <form onSubmit={handleBooking} className="glass rounded-[48px] border border-white/10 shadow-2xl overflow-hidden">
                <AnimatePresence mode="wait">
                    {/* STEP 1: Service Selection */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="p-8 space-y-6"
                        >
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-sm font-black text-gray-400 uppercase tracking-widest">
                                    <PawPrint className="w-5 h-5 text-indigo-400" />
                                    Nombre de tu Mascota
                                </label>
                                <input
                                    required
                                    name="pet_name"
                                    value={formData.pet_name}
                                    onChange={handleInputChange}
                                    type="text"
                                    placeholder="Ej: Toby, Luna, Max..."
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-3xl px-8 py-5 text-lg focus:border-indigo-500 outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-black text-gray-400 uppercase tracking-widest">Tamaño de tu Mascota</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {['Pequeño', 'Mediano', 'Grande'].map(size => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => selectServiceByPetSize(size)}
                                            className={`p-6 rounded-3xl border-2 transition-all font-bold text-sm uppercase tracking-wider ${formData.pet_type === size
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-indigo-500/50'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-black text-gray-400 uppercase tracking-widest">Selecciona el Servicio</label>
                                {isLoadingServices ? (
                                    <div className="text-center text-gray-500 py-8 animate-pulse">Cargando servicios...</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {dbServices?.filter(s => s.pet_size === formData.pet_type).map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => selectSpecificService(s)}
                                                className={`p-6 rounded-3xl border-2 text-left transition-all group ${formData.service === s.name
                                                    ? 'border-indigo-500 bg-indigo-500/20 shadow-xl shadow-indigo-500/10'
                                                    : 'border-white/10 bg-white/5 hover:border-indigo-500/50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="font-black text-xl text-white group-hover:text-indigo-400 transition-colors">{s.name}</div>
                                                    <div className="text-2xl font-black text-indigo-400">${s.price.toLocaleString()}</div>
                                                </div>
                                                <div className="text-sm text-gray-400 leading-relaxed">{s.description}</div>
                                                <div className="mt-3 text-xs text-gray-500 font-bold">Duración: {s.duration_minutes} minutos</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => canProceedStep1 && setStep(2)}
                                disabled={!canProceedStep1}
                                className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-xl"
                            >
                                Siguiente Paso <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: Date & Time */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="p-8 space-y-6"
                        >
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-sm font-black text-gray-400 uppercase tracking-widest">
                                    <CalendarIcon className="w-5 h-5 text-indigo-400" />
                                    Selecciona la Fecha
                                </label>
                                <input
                                    required
                                    name="date"
                                    type="date"
                                    min={minDate}
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-3xl px-8 py-5 text-lg focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="flex items-center gap-3 text-sm font-black text-gray-400 uppercase tracking-widest">
                                        <Clock className="w-5 h-5 text-indigo-400" />
                                        Hora Disponible
                                    </label>
                                    {availabilityData && (
                                        <span className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                            {availabilityData.businessHour.open_time.substring(0, 5)} - {availabilityData.businessHour.close_time.substring(0, 5)}
                                        </span>
                                    )}
                                </div>

                                {isLoadingSlots ? (
                                    <div className="py-8 text-center text-gray-500 animate-pulse">Cargando horarios...</div>
                                ) : slots.length > 0 ? (
                                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                        {slots.map(s => (
                                            <button
                                                key={s.time}
                                                type="button"
                                                disabled={!s.isAvailable}
                                                onClick={() => s.isAvailable && setFormData({ ...formData, time: s.time })}
                                                className={`py-4 rounded-2xl border-2 text-sm font-bold transition-all ${formData.time === s.time
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl'
                                                    : s.isAvailable
                                                        ? 'bg-white/5 border-white/10 text-gray-300 hover:border-indigo-500/50'
                                                        : 'bg-red-500/5 border-red-500/10 text-red-900/30 cursor-not-allowed line-through'
                                                    }`}
                                            >
                                                {s.time}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 bg-amber-500/10 border-2 border-amber-500/20 rounded-[32px] text-center space-y-4">
                                        <Sparkles className="w-12 h-12 text-amber-500 mx-auto" />
                                        <div className="text-amber-400 font-black text-lg uppercase tracking-tight">Sin Cupos Disponibles</div>
                                        <p className="text-gray-400 text-sm">Este día está completamente reservado. ¿Quieres ver el siguiente día?</p>
                                        <button
                                            type="button"
                                            onClick={goToNextDay}
                                            className="px-8 py-4 bg-amber-500 text-black font-black rounded-3xl text-xs hover:bg-amber-400 transition-all flex items-center justify-center gap-2 mx-auto uppercase tracking-widest"
                                        >
                                            Ver {format(addDays(new Date(formData.date + 'T12:00:00'), 1), 'dd MMM', { locale: es })}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-6 bg-white/5 border-2 border-white/10 text-white font-bold rounded-3xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                                >
                                    <ArrowLeft className="w-5 h-5" /> Atrás
                                </button>
                                <button
                                    type="button"
                                    onClick={() => canProceedStep2 && setStep(3)}
                                    disabled={!canProceedStep2}
                                    className="flex-[2] py-6 bg-indigo-600 text-white font-black rounded-3xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-xl"
                                >
                                    Siguiente Paso <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Contact Info */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="p-8 space-y-6"
                        >
                            <div className="bg-indigo-500/10 border-2 border-indigo-500/20 rounded-3xl p-6 mb-6">
                                <h4 className="text-xl font-black text-white mb-4 uppercase tracking-tight">Resumen de tu Reserva</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-500 font-bold uppercase text-xs mb-1">Mascota</div>
                                        <div className="text-white font-bold">{formData.pet_name}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 font-bold uppercase text-xs mb-1">Servicio</div>
                                        <div className="text-white font-bold">{formData.service}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 font-bold uppercase text-xs mb-1">Fecha</div>
                                        <div className="text-white font-bold">{format(new Date(formData.date + 'T12:00:00'), 'dd MMMM', { locale: es })}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 font-bold uppercase text-xs mb-1">Hora</div>
                                        <div className="text-white font-bold">{formData.time}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-sm font-black text-gray-400 uppercase tracking-widest">
                                    <User className="w-5 h-5 text-indigo-400" />
                                    Tu Nombre Completo
                                </label>
                                <input
                                    required
                                    name="client_name"
                                    value={formData.client_name}
                                    onChange={handleInputChange}
                                    type="text"
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-3xl px-8 py-5 text-lg focus:border-indigo-500 outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 text-sm font-black text-gray-400 uppercase tracking-widest">
                                        <Mail className="w-5 h-5 text-indigo-400" />
                                        Email
                                    </label>
                                    <input
                                        required
                                        name="client_email"
                                        value={formData.client_email}
                                        onChange={handleInputChange}
                                        type="email"
                                        placeholder="tu@email.com"
                                        className="w-full bg-white/5 border-2 border-white/10 rounded-3xl px-8 py-5 text-lg focus:border-indigo-500 outline-none transition-all placeholder:text-gray-600"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 text-sm font-black text-gray-400 uppercase tracking-widest">
                                        <Phone className="w-5 h-5 text-indigo-400" />
                                        Teléfono
                                    </label>
                                    <input
                                        required
                                        name="client_phone"
                                        value={formData.client_phone}
                                        onChange={handleInputChange}
                                        type="tel"
                                        placeholder="3001234567"
                                        className="w-full bg-white/5 border-2 border-white/10 rounded-3xl px-8 py-5 text-lg focus:border-indigo-500 outline-none transition-all placeholder:text-gray-600"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-6 bg-white/5 border-2 border-white/10 text-white font-bold rounded-3xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                                >
                                    <ArrowLeft className="w-5 h-5" /> Atrás
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !canProceedStep3}
                                    className="flex-[2] py-6 bg-emerald-600 text-white font-black rounded-3xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/20"
                                >
                                    {loading ? 'Procesando...' : 'Confirmar Reserva'} <CheckCircle2 className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
}
