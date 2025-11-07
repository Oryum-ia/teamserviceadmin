-- =====================================================
-- Agregar columna fecha_proximo_mantenimiento
-- =====================================================
-- Ejecutar este script PRIMERO antes de crear las funciones

-- Agregar columna si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ordenes' 
        AND column_name = 'fecha_proximo_mantenimiento'
    ) THEN
        ALTER TABLE public.ordenes 
        ADD COLUMN fecha_proximo_mantenimiento date;
        
        RAISE NOTICE 'Columna fecha_proximo_mantenimiento agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna fecha_proximo_mantenimiento ya existe';
    END IF;
END $$;

-- Agregar comentario a la columna
COMMENT ON COLUMN public.ordenes.fecha_proximo_mantenimiento 
IS 'Fecha programada para el próximo mantenimiento del equipo';

-- Verificar que se creó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ordenes' 
AND column_name = 'fecha_proximo_mantenimiento';
