-- ==========================================
-- SCRIPT DE LIMPIEZA MANUAL (Copiar y pegar para reiniciar la base de datos)
-- ==========================================
-- DELETE FROM appointments;
-- DELETE FROM services;
-- ==========================================

-- 1. Asegurémonos de que la tabla 'services' tenga la estructura correcta
-- Si la tabla ya existe, agregamos la columna que falta
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='pet_size') THEN
        ALTER TABLE services ADD COLUMN pet_size TEXT;
    END IF;
END $$;

-- 2. Asegurémonos de que la tabla 'appointments' tenga la columna 'price'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='price') THEN
        ALTER TABLE appointments ADD COLUMN price INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Limpiar servicios anteriores para evitar duplicados
TRUNCATE services;

-- 4. Insertar los servicios con las reglas de negocio solicitadas
INSERT INTO services (name, description, price, duration_minutes, pet_size) VALUES
('Grooming Integral (Pequeño)', 'Baño general, corte de uñas, limpieza de oídos y profilaxis dental para perros pequeños.', 35000, 90, 'Pequeño'),
('Grooming Integral (Mediano)', 'Baño general, corte de uñas, limpieza de oídos y profilaxis dental para perros medianos.', 60000, 120, 'Mediano'),
('Grooming Integral (Grande)', 'Baño general, corte de uñas, limpieza de oídos y profilaxis dental para perros grandes.', 90000, 180, 'Grande')
ON CONFLICT DO NOTHING;

-- 5. Estructura para Horarios de Atención
CREATE TABLE IF NOT EXISTS business_hours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dom, 1=Lun...
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    UNIQUE(day_of_week)
);

-- Insertar horarios por defecto
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
(1, '09:30', '16:00', false), -- Lunes
(2, '09:30', '16:00', false), -- Martes
(3, '09:30', '16:00', false), -- Miércoles
(4, '09:30', '16:00', false), -- Jueves
(5, '09:30', '16:00', false), -- Viernes
(6, '09:30', '14:00', false), -- Sábado
(0, '00:00', '00:00', true)   -- Domingo
ON CONFLICT (day_of_week) DO UPDATE SET 
    open_time = EXCLUDED.open_time, 
    close_time = EXCLUDED.close_time, 
    is_closed = EXCLUDED.is_closed;

-- 6. Tabla para días festivos o cierres específicos
CREATE TABLE IF NOT EXISTS closed_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    closed_date DATE NOT NULL UNIQUE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
