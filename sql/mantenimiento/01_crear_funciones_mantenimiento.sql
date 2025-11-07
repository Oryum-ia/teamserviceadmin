-- =====================================================
-- FUNCIONES PARA NOTIFICACIONES DE MANTENIMIENTO
-- =====================================================
-- Este script crea las funciones necesarias para:
-- 1. Verificar órdenes con mantenimiento próximo (mañana)
-- 2. Crear notificaciones en la tabla notificaciones
-- 3. Enviar correos a los clientes
-- =====================================================

-- Primero, agregamos el campo fecha_proximo_mantenimiento a la tabla ordenes si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ordenes' 
        AND column_name = 'fecha_proximo_mantenimiento'
    ) THEN
        ALTER TABLE public.ordenes 
        ADD COLUMN fecha_proximo_mantenimiento date;
        
        COMMENT ON COLUMN public.ordenes.fecha_proximo_mantenimiento 
        IS 'Fecha programada para el próximo mantenimiento del equipo';
    END IF;
END $$;

-- =====================================================
-- FUNCIÓN: verificar_mantenimientos_proximos
-- Descripción: Busca órdenes cuyo mantenimiento es mañana
--              y crea notificaciones para los clientes
-- =====================================================
CREATE OR REPLACE FUNCTION public.verificar_mantenimientos_proximos()
RETURNS TABLE (
    orden_id uuid,
    cliente_id uuid,
    codigo_orden text,
    fecha_mantenimiento date,
    notificacion_creada boolean
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_orden RECORD;
    v_notificacion_id uuid;
    v_cliente RECORD;
    v_equipo_descripcion text;
BEGIN
    -- Buscar órdenes cuyo mantenimiento es mañana
    FOR v_orden IN 
        SELECT 
            o.id,
            o.codigo,
            o.cliente_id,
            o.fecha_proximo_mantenimiento,
            o.equipo_id,
            o.comentarios_entrega
        FROM public.ordenes o
        WHERE o.fecha_proximo_mantenimiento = CURRENT_DATE + INTERVAL '1 day'
        AND o.estado_actual = 'Entregado'
        AND o.fecha_proximo_mantenimiento IS NOT NULL
    LOOP
        -- Obtener información del cliente
        SELECT * INTO v_cliente
        FROM public.clientes
        WHERE id = v_orden.cliente_id;
        
        IF v_cliente IS NULL THEN
            CONTINUE; -- Si no hay cliente, pasar a la siguiente orden
        END IF;
        
        -- Construir descripción del equipo
        v_equipo_descripcion := '';
        IF v_orden.equipo_id IS NOT NULL THEN
            SELECT 
                COALESCE(ma.nombre || ' ' || mo.equipo || ' - ' || e.tipo_equipo, 'Equipo')
            INTO v_equipo_descripcion
            FROM public.equipos e
            LEFT JOIN public.modelos mo ON e.modelo_id = mo.id
            LEFT JOIN public.marcas ma ON mo.marca_id = ma.id
            WHERE e.id = v_orden.equipo_id;
        END IF;
        
        -- Si no hay descripción, usar texto genérico
        IF v_equipo_descripcion = '' OR v_equipo_descripcion IS NULL THEN
            v_equipo_descripcion := 'Su equipo';
        END IF;
        
        -- Crear notificación en la tabla notificaciones
        INSERT INTO public.notificaciones (
            tipo,
            titulo,
            mensaje,
            leida,
            usuario_id,
            referencia_id,
            referencia_tipo,
            datos_adicionales,
            created_at
        ) VALUES (
            'info',
            'Recordatorio de Mantenimiento',
            'Mañana ' || TO_CHAR(v_orden.fecha_proximo_mantenimiento, 'DD/MM/YYYY') || 
            ' es la fecha programada para el mantenimiento de ' || v_equipo_descripcion || 
            ' (Orden ' || v_orden.codigo || ')',
            false,
            v_cliente.id, -- Asumiendo que cliente_id puede usarse como usuario_id
            v_orden.id::text,
            'orden_mantenimiento',
            jsonb_build_object(
                'orden_codigo', v_orden.codigo,
                'fecha_mantenimiento', v_orden.fecha_proximo_mantenimiento,
                'equipo_descripcion', v_equipo_descripcion,
                'cliente_email', COALESCE(v_cliente.correo_electronico, v_cliente.email),
                'cliente_nombre', CASE 
                    WHEN v_cliente.es_juridica THEN 
                        COALESCE(v_cliente.razon_social, v_cliente.nombre_comercial, 'Cliente')
                    ELSE 
                        COALESCE(v_cliente.nombre_contacto, v_cliente.nombre_comercial, 'Cliente')
                END
            ),
            NOW()
        ) RETURNING id INTO v_notificacion_id;
        
        -- Retornar información de la orden procesada
        orden_id := v_orden.id;
        cliente_id := v_orden.cliente_id;
        codigo_orden := v_orden.codigo;
        fecha_mantenimiento := v_orden.fecha_proximo_mantenimiento;
        notificacion_creada := (v_notificacion_id IS NOT NULL);
        
        RETURN NEXT;
        
        -- Log para debugging (opcional)
        RAISE NOTICE 'Notificación creada para orden % - Cliente %', 
            v_orden.codigo, 
            COALESCE(v_cliente.nombre_contacto, v_cliente.razon_social);
            
    END LOOP;
    
    RETURN;
END;
$$;

COMMENT ON FUNCTION public.verificar_mantenimientos_proximos() 
IS 'Verifica órdenes con mantenimiento programado para mañana y crea notificaciones automáticas';

-- =====================================================
-- FUNCIÓN: obtener_notificaciones_mantenimiento_pendientes
-- Descripción: Obtiene notificaciones de mantenimiento
--              que aún no han sido procesadas para envío de email
-- =====================================================
CREATE OR REPLACE FUNCTION public.obtener_notificaciones_mantenimiento_pendientes()
RETURNS TABLE (
    notificacion_id uuid,
    orden_codigo text,
    cliente_email text,
    cliente_nombre text,
    fecha_mantenimiento date,
    equipo_descripcion text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id as notificacion_id,
        (n.datos_adicionales->>'orden_codigo')::text as orden_codigo,
        (n.datos_adicionales->>'cliente_email')::text as cliente_email,
        (n.datos_adicionales->>'cliente_nombre')::text as cliente_nombre,
        (n.datos_adicionales->>'fecha_mantenimiento')::date as fecha_mantenimiento,
        (n.datos_adicionales->>'equipo_descripcion')::text as equipo_descripcion
    FROM public.notificaciones n
    WHERE n.tipo = 'info'
    AND n.referencia_tipo = 'orden_mantenimiento'
    AND n.created_at >= CURRENT_DATE -- Solo notificaciones de hoy
    AND NOT COALESCE((n.datos_adicionales->>'email_enviado')::boolean, false);
END;
$$;

COMMENT ON FUNCTION public.obtener_notificaciones_mantenimiento_pendientes()
IS 'Obtiene notificaciones de mantenimiento pendientes de envío por email';

-- =====================================================
-- FUNCIÓN: marcar_notificacion_email_enviado
-- Descripción: Marca una notificación como enviada por email
-- =====================================================
CREATE OR REPLACE FUNCTION public.marcar_notificacion_email_enviado(
    p_notificacion_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.notificaciones
    SET 
        datos_adicionales = jsonb_set(
            datos_adicionales,
            '{email_enviado}',
            'true'::jsonb
        ),
        datos_adicionales = jsonb_set(
            datos_adicionales,
            '{email_enviado_fecha}',
            to_jsonb(NOW())
        ),
        updated_at = NOW()
    WHERE id = p_notificacion_id;
    
    RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.marcar_notificacion_email_enviado(uuid)
IS 'Marca una notificación como enviada por email';

-- =====================================================
-- GRANT PERMISSIONS (ajustar según tu configuración)
-- =====================================================
-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.verificar_mantenimientos_proximos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_notificaciones_mantenimiento_pendientes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_notificacion_email_enviado(uuid) TO authenticated;

-- Otorgar permisos al servicio (service_role)
GRANT EXECUTE ON FUNCTION public.verificar_mantenimientos_proximos() TO service_role;
GRANT EXECUTE ON FUNCTION public.obtener_notificaciones_mantenimiento_pendientes() TO service_role;
GRANT EXECUTE ON FUNCTION public.marcar_notificacion_email_enviado(uuid) TO service_role;
