-- Agregar índices adicionales a la tabla ordenes_pago
-- Ejecutar este script en Supabase SQL Editor

-- Índice para búsqueda por transaction ID de Bold
CREATE INDEX IF NOT EXISTS idx_ordenes_pago_bold_transaction_id 
  ON public.ordenes_pago(bold_transaction_id);

-- Índice para filtrado por método de pago
CREATE INDEX IF NOT EXISTS idx_ordenes_pago_metodo_pago 
  ON public.ordenes_pago(metodo_pago);

-- Verificar índices creados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'ordenes_pago'
ORDER BY indexname;
