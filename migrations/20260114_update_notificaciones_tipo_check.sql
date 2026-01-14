-- =====================================================
-- MODIFICAR CHECK CONSTRAINT DE TIPOS DE NOTIFICACIÓN
-- Fecha: 2026-01-14
-- Descripción: Agrega los tipos 'diagnostico_completado' y 
--              'reparacion_completada' a los tipos permitidos
-- =====================================================

-- Eliminar el constraint actual
ALTER TABLE public.notificaciones 
DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;

-- Crear el nuevo constraint con los tipos adicionales
-- (Mantiene todos los tipos originales + los nuevos)
ALTER TABLE public.notificaciones 
ADD CONSTRAINT notificaciones_tipo_check 
CHECK (
  tipo::text = ANY (ARRAY[
    'pqr_nuevo'::text,
    'encuesta_nueva'::text,
    'cotizacion_aceptada'::text,
    'cotizacion_rechazada'::text,
    'orden_autorizada'::text,
    'garantia_info'::text,
    'alerta_sistema'::text,
    'success'::text,
    'error'::text,
    'warning'::text,
    'info'::text,
    'terminos_aceptados'::text,
    'terminos_rechazados'::text,
    'diagnostico_completado'::text,
    'reparacion_completada'::text
  ])
);
