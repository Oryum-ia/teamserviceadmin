-- Tabla para gestionar órdenes de pago con Bold
-- NOTA: Esta tabla ya existe en Supabase, este archivo es solo para referencia
CREATE TABLE IF NOT EXISTS public.ordenes_pago (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Identificación de la orden
  order_id text NOT NULL UNIQUE,
  bold_transaction_id text,
  
  -- Información del cliente
  cliente_nombre text NOT NULL,
  cliente_email text NOT NULL,
  cliente_telefono text NOT NULL,
  cliente_documento text,
  cliente_tipo_documento text,
  
  -- Dirección de envío
  direccion_completa text NOT NULL,
  ciudad text NOT NULL,
  departamento text NOT NULL,
  codigo_postal text,
  
  -- Detalles de la orden
  productos jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  descuento numeric DEFAULT 0,
  codigo_cupon text,
  costo_envio numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  
  -- Información de pago
  metodo_pago text NOT NULL,
  estado_pago text NOT NULL DEFAULT 'pendiente', -- Estados: pendiente, aprobado, rechazado, cancelado, expirado
  
  -- Datos adicionales
  notas_pedido text,
  hash_integridad text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  fecha_pago timestamp with time zone,
  
  -- Constraints
  CONSTRAINT ordenes_pago_pkey PRIMARY KEY (id),
  CONSTRAINT ordenes_pago_estado_check CHECK (estado_pago IN ('pendiente', 'aprobado', 'rechazado', 'cancelado', 'expirado'))
);


-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ordenes_pago_order_id ON public.ordenes_pago(order_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_pago_cliente_email ON public.ordenes_pago(cliente_email);
CREATE INDEX IF NOT EXISTS idx_ordenes_pago_estado_pago ON public.ordenes_pago(estado_pago);
CREATE INDEX IF NOT EXISTS idx_ordenes_pago_created_at ON public.ordenes_pago(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ordenes_pago_bold_transaction_id ON public.ordenes_pago(bold_transaction_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_pago_metodo_pago ON public.ordenes_pago(metodo_pago);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_ordenes_pago_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ordenes_pago_updated_at
  BEFORE UPDATE ON public.ordenes_pago
  FOR EACH ROW
  EXECUTE FUNCTION update_ordenes_pago_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.ordenes_pago IS 'Tabla para gestionar órdenes de pago de la tienda online con integración Bold';
COMMENT ON COLUMN public.ordenes_pago.order_id IS 'Identificador único de la orden generado por el sistema';
COMMENT ON COLUMN public.ordenes_pago.bold_transaction_id IS 'ID de transacción retornado por Bold';
COMMENT ON COLUMN public.ordenes_pago.productos IS 'Array JSON con los productos del carrito';
COMMENT ON COLUMN public.ordenes_pago.estado_pago IS 'Estado actual del pago: pendiente, aprobado, rechazado, cancelado, expirado';
COMMENT ON COLUMN public.ordenes_pago.hash_integridad IS 'Hash SHA256 para validación de integridad con Bold';

-- Políticas RLS (Row Level Security)
ALTER TABLE ordenes_pago ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Permitir lectura de órdenes a usuarios autenticados"
  ON ordenes_pago
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserción desde el servicio
CREATE POLICY "Permitir inserción de órdenes desde servicio"
  ON ordenes_pago
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Política para permitir actualización desde el servicio
CREATE POLICY "Permitir actualización de órdenes desde servicio"
  ON ordenes_pago
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para permitir eliminación desde el servicio
CREATE POLICY "Permitir eliminación de órdenes desde servicio"
  ON ordenes_pago
  FOR DELETE
  TO service_role
  USING (true);

-- Insertar datos de ejemplo (opcional, comentar en producción)
-- INSERT INTO ordenes_pago (
--   order_id,
--   cliente_nombre,
--   cliente_email,
--   cliente_telefono,
--   direccion_completa,
--   ciudad,
--   departamento,
--   productos,
--   subtotal,
--   descuento,
--   costo_envio,
--   total,
--   metodo_pago,
--   estado_pago
-- ) VALUES (
--   'ORD-TEST-001',
--   'Juan Pérez',
--   'juan@ejemplo.com',
--   '3001234567',
--   'Calle 40 # 2-55',
--   'Cartagena',
--   'Bolívar',
--   '[{"id":"prod-1","name":"Hidrolavadora K2","price":549900,"quantity":1}]'::jsonb,
--   549900,
--   0,
--   30000,
--   579900,
--   'pse',
--   'pendiente'
-- );
