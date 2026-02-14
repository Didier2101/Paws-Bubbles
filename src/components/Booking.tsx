"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, CheckCircle2, PawPrint, User, Mail, Phone, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfToday, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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
    const [currentMonth, setCurrentMonth] = useState(new Date());
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
                client_email: formData.client_email.trim().toLowerCase(),
                client_phone: formData.client_phone,
                price: formData.price,
                status: 'confirmed'
            }]);
            if (error) throw error;

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

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth), { locale: es }),
        end: endOfWeek(endOfMonth(currentMonth), { locale: es })
    });

    if (success) {
        return (
            <div className="flex items-center justify-center p-4 min-h-[600px] relative z-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-10 rounded-[32px] text-center max-w-xl shadow-2xl relative overflow-hidden ring-1 ring-slate-100"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-gradient-to-b from-indigo-50/50 to-transparent" />

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-24 h-24 bg-emerald-100/50 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-50"
                    >
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </motion.div>

                    <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Todo listo!</h2>
                    <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                        Tu cita para <span className="text-slate-900 font-semibold">{formData.pet_name}</span> ha sido Confirmada.
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-left">
                            <div className="col-span-1">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Fecha</div>
                                <div className="text-slate-900 font-semibold text-sm">{format(new Date(formData.date + 'T12:00:00'), 'dd MMM yyyy', { locale: es })}</div>
                            </div>
                            <div className="col-span-1">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Hora</div>
                                <div className="text-slate-900 font-semibold text-sm">{formData.time}</div>
                            </div>
                            <div className="col-span-2 border-t border-slate-200 my-1"></div>
                            <div className="col-span-2 flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Servicio</div>
                                    <div className="text-slate-900 font-bold text-sm">{formData.service}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total</div>
                                    <div className="text-emerald-600 font-black text-lg">${formData.price.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link
                            href="/"
                            className="w-full py-4 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                        >
                            Volver al Inicio
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                        >
                            Agendar otra cita
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl w-full mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Steps Sidebar / Topbar */}
                <div className="md:col-span-4 lg:col-span-3">
                    <div className="sticky top-8 space-y-8">
                        <div className="text-left">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Reserva tu cita</h2>
                            <p className="text-slate-500 text-sm">Sigue los pasos para consentir a tu mascota.</p>
                        </div>

                        <div className="flex md:flex-col gap-4">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-3 group">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                                        ${step === s
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105'
                                            : step > s
                                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                : 'bg-white text-slate-300 border border-slate-100'}
                                    `}>
                                        {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                    </div>
                                    <div className={`hidden md:block text-sm font-medium transition-colors ${step === s ? 'text-indigo-900' : 'text-slate-400'}`}>
                                        {s === 1 && "Servicio"}
                                        {s === 2 && "Fecha y Hora"}
                                        {s === 3 && "Datos"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="md:col-span-8 lg:col-span-9">
                    <form onSubmit={handleBooking} className="bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-slate-100 relative min-h-[500px]">
                        <AnimatePresence mode="wait">
                            {/* STEP 1: Service Selection */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-900 ml-1">¿Cómo se llama tu mascota?</label>
                                        <div className="relative group">
                                            <PawPrint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                required
                                                name="pet_name"
                                                value={formData.pet_name}
                                                onChange={handleInputChange}
                                                type="text"
                                                placeholder="Ej: Toby"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-900 ml-1">Tamaño</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['Pequeño', 'Mediano', 'Grande'].map(size => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => selectServiceByPetSize(size)}
                                                    className={`py-3 rounded-xl border font-medium text-sm transition-all ${formData.pet_type === size
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-900 ml-1">Selecciona el Servicio</label>
                                        {isLoadingServices ? (
                                            <div className="grid grid-cols-1 gap-3">
                                                {[1, 2].map((i) => (
                                                    <div key={i} className="p-5 rounded-2xl border border-slate-100 animate-pulse">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                                                            <div className="h-5 bg-slate-200 rounded w-16"></div>
                                                        </div>
                                                        <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
                                                        <div className="h-3 bg-slate-100 rounded w-3/4 mb-2"></div>
                                                        <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-3">
                                                {dbServices?.filter(s => s.pet_size === formData.pet_type).map(s => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => selectSpecificService(s)}
                                                        className={`p-5 rounded-2xl border text-left transition-all group ${formData.service === s.name
                                                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                            : 'border-slate-100 bg-white hover:border-indigo-100 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className={`font-bold transition-colors ${formData.service === s.name ? 'text-indigo-700' : 'text-slate-900'}`}>{s.name}</div>
                                                            <div className="text-indigo-600 font-bold">${s.price.toLocaleString()}</div>
                                                        </div>
                                                        <div className="text-sm text-slate-500 leading-relaxed max-w-md">{s.description}</div>
                                                        <div className="mt-2 text-xs text-slate-400 font-medium">Duración: {s.duration_minutes} min</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => canProceedStep1 && setStep(2)}
                                            disabled={!canProceedStep1}
                                            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                                        >
                                            Continuar <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: Date & Time */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-slate-900">Fecha</label>
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
                                                <span className="text-sm font-semibold text-slate-700 w-32 text-center py-1">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
                                                <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronRight className="w-5 h-5" /></button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                                            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
                                                    <div key={idx} className="text-xs font-bold text-slate-400 py-2">{day}</div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {days.map((day) => {
                                                    const dateStr = format(day, 'yyyy-MM-dd');
                                                    const isDisabled = isBefore(day, startOfToday()) || (minDate ? dateStr < minDate : false);
                                                    const isSelected = formData.date === dateStr;
                                                    if (!isSameMonth(day, currentMonth)) return <div key={day.toString()} />;

                                                    return (
                                                        <button
                                                            key={day.toString()}
                                                            type="button"
                                                            disabled={isDisabled}
                                                            onClick={() => !isDisabled && setFormData({ ...formData, date: dateStr, time: '' })}
                                                            className={`
                                                                aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all
                                                                ${isSelected ? 'bg-indigo-600 text-white shadow-md' : isDisabled ? 'text-slate-300' : 'text-slate-700 hover:bg-white hover:shadow-sm'}
                                                            `}
                                                        >
                                                            {format(day, 'd')}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-slate-900">Horarios Disponibles</label>
                                            {availabilityData && (
                                                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded">
                                                    {availabilityData.businessHour.open_time.substring(0, 5)} - {availabilityData.businessHour.close_time.substring(0, 5)}
                                                </span>
                                            )}
                                        </div>

                                        {isLoadingSlots ? (
                                            <div className="py-8 text-center text-slate-400">Cargando...</div>
                                        ) : slots.length > 0 ? (
                                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                                {slots.map(s => (
                                                    <button
                                                        key={s.time}
                                                        type="button"
                                                        disabled={!s.isAvailable}
                                                        onClick={() => s.isAvailable && setFormData({ ...formData, time: s.time })}
                                                        className={`py-2 rounded-lg text-sm font-medium transition-all border ${formData.time === s.time
                                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                                            : s.isAvailable
                                                                ? 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                                                : 'bg-slate-50 border-transparent text-slate-300 line-through'
                                                            }`}
                                                    >
                                                        {s.time}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 bg-amber-50 rounded-2xl border border-amber-100 gap-3">
                                                <Sparkles className="w-8 h-8 text-amber-500" />
                                                <p className="text-amber-700 font-medium text-sm">Sin cupos este día</p>
                                                <button onClick={goToNextDay} className="text-xs font-bold text-amber-600 hover:underline">Ver mañana</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="px-6 py-4 text-slate-500 hover:bg-slate-50 font-bold rounded-xl transition-colors text-sm"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => canProceedStep2 && setStep(3)}
                                            disabled={!canProceedStep2}
                                            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                                        >
                                            Continuar <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: Contact Info */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-4 items-start">
                                        <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm">
                                            <CalendarIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-indigo-900 text-lg">Resumen</h4>
                                            <p className="text-indigo-700/80 text-sm mt-1">
                                                {formData.service} para {formData.pet_name}<br />
                                                {format(new Date(formData.date + 'T12:00:00'), 'EEEE d MMMM', { locale: es })} a las {formData.time}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                            <label className="text-sm font-bold text-slate-900 ml-1">Tu Nombre</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                <input
                                                    required
                                                    name="client_name"
                                                    value={formData.client_name}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-900 ml-1">Email</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                <input
                                                    required
                                                    name="client_email"
                                                    value={formData.client_email}
                                                    onChange={handleInputChange}
                                                    type="email"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-900 ml-1">Teléfono</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                <input
                                                    required
                                                    name="client_phone"
                                                    value={formData.client_phone}
                                                    onChange={handleInputChange}
                                                    type="tel"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="flex-1 py-4 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm border border-slate-200 hover:border-slate-300"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || !canProceedStep3}
                                            className="flex-[2] py-4 bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                                        >
                                            {loading ? 'Confirmando...' : 'Confirmar Reserva'} <CheckCircle2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>
            </div>
        </div>
    );
}
