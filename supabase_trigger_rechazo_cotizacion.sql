-- Trigger para actualizar automáticamente el estado a 'Entrega' cuando el cliente rechaza la cotización
-- Este trigger se ejecuta cuando aprobado_cliente cambia a false

-- Primero, crear la función que se ejecutará
CREATE OR REPLACE FUNCTION actualizar_estado_por_rechazo()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar si aprobado_cliente cambió de NULL o TRUE a FALSE
  -- Y si el estado actual es 'Cotización' o 'Esperando aceptación'
  IF NEW.aprobado_cliente = FALSE 
     AND (OLD.aprobado_cliente IS NULL OR OLD.aprobado_cliente = TRUE)
     AND (NEW.estado_actual = 'Cotización' OR NEW.estado_actual = 'Esperando aceptación') THEN
    
    -- Actualizar el estado a 'Entrega'
    NEW.estado_actual := 'Entrega';
    NEW.ultima_actualizacion := NOW();
    
    -- Log para debugging (opcional)
    RAISE NOTICE 'Cliente rechazó cotización. Estado actualizado a Entrega para orden ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger que ejecuta la función antes de cada UPDATE
DROP TRIGGER IF EXISTS trigger_rechazo_cotizacion ON ordenes;

CREATE TRIGGER trigger_rechazo_cotizacion
  BEFORE UPDATE ON ordenes
  FOR EACH ROW
  WHEN (NEW.aprobado_cliente IS DISTINCT FROM OLD.aprobado_cliente)
  EXECUTE FUNCTION actualizar_estado_por_rechazo();

-- Comentario explicativo
COMMENT ON FUNCTION actualizar_estado_por_rechazo() IS 
'Función que actualiza automáticamente el estado de una orden a "Entrega" cuando el cliente rechaza la cotización (aprobado_cliente = false)';

COMMENT ON TRIGGER trigger_rechazo_cotizacion ON ordenes IS 
'Trigger que detecta cuando aprobado_cliente cambia a false y actualiza el estado_actual a "Entrega"';
