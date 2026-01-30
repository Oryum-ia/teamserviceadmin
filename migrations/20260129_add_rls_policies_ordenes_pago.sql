-- Agregar políticas RLS a la tabla ordenes_pago
-- Ejecutar este script en Supabase SQL Editor

-- Habilitar RLS si no está habilitado
ALTER TABLE public.ordenes_pago ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (para evitar duplicados)
DROP POLICY IF EXISTS "Permitir lectura de órdenes a usuarios autenticados" ON public.ordenes_pago;
DROP POLICY IF EXISTS "Permitir inserción de órdenes desde servicio" ON public.ordenes_pago;
DROP POLICY IF EXISTS "Permitir actualización de órdenes desde servicio" ON public.ordenes_pago;
DROP POLICY IF EXISTS "Permitir eliminación de órdenes desde servicio" ON public.ordenes_pago;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Permitir lectura de órdenes a usuarios autenticados"
  ON public.ordenes_pago
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserción desde el servicio
CREATE POLICY "Permitir inserción de órdenes desde servicio"
  ON public.ordenes_pago
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Política para permitir actualización desde el servicio
CREATE POLICY "Permitir actualización de órdenes desde servicio"
  ON public.ordenes_pago
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para permitir eliminación desde el servicio
CREATE POLICY "Permitir eliminación de órdenes desde servicio"
  ON public.ordenes_pago
  FOR DELETE
  TO service_role
  USING (true);

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ordenes_pago';
