import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  pet_size: string;
};

export type Appointment = {
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
  status: 'pending' | 'confirmed' | 'cancelled';
};

export type BusinessHour = {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

export type ClosedDay = {
  id: string;
  closed_date: string;
  reason?: string;
};
