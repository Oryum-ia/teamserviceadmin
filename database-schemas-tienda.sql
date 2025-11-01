-- ============================================
-- SCHEMAS PARA ADMINISTRACIÓN DE TIENDA
-- ============================================

-- Tabla: producto_tienda
-- Descripción: Almacena los productos de la tienda que se muestran en la landing page
CREATE TABLE IF NOT EXISTS public.producto_tienda (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT NULL,
  precio NUMERIC NULL,
  stock INTEGER NULL,
  imagen_url TEXT NULL,
  promocion BOOLEAN NULL DEFAULT false,
  activo BOOLEAN NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT producto_tienda_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Índices para producto_tienda
CREATE INDEX IF NOT EXISTS idx_producto_tienda_activo ON public.producto_tienda(activo);
CREATE INDEX IF NOT EXISTS idx_producto_tienda_promocion ON public.producto_tienda(promocion);
CREATE INDEX IF NOT EXISTS idx_producto_tienda_nombre ON public.producto_tienda(nombre);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_producto_tienda_updated_at BEFORE UPDATE
    ON public.producto_tienda FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- Tabla: carrusel
-- Descripción: Almacena las imágenes del carrusel de la landing page
CREATE TABLE IF NOT EXISTS public.carrusel (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  titulo TEXT NULL,
  descripcion TEXT NULL,
  imagen_url TEXT NOT NULL,
  orden INTEGER NULL DEFAULT 0,
  activo BOOLEAN NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT carrusel_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Índices para carrusel
CREATE INDEX IF NOT EXISTS idx_carrusel_orden ON public.carrusel(orden);
CREATE INDEX IF NOT EXISTS idx_carrusel_activo ON public.carrusel(activo);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_carrusel_updated_at BEFORE UPDATE
    ON public.carrusel FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- Comentarios para documentación
COMMENT ON TABLE public.producto_tienda IS 'Productos de la tienda mostrados en la landing page';
COMMENT ON COLUMN public.producto_tienda.nombre IS 'Nombre del producto';
COMMENT ON COLUMN public.producto_tienda.descripcion IS 'Descripción detallada del producto';
COMMENT ON COLUMN public.producto_tienda.precio IS 'Precio del producto';
COMMENT ON COLUMN public.producto_tienda.stock IS 'Cantidad disponible en inventario';
COMMENT ON COLUMN public.producto_tienda.imagen_url IS 'URL de la imagen del producto en Supabase Storage';
COMMENT ON COLUMN public.producto_tienda.promocion IS 'Indica si el producto está en promoción';
COMMENT ON COLUMN public.producto_tienda.activo IS 'Indica si el producto está visible en la tienda';

COMMENT ON TABLE public.carrusel IS 'Imágenes del carrusel de la landing page';
COMMENT ON COLUMN public.carrusel.titulo IS 'Título de la imagen del carrusel';
COMMENT ON COLUMN public.carrusel.descripcion IS 'Descripción de la imagen';
COMMENT ON COLUMN public.carrusel.imagen_url IS 'URL de la imagen en Supabase Storage';
COMMENT ON COLUMN public.carrusel.orden IS 'Orden de aparición en el carrusel (menor = primero)';
COMMENT ON COLUMN public.carrusel.activo IS 'Indica si la imagen está activa en el carrusel';

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
-- STORAGE BUCKET CONFIGURATION
-- ============================================

-- NOTA: Crear el bucket 'imagenes-tienda' en Supabase Dashboard
-- O ejecutar este comando si tienes permisos:
-- 
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('imagenes-tienda', 'imagenes-tienda', true);
--
-- Políticas para el bucket (permitir subida solo a autenticados, lectura pública):
--
-- CREATE POLICY "Permitir subida de imágenes a usuarios autenticados"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'imagenes-tienda');
--
-- CREATE POLICY "Permitir lectura pública de imágenes"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'imagenes-tienda');
--
-- CREATE POLICY "Permitir eliminación de imágenes a usuarios autenticados"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'imagenes-tienda');

-- ============================================
-- FIN DE SCHEMAS
-- ============================================
