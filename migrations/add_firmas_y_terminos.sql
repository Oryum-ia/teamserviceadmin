-- =====================================================
-- MIGRACIÓN: Agregar campos de firma y términos
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Agregar campos a la tabla ordenes
ALTER TABLE ordenes 
ADD COLUMN IF NOT EXISTS terminos_aceptados BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_aceptacion_terminos TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS firma_cliente TEXT, -- Base64 de la firma en recepción
ADD COLUMN IF NOT EXISTS fecha_firma_cliente TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS firma_entrega TEXT, -- Base64 de la firma en entrega
ADD COLUMN IF NOT EXISTS fecha_firma_entrega TIMESTAMP WITH TIME ZONE;

-- Comentarios para documentación
COMMENT ON COLUMN ordenes.terminos_aceptados IS 'Indica si el cliente aceptó términos y condiciones';
COMMENT ON COLUMN ordenes.fecha_aceptacion_terminos IS 'Fecha en que se aceptaron los términos';
COMMENT ON COLUMN ordenes.firma_cliente IS 'Firma del cliente al recibir el equipo (Base64)';
COMMENT ON COLUMN ordenes.fecha_firma_cliente IS 'Fecha de la firma del cliente en recepción';
COMMENT ON COLUMN ordenes.firma_entrega IS 'Firma del cliente al retirar el equipo (Base64)';
COMMENT ON COLUMN ordenes.fecha_firma_entrega IS 'Fecha de la firma del cliente en entrega';

-- Crear índice para búsquedas por términos aceptados
CREATE INDEX IF NOT EXISTS idx_ordenes_terminos_aceptados ON ordenes(terminos_aceptados);

-- Verificar que se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ordenes' 
AND column_name IN (
    'terminos_aceptados', 
    'fecha_aceptacion_terminos',
    'firma_cliente', 
    'fecha_firma_cliente',
    'firma_entrega',
    'fecha_firma_entrega'
)
ORDER BY ordinal_position;

-- ✅ Migración completada
