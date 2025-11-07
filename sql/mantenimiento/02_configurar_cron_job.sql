-- =====================================================
-- CONFIGURACIÓN DE PG_CRON PARA MANTENIMIENTOS
-- =====================================================
-- Este script configura un job de pg_cron que se ejecuta
-- diariamente para verificar y notificar mantenimientos
-- =====================================================

-- IMPORTANTE: pg_cron debe estar habilitado en Supabase
-- Habilítalo desde el Dashboard de Supabase:
-- Database > Extensions > pg_cron (enable)

-- =====================================================
-- 1. HABILITAR LA EXTENSIÓN pg_cron (si no está habilitada)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- 2. ELIMINAR JOB EXISTENTE (si existe)
-- =====================================================
-- Esto permite re-ejecutar el script sin errores
DO $$
DECLARE
    job_id bigint;
BEGIN
    SELECT jobid INTO job_id
    FROM cron.job
    WHERE jobname = 'verificar_mantenimientos_diario';
    
    IF job_id IS NOT NULL THEN
        PERFORM cron.unschedule(job_id);
        RAISE NOTICE 'Job anterior eliminado: %', job_id;
    END IF;
END $$;

-- =====================================================
-- 3. CREAR JOB PARA VERIFICAR MANTENIMIENTOS
-- =====================================================
-- Este job se ejecuta todos los días a las 8:00 AM (hora del servidor)
-- Puedes ajustar el horario según tus necesidades

SELECT cron.schedule(
    'verificar_mantenimientos_diario',           -- Nombre del job
    '0 8 * * *',                                 -- Cron expression: todos los días a las 8:00 AM
    $$SELECT public.verificar_mantenimientos_proximos();$$  -- Query a ejecutar
);

-- =====================================================
-- 4. VERIFICAR QUE EL JOB SE CREÓ CORRECTAMENTE
-- =====================================================
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    active
FROM cron.job
WHERE jobname = 'verificar_mantenimientos_diario';

-- =====================================================
-- NOTAS SOBRE EL HORARIO
-- =====================================================
-- El formato de cron es: 'minuto hora dia mes dia_semana'
-- Ejemplos:
-- '0 8 * * *'   - Todos los días a las 8:00 AM
-- '0 9 * * *'   - Todos los días a las 9:00 AM
-- '30 7 * * *'  - Todos los días a las 7:30 AM
-- '0 8 * * 1-5' - De lunes a viernes a las 8:00 AM
-- '0 */2 * * *' - Cada 2 horas

-- IMPORTANTE: El horario es según la zona horaria del servidor de Supabase (generalmente UTC)
-- Para Colombia (UTC-5), si quieres que se ejecute a las 8:00 AM hora local,
-- deberías programarlo para las 13:00 (1:00 PM) UTC
-- Ejemplo para Colombia: '0 13 * * *'

-- =====================================================
-- 5. COMANDOS ÚTILES PARA GESTIONAR JOBS
-- =====================================================

-- Ver todos los jobs activos:
-- SELECT * FROM cron.job;

-- Ver historial de ejecuciones:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Desactivar un job (sin eliminarlo):
-- UPDATE cron.job SET active = false WHERE jobname = 'verificar_mantenimientos_diario';

-- Reactivar un job:
-- UPDATE cron.job SET active = true WHERE jobname = 'verificar_mantenimientos_diario';

-- Eliminar un job:
-- SELECT cron.unschedule('verificar_mantenimientos_diario');

-- Ejecutar manualmente (para pruebas):
-- SELECT public.verificar_mantenimientos_proximos();

-- =====================================================
-- 6. PERMISOS PARA pg_cron
-- =====================================================
-- Asegurar que el rol postgres tenga permisos para usar cron
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
