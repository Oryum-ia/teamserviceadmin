-- Agregar columna nota_orden a la tabla ordenes
-- Esta columna almacena notas importantes que son visibles para todos los técnicos y administradores

ALTER TABLE ordenes
ADD COLUMN IF NOT EXISTS nota_orden TEXT;

-- Agregar comentario descriptivo a la columna
COMMENT ON COLUMN ordenes.nota_orden IS 'Nota general de la orden visible para todos los técnicos y administradores. Se usa para comunicaciones importantes sobre el caso.';

-- Verificar que la columna se creó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ordenes' AND column_name = 'nota_orden';
