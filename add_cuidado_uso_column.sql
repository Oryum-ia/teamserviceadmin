-- Agregar columna cuidado_uso a la tabla modelos
-- Esta columna almacenará un texto largo con los cuidados de uso del modelo

ALTER TABLE modelos 
ADD COLUMN IF NOT EXISTS cuidado_uso TEXT;

-- Agregar comentario explicativo
COMMENT ON COLUMN modelos.cuidado_uso IS 
'Texto largo con instrucciones y cuidados de uso del modelo de equipo. Se muestra en el formulario de entrega al cliente.';

-- Verificar que la columna se creó correctamente
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'modelos' AND column_name = 'cuidado_uso';
