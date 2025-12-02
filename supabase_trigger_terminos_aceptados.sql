-- Trigger para crear notificación cuando el cliente acepta o rechaza los términos y condiciones
-- Este trigger se ejecuta cuando terminos_aceptados cambia en la tabla ordenes

-- Primero, agregar 'terminos_aceptados' y 'terminos_rechazados' al check constraint de tipos
-- (Ejecutar esto primero si los tipos no existen)
/*
ALTER TABLE public.notificaciones 
DROP CONSTRAINT notificaciones_tipo_check;

ALTER TABLE public.notificaciones 
ADD CONSTRAINT notificaciones_tipo_check CHECK (
  tipo::text = ANY (ARRAY[
    'pqr_nuevo'::character varying,
    'encuesta_nueva'::character varying,
    'cotizacion_aceptada'::character varying,
    'orden_autorizada'::character varying,
    'garantia_info'::character varying,
    'alerta_sistema'::character varying,
    'success'::character varying,
    'error'::character varying,
    'warning'::character varying,
    'info'::character varying,
    'terminos_aceptados'::character varying,
    'terminos_rechazados'::character varying
  ]::text[])
);
*/

-- Crear la función que se ejecutará cuando cambien los términos
CREATE OR REPLACE FUNCTION notificar_terminos_aceptados()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_nombre TEXT;
  v_tipo_notificacion TEXT;
  v_titulo TEXT;
  v_mensaje TEXT;
BEGIN
  -- Solo procesar si terminos_aceptados cambió de NULL a TRUE o FALSE
  IF NEW.terminos_aceptados IS NOT NULL 
     AND (OLD.terminos_aceptados IS NULL OR OLD.terminos_aceptados IS DISTINCT FROM NEW.terminos_aceptados) THEN
    
    -- Obtener nombre del cliente
    SELECT COALESCE(nombre_comercial, razon_social, 'Cliente') 
    INTO v_cliente_nombre
    FROM clientes 
    WHERE id = NEW.cliente_id;
    
    -- Determinar tipo y mensaje según aceptación o rechazo
    IF NEW.terminos_aceptados = TRUE THEN
      v_tipo_notificacion := 'orden_autorizada';
      v_titulo := 'Términos y Condiciones Aceptados';
      v_mensaje := format(
        'El cliente %s ha ACEPTADO los términos y condiciones para la orden %s.',
        v_cliente_nombre,
        NEW.codigo
      );
    ELSE
      v_tipo_notificacion := 'warning';
      v_titulo := 'Términos y Condiciones Rechazados';
      v_mensaje := format(
        'El cliente %s ha RECHAZADO los términos y condiciones para la orden %s.',
        v_cliente_nombre,
        NEW.codigo
      );
    END IF;
    
    -- Insertar la notificación
    INSERT INTO notificaciones (
      tipo,
      titulo,
      mensaje,
      leida,
      datos_adicionales,
      referencia_id,
      referencia_tipo,
      created_at,
      updated_at
    ) VALUES (
      v_tipo_notificacion,
      v_titulo,
      v_mensaje,
      FALSE,
      jsonb_build_object(
        'orden_id', NEW.id,
        'numero_orden', NEW.codigo,
        'cliente_id', NEW.cliente_id,
        'cliente_nombre', v_cliente_nombre,
        'terminos_aceptados', NEW.terminos_aceptados,
        'fecha_aceptacion', NOW()
      ),
      NEW.id::TEXT,
      'orden',
      NOW(),
      NOW()
    );
    
    -- Log para debugging
    RAISE NOTICE 'Notificación creada: Cliente % % términos para orden %', 
      v_cliente_nombre, 
      CASE WHEN NEW.terminos_aceptados THEN 'aceptó' ELSE 'rechazó' END,
      NEW.codigo;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS notificar_terminos_aceptados ON ordenes;

-- Crear el trigger que ejecuta la función después de cada UPDATE
CREATE TRIGGER trigger_terminos_aceptados
  AFTER UPDATE ON ordenes
  FOR EACH ROW
  WHEN (NEW.terminos_aceptados IS DISTINCT FROM OLD.terminos_aceptados)
  EXECUTE FUNCTION notificar_terminos_aceptados();

-- Comentarios explicativos
COMMENT ON FUNCTION notificar_terminos_aceptados() IS 
'Función que crea una notificación cuando el cliente acepta o rechaza los términos y condiciones de una orden';

COMMENT ON TRIGGER trigger_terminos_aceptados ON ordenes IS 
'Trigger que detecta cambios en terminos_aceptados y crea una notificación correspondiente';
