-- Agregar campos sub_categoria y codigo a la tabla producto_tienda
-- Fecha: 2026-01-29

-- Agregar columna sub_categoria (texto opcional)
ALTER TABLE producto_tienda 
ADD COLUMN IF NOT EXISTS sub_categoria TEXT;

-- Agregar columna codigo (texto opcional)
ALTER TABLE producto_tienda 
ADD COLUMN IF NOT EXISTS codigo TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN producto_tienda.sub_categoria IS 'Sub-categoría o línea del producto';
COMMENT ON COLUMN producto_tienda.codigo IS 'Código de referencia del producto';
