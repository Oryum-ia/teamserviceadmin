-- =====================================================
-- TRIGGERS PARA NOTIFICACIONES DE DIAGNÓSTICO Y REPARACIÓN
-- Fecha: 2026-01-14
-- Descripción: Crea notificaciones automáticas cuando se completa
--              el diagnóstico o la reparación de una orden
-- =====================================================

-- =====================================================
-- FUNCIÓN: Notificar diagnóstico completado
-- Se dispara cuando fecha_fin_diagnostico cambia de NULL a un valor
-- =====================================================
CREATE OR REPLACE FUNCTION public.notificar_diagnostico_completado()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_nombre TEXT;
  v_tecnico_nombre TEXT;
BEGIN
  -- Solo procesar si fecha_fin_diagnostico cambió de NULL a un valor
  IF OLD.fecha_fin_diagnostico IS NULL AND NEW.fecha_fin_diagnostico IS NOT NULL THEN
    
    -- Obtener nombre del cliente
    SELECT COALESCE(nombre_comercial, razon_social, nombre_contacto, 'Cliente')
    INTO v_cliente_nombre
    FROM clientes
    WHERE id = NEW.cliente_id;
    
    -- Obtener nombre del técnico de diagnóstico si existe
    IF NEW.tecnico_diagnostico IS NOT NULL THEN
      SELECT nombre
      INTO v_tecnico_nombre
      FROM usuarios
      WHERE id = NEW.tecnico_diagnostico::uuid;
    END IF;
    
    -- Insertar notificación
    INSERT INTO notificaciones (
      tipo,
      titulo,
      mensaje,
      leida,
      referencia_id,
      referencia_tipo,
      datos_adicionales
    ) VALUES (
      'diagnostico_completado',
      '✅ Diagnóstico Completado',
      'El diagnóstico de la orden ' || NEW.codigo || ' ha sido completado' || 
        CASE WHEN v_tecnico_nombre IS NOT NULL THEN ' por ' || v_tecnico_nombre ELSE '' END || '.',
      false,
      NEW.id::text,
      'orden',
      jsonb_build_object(
        'orden_id', NEW.id,
        'numero_orden', NEW.codigo,
        'cliente_nombre', v_cliente_nombre,
        'tecnico_nombre', v_tecnico_nombre
      )
    );
    
    RAISE NOTICE 'Notificación de diagnóstico completado creada para orden %', NEW.codigo;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Diagnóstico completado
-- =====================================================
DROP TRIGGER IF EXISTS trigger_notificar_diagnostico_completado ON ordenes;

CREATE TRIGGER trigger_notificar_diagnostico_completado
  AFTER UPDATE OF fecha_fin_diagnostico ON ordenes
  FOR EACH ROW
  EXECUTE FUNCTION notificar_diagnostico_completado();

-- =====================================================
-- FUNCIÓN: Notificar reparación completada
-- Se dispara cuando fecha_fin_reparacion cambia de NULL a un valor
-- =====================================================
CREATE OR REPLACE FUNCTION public.notificar_reparacion_completada()
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_nombre TEXT;
  v_tecnico_nombre TEXT;
BEGIN
  -- Solo procesar si fecha_fin_reparacion cambió de NULL a un valor
  IF OLD.fecha_fin_reparacion IS NULL AND NEW.fecha_fin_reparacion IS NOT NULL THEN
    
    -- Obtener nombre del cliente
    SELECT COALESCE(nombre_comercial, razon_social, nombre_contacto, 'Cliente')
    INTO v_cliente_nombre
    FROM clientes
    WHERE id = NEW.cliente_id;
    
    -- Obtener nombre del técnico de reparación si existe
    IF NEW.tecnico_repara IS NOT NULL THEN
      SELECT nombre
      INTO v_tecnico_nombre
      FROM usuarios
      WHERE id = NEW.tecnico_repara::uuid;
    END IF;
    
    -- Insertar notificación
    INSERT INTO notificaciones (
      tipo,
      titulo,
      mensaje,
      leida,
      referencia_id,
      referencia_tipo,
      datos_adicionales
    ) VALUES (
      'reparacion_completada',
      '🔧 Reparación Completada',
      'La reparación de la orden ' || NEW.codigo || ' ha sido completada' || 
        CASE WHEN v_tecnico_nombre IS NOT NULL THEN ' por ' || v_tecnico_nombre ELSE '' END || '. Lista para entrega.',
      false,
      NEW.id::text,
      'orden',
      jsonb_build_object(
        'orden_id', NEW.id,
        'numero_orden', NEW.codigo,
        'cliente_nombre', v_cliente_nombre,
        'tecnico_nombre', v_tecnico_nombre
      )
    );
    
    RAISE NOTICE 'Notificación de reparación completada creada para orden %', NEW.codigo;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Reparación completada
-- =====================================================
DROP TRIGGER IF EXISTS trigger_notificar_reparacion_completada ON ordenes;

CREATE TRIGGER trigger_notificar_reparacion_completada
  AFTER UPDATE OF fecha_fin_reparacion ON ordenes
  FOR EACH ROW
  EXECUTE FUNCTION notificar_reparacion_completada();

-- =====================================================
-- VERIFICAR TRIGGERS CREADOS
-- =====================================================
-- SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_notificar_%';
