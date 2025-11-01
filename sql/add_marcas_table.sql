-- =====================================================
-- MIGRACIÓN: Agregar tabla de marcas y actualizar modelos
-- Ejecuta este script en Supabase SQL Editor
-- =====================================================

-- 1. CREAR TABLA DE MARCAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.marcas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  pais_origen text,
  sitio_web text,
  activo boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT marcas_pkey PRIMARY KEY (id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_marcas_nombre ON public.marcas(nombre);
CREATE INDEX IF NOT EXISTS idx_marcas_activo ON public.marcas(activo);

-- 2. AGREGAR COLUMNA marca_id A TABLA modelos
-- =====================================================
-- Primero verificamos si la columna ya existe
DO $$
BEGIN
  -- Agregar marca_id como foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modelos' AND column_name = 'marca_id'
  ) THEN
    ALTER TABLE public.modelos
    ADD COLUMN marca_id uuid REFERENCES public.marcas(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_modelos_marca_id ON public.modelos(marca_id);
  END IF;
END $$;

-- 3. MIGRAR DATOS EXISTENTES (opcional)
-- =====================================================
-- Crear marcas únicas desde los datos existentes en modelos
INSERT INTO public.marcas (nombre)
SELECT DISTINCT marca
FROM public.modelos
WHERE marca IS NOT NULL
  AND marca != ''
  AND NOT EXISTS (SELECT 1 FROM public.marcas WHERE nombre = modelos.marca)
ON CONFLICT (nombre) DO NOTHING;

-- Actualizar marca_id en modelos con las marcas creadas
UPDATE public.modelos m
SET marca_id = (
  SELECT id FROM public.marcas WHERE nombre = m.marca
)
WHERE m.marca IS NOT NULL AND m.marca != '';

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para marcas
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver marcas" ON public.marcas;
CREATE POLICY "Usuarios autenticados pueden ver marcas"
  ON public.marcas
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear marcas" ON public.marcas;
CREATE POLICY "Usuarios autenticados pueden crear marcas"
  ON public.marcas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar marcas" ON public.marcas;
CREATE POLICY "Usuarios autenticados pueden actualizar marcas"
  ON public.marcas
  FOR UPDATE
  TO authenticated
  USING (true);

-- 5. DATOS DE PRUEBA (opcional)
-- =====================================================
INSERT INTO public.marcas (nombre, descripcion, pais_origen) VALUES
  ('Kärcher', 'Equipos de limpieza profesional', 'Alemania'),
  ('Bosch', 'Herramientas y electrodomésticos', 'Alemania'),
  ('Samsung', 'Electrónica y electrodomésticos', 'Corea del Sur'),
  ('LG', 'Electrónica y electrodomésticos', 'Corea del Sur'),
  ('Whirlpool', 'Electrodomésticos', 'Estados Unidos'),
  ('Electrolux', 'Electrodomésticos', 'Suecia')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- ✅ MIGRACIÓN COMPLETADA
-- =====================================================
-- NOTA: La columna "marca" en la tabla "modelos" se mantiene por compatibilidad
-- pero ahora se debe usar "marca_id" para nuevas inserciones.
-- En el futuro, la columna "marca" puede ser eliminada si ya no se necesita.
