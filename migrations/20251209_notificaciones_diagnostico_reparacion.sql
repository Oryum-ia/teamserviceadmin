-- Migración: Sistema de notificaciones para diagnóstico y reparación completados
-- Fecha: 2025-12-09
-- Descripción: Crear tabla de notificaciones y triggers para notificar cuando se completen fases

-- 1. Crear tabla de notificaciones si no existe
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  orden_id INTEGER REFERENCES ordenes(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'diagnostico_completado', 'reparacion_completada', etc.
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb, -- Información adicional
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_orden_id ON notificaciones(orden_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at DESC);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS: Los usuarios solo pueden ver sus propias notificaciones
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias notificaciones" ON notificaciones;
CREATE POLICY "Usuarios pueden ver sus propias notificaciones"
  ON notificaciones
  FOR SELECT
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias notificaciones" ON notificaciones;
CREATE POLICY "Usuarios pueden actualizar sus propias notificaciones"
  ON notificaciones
  FOR UPDATE
  USING (auth.uid() = usuario_id);

-- 5. Función para crear notificación
CREATE OR REPLACE FUNCTION crear_notificacion(
  p_usuario_id UUID,
  p_orden_id INTEGER,
  p_tipo VARCHAR,
  p_titulo VARCHAR,
  p_mensaje TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notificacion_id UUID;
BEGIN
  INSERT INTO notificaciones (
    usuario_id,
    orden_id,
    tipo,
    titulo,
    mensaje,
    metadata,
    leida
  ) VALUES (
    p_usuario_id,
    p_orden_id,
    p_tipo,
    p_titulo,
    p_mensaje,
    p_metadata,
    FALSE
  )
  RETURNING id INTO v_notificacion_id;
  
  RETURN v_notificacion_id;
END;
$$;

-- 6. Función para notificar a admins cuando se completa diagnóstico
CREATE OR REPLACE FUNCTION notificar_diagnostico_completado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
  v_tecnico_nombre TEXT;
  v_orden_codigo TEXT;
BEGIN
  -- Solo ejecutar si cambió fecha_fin_diagnostico de NULL a un valor
  IF OLD.fecha_fin_diagnostico IS NULL AND NEW.fecha_fin_diagnostico IS NOT NULL THEN
    
    -- Obtener código de orden
    v_orden_codigo := NEW.codigo;
    
    -- Obtener nombre del técnico que hizo el diagnóstico
    SELECT nombre INTO v_tecnico_nombre
    FROM usuarios
    WHERE id = NEW.tecnico_diagnostico;
    
    IF v_tecnico_nombre IS NULL THEN
      v_tecnico_nombre := 'Técnico desconocido';
    END IF;
    
    -- Notificar a todos los admins y super-admins
    FOR v_admin IN 
      SELECT id 
      FROM usuarios 
      WHERE rol IN ('admin', 'super-admin') 
      AND activo = TRUE
    LOOP
      PERFORM crear_notificacion(
        v_admin.id,
        NEW.id,
        'diagnostico_completado',
        '✅ Diagnóstico Completado',
        format('El técnico %s ha completado el diagnóstico de la orden %s', 
               v_tecnico_nombre, 
               v_orden_codigo),
        jsonb_build_object(
          'tecnico_id', NEW.tecnico_diagnostico,
          'tecnico_nombre', v_tecnico_nombre,
          'orden_codigo', v_orden_codigo,
          'fecha_completado', NEW.fecha_fin_diagnostico
        )
      );
    END LOOP;
    
    RAISE NOTICE 'Notificaciones de diagnóstico completado enviadas para orden %', v_orden_codigo;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Función para notificar a admins cuando se completa reparación
CREATE OR REPLACE FUNCTION notificar_reparacion_completada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
  v_tecnico_nombre TEXT;
  v_orden_codigo TEXT;
BEGIN
  -- Solo ejecutar si cambió fecha_fin_reparacion de NULL a un valor
  IF OLD.fecha_fin_reparacion IS NULL AND NEW.fecha_fin_reparacion IS NOT NULL THEN
    
    -- Obtener código de orden
    v_orden_codigo := NEW.codigo;
    
    -- Obtener nombre del técnico que hizo la reparación
    SELECT nombre INTO v_tecnico_nombre
    FROM usuarios
    WHERE id = NEW.tecnico_repara;
    
    IF v_tecnico_nombre IS NULL THEN
      v_tecnico_nombre := 'Técnico desconocido';
    END IF;
    
    -- Notificar a todos los admins y super-admins
    FOR v_admin IN 
      SELECT id 
      FROM usuarios 
      WHERE rol IN ('admin', 'super-admin') 
      AND activo = TRUE
    LOOP
      PERFORM crear_notificacion(
        v_admin.id,
        NEW.id,
        'reparacion_completada',
        '🔧 Reparación Completada',
        format('El técnico %s ha completado la reparación de la orden %s', 
               v_tecnico_nombre, 
               v_orden_codigo),
        jsonb_build_object(
          'tecnico_id', NEW.tecnico_repara,
          'tecnico_nombre', v_tecnico_nombre,
          'orden_codigo', v_orden_codigo,
          'fecha_completado', NEW.fecha_fin_reparacion
        )
      );
    END LOOP;
    
    RAISE NOTICE 'Notificaciones de reparación completada enviadas para orden %', v_orden_codigo;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Crear triggers
DROP TRIGGER IF EXISTS trigger_notificar_diagnostico_completado ON ordenes;
CREATE TRIGGER trigger_notificar_diagnostico_completado
  AFTER UPDATE ON ordenes
  FOR EACH ROW
  EXECUTE FUNCTION notificar_diagnostico_completado();

DROP TRIGGER IF EXISTS trigger_notificar_reparacion_completada ON ordenes;
CREATE TRIGGER trigger_notificar_reparacion_completada
  AFTER UPDATE ON ordenes
  FOR EACH ROW
  EXECUTE FUNCTION notificar_reparacion_completada();

-- 9. Comentarios para documentación
COMMENT ON TABLE notificaciones IS 'Tabla de notificaciones del sistema para alertar a usuarios sobre eventos importantes';
COMMENT ON FUNCTION crear_notificacion IS 'Función helper para crear notificaciones de manera segura';
COMMENT ON FUNCTION notificar_diagnostico_completado IS 'Trigger function que notifica a admins cuando un técnico completa un diagnóstico';
COMMENT ON FUNCTION notificar_reparacion_completada IS 'Trigger function que notifica a admins cuando un técnico completa una reparación';
