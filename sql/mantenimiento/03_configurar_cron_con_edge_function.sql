-- =====================================================
-- OPCIÓN ALTERNATIVA: pg_cron + Edge Function
-- =====================================================
-- Este script configura pg_cron para llamar a una Edge Function
-- Todo se ejecuta dentro de Supabase, sin necesidad de cron externos
-- =====================================================

-- PASO 1: Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;  -- Permite hacer HTTP requests desde PostgreSQL

-- =====================================================
-- PASO 2: Eliminar job existente (si existe)
-- =====================================================
DO $$
DECLARE
    job_id bigint;
BEGIN
    SELECT jobid INTO job_id
    FROM cron.job
    WHERE jobname = 'mantenimiento_con_edge_function';
    
    IF job_id IS NOT NULL THEN
        PERFORM cron.unschedule(job_id);
        RAISE NOTICE 'Job anterior eliminado: %', job_id;
    END IF;
END $$;

-- =====================================================
-- PASO 3: Crear función que llama a la Edge Function
-- =====================================================
CREATE OR REPLACE FUNCTION public.ejecutar_mantenimiento_edge_function()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    request_id bigint;
    edge_function_url text;
BEGIN
    -- URL de tu Edge Function (cambiar por la tuya después del deploy)
    -- Formato: https://PROYECTO_ID.supabase.co/functions/v1/procesar-mantenimientos
    edge_function_url := 'https://tu-proyecto-id.supabase.co/functions/v1/procesar-mantenimientos';
    
    -- Hacer HTTP POST request a la Edge Function
    SELECT net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
    ) INTO request_id;
    
    RAISE NOTICE 'Request enviado a Edge Function con ID: %', request_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error al llamar Edge Function: %', SQLERRM;
END;
$$;

-- =====================================================
-- PASO 4: Programar el cron job
-- =====================================================
SELECT cron.schedule(
    'mantenimiento_con_edge_function',
    '0 13 * * *',  -- 8:00 AM Colombia (UTC-5)
    $$SELECT public.ejecutar_mantenimiento_edge_function();$$
);

-- =====================================================
-- PASO 5: Verificar configuración
-- =====================================================
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    active
FROM cron.job
WHERE jobname = 'mantenimiento_con_edge_function';

-- =====================================================
-- INSTRUCCIONES DE CONFIGURACIÓN
-- =====================================================
-- 1. Habilitar pg_net en Supabase:
--    Dashboard > Database > Extensions > pg_net (Enable)
--
-- 2. Desplegar la Edge Function:
--    $ supabase functions deploy procesar-mantenimientos
--
-- 3. Obtener la URL de la Edge Function:
--    Dashboard > Edge Functions > procesar-mantenimientos > Copy URL
--
-- 4. Actualizar la variable 'edge_function_url' en este script (línea 40)
--
-- 5. Re-ejecutar este script
--
-- 6. Configurar secretos en la Edge Function:
--    $ supabase secrets set RESEND_API_KEY=tu_api_key
--    O usar tu API de emails existente:
--    $ supabase secrets set APP_URL=https://tu-sitio.com

-- =====================================================
-- VENTAJAS DE ESTA SOLUCIÓN
-- =====================================================
-- ✅ Todo en Supabase (sin servicios externos)
-- ✅ Variables de entorno en Supabase (no en tu app)
-- ✅ Más confiable
-- ✅ Logs centralizados en Supabase
-- ✅ Gratis en el plan Free de Supabase

-- =====================================================
-- COMANDOS ÚTILES
-- =====================================================

-- Probar manualmente la Edge Function:
-- SELECT public.ejecutar_mantenimiento_edge_function();

-- Ver resultados de las requests HTTP:
-- SELECT * FROM net.http_request_queue ORDER BY id DESC LIMIT 10;

-- Ver historial del cron:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'mantenimiento_con_edge_function')
-- ORDER BY start_time DESC LIMIT 10;
