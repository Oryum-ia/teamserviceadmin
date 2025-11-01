-- Actualizar la tabla producto_tienda para soportar múltiples imágenes
-- Cambiar imagen_url (TEXT) a imagenes (TEXT[])

-- Paso 1: Agregar la nueva columna imagenes como array
ALTER TABLE public.producto_tienda 
ADD COLUMN IF NOT EXISTS imagenes TEXT[] DEFAULT '{}';

-- Paso 2: Migrar datos existentes de imagen_url a imagenes (si hay datos)
UPDATE public.producto_tienda 
SET imagenes = ARRAY[imagen_url]::TEXT[]
WHERE imagen_url IS NOT NULL AND imagen_url != '';

-- Paso 3: (OPCIONAL) Eliminar la columna antigua imagen_url
-- Descomenta la siguiente línea si quieres eliminar imagen_url
-- ALTER TABLE public.producto_tienda DROP COLUMN imagen_url;

-- Verificar la estructura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'producto_tienda' 
  AND column_name IN ('imagen_url', 'imagenes');
