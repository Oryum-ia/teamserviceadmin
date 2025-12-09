-- Migración: Mover valor_revision de modelos a ordenes
-- Fecha: 2025-12-09
-- Descripción: El valor de revisión ahora es específico de cada orden, no del modelo

-- 1. Agregar columna valor_revision a ordenes si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ordenes' AND column_name = 'valor_revision'
    ) THEN
        ALTER TABLE ordenes ADD COLUMN valor_revision NUMERIC DEFAULT 0;
        COMMENT ON COLUMN ordenes.valor_revision IS 'Valor de revisión técnica específico de esta orden';
    END IF;
END $$;

-- 2. Migrar datos existentes: copiar valor_revision del modelo a las órdenes
UPDATE ordenes o
SET valor_revision = COALESCE(m.valor_revision, 0)
FROM equipos e
JOIN modelos m ON e.modelo_id = m.id
WHERE o.equipo_id = e.id
  AND o.valor_revision IS NULL OR o.valor_revision = 0;

-- 3. Eliminar columna valor_revision de modelos
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'modelos' AND column_name = 'valor_revision'
    ) THEN
        ALTER TABLE modelos DROP COLUMN valor_revision;
    END IF;
END $$;

-- Verificar cambios
SELECT 
    'ordenes' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN valor_revision > 0 THEN 1 END) as con_valor_revision,
    AVG(valor_revision) as promedio_valor_revision
FROM ordenes
UNION ALL
SELECT 
    'modelos' as tabla,
    COUNT(*) as total_registros,
    0 as con_valor_revision,
    0 as promedio_valor_revision
FROM modelos;
