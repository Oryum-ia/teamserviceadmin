/**
 * Servicio de Notificaciones
 * Maneja la creación, lectura y actualización de notificaciones del sistema
 */

export interface Notificacion {
  id: string;
  usuario_id: string;
  orden_id: number | null;
  tipo: 'diagnostico_completado' | 'reparacion_completada' | 'orden_asignada' | 'comentario_nuevo' | 'otro';
  titulo: string;
  mensaje: string;
  leida: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Obtener notificaciones del usuario actual
 */
export async function obtenerNotificacionesUsuario(
  limite: number = 50,
  soloNoLeidas: boolean = false
): Promise<Notificacion[]> {
  const { supabase } = await import('@/lib/supabaseClient');
  
  let query = supabase
    .from('notificaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite);
  
  if (soloNoLeidas) {
    query = query.eq('leida', false);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Marcar notificación como leída
 */
export async function marcarComoLeida(notificacionId: string): Promise<void> {
  const { supabase } = await import('@/lib/supabaseClient');
  const { crearTimestampColombia } = await import('@/lib/utils/dateUtils');
  
  const { error } = await supabase
    .from('notificaciones')
    .update({ 
      leida: true,
      updated_at: crearTimestampColombia()
    })
    .eq('id', notificacionId);
  
  if (error) {
    console.error('Error al marcar notificación como leída:', error);
    throw error;
  }
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function marcarTodasComoLeidas(): Promise<void> {
  const { supabase } = await import('@/lib/supabaseClient');
  const { crearTimestampColombia } = await import('@/lib/utils/dateUtils');
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  const { error } = await supabase
    .from('notificaciones')
    .update({ 
      leida: true,
      updated_at: crearTimestampColombia()
    })
    .eq('usuario_id', user.id)
    .eq('leida', false);
  
  if (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    throw error;
  }
}

/**
 * Contar notificaciones no leídas
 */
export async function contarNoLeidas(): Promise<number> {
  const { supabase } = await import('@/lib/supabaseClient');
  
  const { count, error } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('leida', false);
  
  if (error) {
    console.error('Error al contar notificaciones no leídas:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Eliminar notificación
 */
export async function eliminarNotificacion(notificacionId: string): Promise<void> {
  const { supabase } = await import('@/lib/supabaseClient');
  
  const { error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('id', notificacionId);
  
  if (error) {
    console.error('Error al eliminar notificación:', error);
    throw error;
  }
}

/**
 * Crear notificación manualmente (para casos especiales)
 */
export async function crearNotificacion(
  usuarioId: string,
  ordenId: number | null,
  tipo: Notificacion['tipo'],
  titulo: string,
  mensaje: string,
  metadata: Record<string, any> = {}
): Promise<Notificacion> {
  const { supabase } = await import('@/lib/supabaseClient');
  
  const { data, error } = await supabase
    .from('notificaciones')
    .insert({
      usuario_id: usuarioId,
      orden_id: ordenId,
      tipo,
      titulo,
      mensaje,
      metadata,
      leida: false
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
  
  return data;
}

/**
 * Suscribirse a notificaciones en tiempo real
 */
export function suscribirseANotificaciones(
  usuarioId: string,
  onNuevaNotificacion: (notificacion: Notificacion) => void,
  onActualizacion: (notificacion: Notificacion) => void
) {
  const setupSubscription = async () => {
    const { supabase } = await import('@/lib/supabaseClient');
    
    const channel = supabase
      .channel('notificaciones-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${usuarioId}`
        },
        (payload) => {
          console.log('🔔 Nueva notificación recibida:', payload.new);
          onNuevaNotificacion(payload.new as Notificacion);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${usuarioId}`
        },
        (payload) => {
          console.log('🔄 Notificación actualizada:', payload.new);
          onActualizacion(payload.new as Notificacion);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Suscrito a notificaciones en tiempo real');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en canal de notificaciones');
        }
      });
    
    return channel;
  };
  
  return setupSubscription();
}

/**
 * Notificar que el diagnóstico de una orden fue completado
 * Esta notificación aparece en la campanita del admin
 */
export async function notificarDiagnosticoCompletado(
  ordenId: string,
  codigoOrden: string,
  clienteNombre: string,
  tecnicoNombre?: string
): Promise<void> {
  const { supabase } = await import('@/lib/supabaseClient');
  
  try {
    const { error } = await supabase
      .from('notificaciones')
      .insert({
        tipo: 'diagnostico_completado',
        titulo: `✅ Diagnóstico Completado`,
        mensaje: `El diagnóstico de la orden ${codigoOrden} ha sido completado${tecnicoNombre ? ` por ${tecnicoNombre}` : ''}.`,
        leida: false,
        referencia_id: ordenId,
        referencia_tipo: 'orden',
        datos_adicionales: {
          orden_id: ordenId,
          numero_orden: codigoOrden,
          cliente_nombre: clienteNombre,
          tecnico_nombre: tecnicoNombre
        }
      });
    
    if (error) {
      console.error('Error al crear notificación de diagnóstico completado:', error);
    } else {
      console.log('✅ Notificación de diagnóstico completado creada');
    }
  } catch (err) {
    console.error('Error en notificarDiagnosticoCompletado:', err);
  }
}

/**
 * Notificar que la reparación de una orden fue completada
 * Esta notificación aparece en la campanita del admin
 */
export async function notificarReparacionCompletada(
  ordenId: string,
  codigoOrden: string,
  clienteNombre: string,
  tecnicoNombre?: string
): Promise<void> {
  const { supabase } = await import('@/lib/supabaseClient');
  
  try {
    const { error } = await supabase
      .from('notificaciones')
      .insert({
        tipo: 'reparacion_completada',
        titulo: `🔧 Reparación Completada`,
        mensaje: `La reparación de la orden ${codigoOrden} ha sido completada${tecnicoNombre ? ` por ${tecnicoNombre}` : ''}. Lista para entrega.`,
        leida: false,
        referencia_id: ordenId,
        referencia_tipo: 'orden',
        datos_adicionales: {
          orden_id: ordenId,
          numero_orden: codigoOrden,
          cliente_nombre: clienteNombre,
          tecnico_nombre: tecnicoNombre
        }
      });
    
    if (error) {
      console.error('Error al crear notificación de reparación completada:', error);
    } else {
      console.log('✅ Notificación de reparación completada creada');
    }
  } catch (err) {
    console.error('Error en notificarReparacionCompletada:', err);
  }
}
