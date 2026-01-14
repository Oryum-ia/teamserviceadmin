-- Migración: Agregar campo descuento a producto_tienda
-- Fecha: 2026-01-14
-- Descripción: Permite configurar un porcentaje de descuento personalizado para cada producto

-- Agregar columna descuento (porcentaje de 0 a 100)
ALTER TABLE public.producto_tienda
ADD COLUMN IF NOT EXISTS descuento numeric DEFAULT 0;

-- Agregar comentario descriptivo
COMMENT ON COLUMN public.producto_tienda.descuento IS 'Porcentaje de descuento del producto (0-100). Se aplica cuando promocion=true';

-- Establecer descuento inicial de 15% para productos que ya están en promoción
UPDATE public.producto_tienda 
SET descuento = 15 
WHERE promocion = true AND (descuento IS NULL OR descuento = 0);
