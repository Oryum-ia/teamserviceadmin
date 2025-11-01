-- Agregar columna especificaciones como JSONB
ALTER TABLE public.producto_tienda 
ADD COLUMN IF NOT EXISTS especificaciones JSONB DEFAULT '[]'::jsonb;

-- Crear índice para búsquedas más rápidas en especificaciones
CREATE INDEX IF NOT EXISTS idx_producto_tienda_especificaciones 
ON public.producto_tienda USING GIN (especificaciones);

-- Comentario para documentación
COMMENT ON COLUMN public.producto_tienda.especificaciones IS 
'Array de objetos JSON con especificaciones del producto. Formato: [{"nombre": "Color", "valor": "Rojo"}, ...]';

-- Ejemplo de inserción con especificaciones:
-- INSERT INTO public.producto_tienda (nombre, precio, especificaciones)
-- VALUES ('Laptop', 1500000, '[
--   {"nombre": "Procesador", "valor": "Intel i7"},
--   {"nombre": "RAM", "valor": "16GB"},
--   {"nombre": "Almacenamiento", "valor": "512GB SSD"}
-- ]'::jsonb);

-- Ejemplo de consulta por especificación:
-- SELECT * FROM producto_tienda 
-- WHERE especificaciones @> '[{"nombre": "Procesador"}]'::jsonb;
