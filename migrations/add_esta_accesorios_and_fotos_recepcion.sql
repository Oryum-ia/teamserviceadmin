-- Migración: agregar esta_accesorios y fotos_recepcion a ordenes
-- Fecha: 2025-10-27

ALTER TABLE public.ordenes
ADD COLUMN IF NOT EXISTS esta_accesorios jsonb NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fotos_recepcion text[] NULL;

COMMENT ON COLUMN public.ordenes.esta_accesorios IS 'Listado de accesorios con su estado en recepción: [{"nombre":"manguera","estado":"bueno|regular|malo"}]';
COMMENT ON COLUMN public.ordenes.fotos_recepcion IS 'URLs públicas de fotos tomadas en recepción';
