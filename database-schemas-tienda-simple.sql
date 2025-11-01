-- ============================================
-- SCHEMAS SIMPLIFICADOS PARA ADMINISTRACIÓN DE TIENDA
-- (Sin created_at/updated_at para coincidir con tu schema existente)
-- ============================================

-- Tabla: producto_tienda
CREATE TABLE IF NOT EXISTS public.producto_tienda (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT NULL,
  precio NUMERIC NULL,
  stock INTEGER NULL,
  imagen_url TEXT NULL,
  promocion BOOLEAN NULL DEFAULT false,
  activo BOOLEAN NULL DEFAULT true,
  CONSTRAINT producto_tienda_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Índices para producto_tienda
CREATE INDEX IF NOT EXISTS idx_producto_tienda_activo ON public.producto_tienda(activo);
CREATE INDEX IF NOT EXISTS idx_producto_tienda_promocion ON public.producto_tienda(promocion);
CREATE INDEX IF NOT EXISTS idx_producto_tienda_nombre ON public.producto_tienda(nombre);

-- ============================================

-- Tabla: carrusel
CREATE TABLE IF NOT EXISTS public.carrusel (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  titulo TEXT NULL,
  descripcion TEXT NULL,
  imagen_url TEXT NOT NULL,
  orden INTEGER NULL DEFAULT 0,
  activo BOOLEAN NULL DEFAULT true,
  CONSTRAINT carrusel_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Índices para carrusel
CREATE INDEX IF NOT EXISTS idx_carrusel_orden ON public.carrusel(orden);
CREATE INDEX IF NOT EXISTS idx_carrusel_activo ON public.carrusel(activo);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- ============================================

-- Habilitar RLS en las tablas
ALTER TABLE public.producto_tienda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrusel ENABLE ROW LEVEL SECURITY;

-- Políticas para producto_tienda
-- Permitir lectura pública (para la landing page)
CREATE POLICY "Permitir lectura pública de productos activos" 
ON public.producto_tienda FOR SELECT 
USING (activo = true);

-- Permitir todas las operaciones a usuarios autenticados (admin)
CREATE POLICY "Permitir todas las operaciones a usuarios autenticados" 
ON public.producto_tienda FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas para carrusel
-- Permitir lectura pública (para la landing page)
CREATE POLICY "Permitir lectura pública de imágenes activas" 
ON public.carrusel FOR SELECT 
USING (activo = true);

-- Permitir todas las operaciones a usuarios autenticados (admin)
CREATE POLICY "Permitir todas las operaciones de carrusel a usuarios autenticados" 
ON public.carrusel FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET - CONFIGURAR EN SUPABASE DASHBOARD
-- ============================================
-- 1. Ve a Storage → Create a new bucket
-- 2. Nombre: imagenes-tienda
-- 3. Marca como Public bucket
-- 4. Configura políticas:

-- Permitir subida a usuarios autenticados:
-- CREATE POLICY "Permitir subida de imágenes a usuarios autenticados"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'imagenes-tienda');

-- Permitir lectura pública:
-- CREATE POLICY "Permitir lectura pública de imágenes"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'imagenes-tienda');

-- Permitir eliminación a usuarios autenticados:
-- CREATE POLICY "Permitir eliminación de imágenes a usuarios autenticados"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'imagenes-tienda');

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Insertar un producto de prueba
-- INSERT INTO public.producto_tienda (nombre, descripcion, precio, stock, activo)
-- VALUES ('Producto de Prueba', 'Descripción del producto', 99.99, 10, true);

-- Insertar una imagen de carrusel de prueba
-- INSERT INTO public.carrusel (titulo, descripcion, imagen_url, orden, activo)
-- VALUES ('Imagen de Prueba', 'Descripción de la imagen', 'https://via.placeholder.com/1200x400', 0, true);
