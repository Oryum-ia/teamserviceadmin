-- Tabla para relacionar órdenes con repuestos
-- Similar a modelos_repuestos pero para repuestos usados/necesarios en cada orden

CREATE TABLE IF NOT EXISTS public.ordenes_repuestos (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL,
  repuesto_id UUID NOT NULL,
  cantidad INTEGER DEFAULT 1,
  precio_unitario NUMERIC DEFAULT 0,
  descuento NUMERIC DEFAULT 0,
  iva NUMERIC DEFAULT 0,
  en_stock BOOLEAN DEFAULT TRUE,
  fase VARCHAR(20) DEFAULT 'diagnostico', -- 'diagnostico' o 'cotizacion'
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT ordenes_repuestos_pkey PRIMARY KEY (id),
  CONSTRAINT ordenes_repuestos_unique UNIQUE (orden_id, repuesto_id, fase),
  CONSTRAINT ordenes_repuestos_orden_fkey FOREIGN KEY (orden_id) REFERENCES ordenes (id) ON DELETE CASCADE,
  CONSTRAINT ordenes_repuestos_repuesto_fkey FOREIGN KEY (repuesto_id) REFERENCES repuestos (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ordenes_repuestos_orden_id ON public.ordenes_repuestos(orden_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_repuestos_repuesto_id ON public.ordenes_repuestos(repuesto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_repuestos_fase ON public.ordenes_repuestos(fase);

-- Comentarios
COMMENT ON TABLE public.ordenes_repuestos IS 'Relación entre órdenes y repuestos necesarios/usados';
COMMENT ON COLUMN public.ordenes_repuestos.fase IS 'Fase en la que se agregó el repuesto: diagnostico o cotizacion';
COMMENT ON COLUMN public.ordenes_repuestos.precio_unitario IS 'Precio unitario del repuesto (se completa en cotización)';
COMMENT ON COLUMN public.ordenes_repuestos.descuento IS 'Descuento en porcentaje';
COMMENT ON COLUMN public.ordenes_repuestos.iva IS 'IVA en porcentaje';
