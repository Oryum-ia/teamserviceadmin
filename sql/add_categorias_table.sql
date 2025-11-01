-- =====================================================
-- MIGRACIÓN: Agregar tabla de categorias y actualizar producto_tienda
-- Ejecuta este script en Supabase SQL Editor
-- =====================================================

-- 1. CREAR TABLA DE CATEGORIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categorias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT categorias_pkey PRIMARY KEY (id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_categorias_nombre ON public.categorias(nombre);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON public.categorias(activo);

-- 2. AGREGAR COLUMNAS categoria_id Y marca_id A TABLA producto_tienda
-- =====================================================
DO $$
BEGIN
  -- Agregar categoria_id como foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'producto_tienda' AND column_name = 'categoria_id'
  ) THEN
    ALTER TABLE public.producto_tienda
    ADD COLUMN categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_producto_tienda_categoria_id ON public.producto_tienda(categoria_id);
  END IF;

  -- Agregar marca_id como foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'producto_tienda' AND column_name = 'marca_id'
  ) THEN
    ALTER TABLE public.producto_tienda
    ADD COLUMN marca_id uuid REFERENCES public.marcas(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_producto_tienda_marca_id ON public.producto_tienda(marca_id);
  END IF;
END $$;

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para categorias
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver categorias" ON public.categorias;
CREATE POLICY "Usuarios autenticados pueden ver categorias"
  ON public.categorias
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear categorias" ON public.categorias;
CREATE POLICY "Usuarios autenticados pueden crear categorias"
  ON public.categorias
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar categorias" ON public.categorias;
CREATE POLICY "Usuarios autenticados pueden actualizar categorias"
  ON public.categorias
  FOR UPDATE
  TO authenticated
  USING (true);

-- Permitir lectura pública para categorías (para la tienda)
DROP POLICY IF EXISTS "Permitir lectura pública de categorias activas" ON public.categorias;
CREATE POLICY "Permitir lectura pública de categorias activas"
  ON public.categorias
  FOR SELECT
  USING (activo = true);

-- 4. DATOS DE EJEMPLO (opcional)
-- =====================================================
INSERT INTO public.categorias (nombre, descripcion) VALUES
  ('Limpieza', 'Equipos y productos de limpieza'),
  ('Herramientas', 'Herramientas eléctricas y manuales'),
  ('Electrodomésticos', 'Electrodomésticos para el hogar'),
  ('Electrónica', 'Dispositivos electrónicos'),
  ('Accesorios', 'Accesorios y complementos'),
  ('Repuestos', 'Repuestos y partes')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- ✅ MIGRACIÓN COMPLETADA
-- =====================================================
