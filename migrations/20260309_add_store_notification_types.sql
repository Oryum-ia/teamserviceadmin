ALTER TABLE public.notificaciones
DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;

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
    'reparacion_completada'::text,
    'pedido_nuevo'::text,
    'stock_bajo'::text,
    'producto_agotado'::text
  ])
);
