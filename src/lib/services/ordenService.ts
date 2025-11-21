import { supabase } from "@/lib/supabaseClient";
import { Orden, OrdenPhase, OrdenStatus } from "@/types/database.types";
import { notificarOrdenCreada, notificarCambioFase } from "./emailNotificationService";
import { crearEquipo } from "./equipoService";

/**
 * Crear una nueva orden
 */
export async function crearOrden(data: {
  cliente_id: string;
  equipo_id?: string;
  codigo_qr?: string;
  modelo?: string;
  serie_pieza?: string;
  tipo?: string;
  tipo_orden?: string;
  descripcion_problema?: string;
  es_retrabajo?: boolean;
}) {
  // Generar código de orden único (no usar codigo_qr para evitar duplicados)
  const codigo = `ORD-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

  // Determinar responsable (usuario actual)
  let responsable = 'Desconocido';
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    responsable = (user?.user_metadata?.nombres || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.email || user?.email || 'Desconocido') as string;
  } catch (e) {
    // Ignorar si no hay sesión
  }

  // Si no se proporciona equipo_id, crear el equipo automáticamente
  let equipoId = data.equipo_id;
  if (!equipoId && data.cliente_id && data.modelo && data.serie_pieza) {
    try {
      console.log('🔧 Creando equipo automáticamente...');
      const equipoCreado = await crearEquipo({
        cliente_id: data.cliente_id,
        modelo_id: data.modelo,
        serie_pieza: data.serie_pieza,
        descripcion: data.descripcion_problema,
        estado: 'Habilitado'
      });
      equipoId = equipoCreado.id;
      console.log('✅ Equipo creado automáticamente:', equipoId);
    } catch (equipoError) {
      console.error('❌ Error al crear equipo automáticamente:', equipoError);
      // Continuar sin equipo si falla la creación
    }
  }

  // Construir comentario de recepción con los datos del equipo
  const comentarioRecepcion = `
Modelo: ${data.modelo || 'N/A'}
Serie/Pieza: ${data.serie_pieza || 'N/A'}
Tipo: ${data.tipo || 'N/A'}
Descripción: ${data.descripcion_problema || 'N/A'}
  `.trim();

  const ordenData = {
    cliente_id: data.cliente_id,
    equipo_id: equipoId || null,
    codigo: codigo,
    responsable,
    estado_actual: 'Recepción',
    tipo_orden: data.tipo_orden || 'Reparación',
    prioridad: 'Normal',
    tipo_entrega: 'En sitio',
    fecha_creacion: new Date().toISOString(),
    comentarios_recepcion: comentarioRecepcion,
    es_retrabajo: data.es_retrabajo || false,
    valor_revision: 0,
    revision_pagada: false,
    aprobado_cliente: null,
    total: 0
  };

  const { data: orden, error } = await supabase
    .from("ordenes")
    .insert([ordenData])
    .select(`
      *,
      clientes(*)
    `)
    .single();

  if (error) {
    console.error("❌ Error al crear orden:", error);
    throw error;
  }

  console.log("✅ Orden creada:", orden);
  
  // Enviar correo de confirmación de orden creada
  try {
    await notificarOrdenCreada(orden.id);
  } catch (emailError) {
    console.error("⚠️ Error al enviar correo de confirmación:", emailError);
    // No lanzar error, la orden ya fue creada exitosamente
  }
  
  return orden;
}

/**
 * Obtener todas las órdenes
 */
export async function obtenerTodasLasOrdenes() {
  const { data, error } = await supabase
    .from("ordenes")
    .select(`
      *,
      cliente:clientes(*),
      equipo:equipos(
        *,
        modelo:modelos(
          *,
          marca:marcas(*)
        )
      )
    `)
    .order("fecha_creacion", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener órdenes:", error);
    throw error;
  }

  // Procesar los datos para extraer información del equipo y comentarios
  const processedData = data?.map(orden => {
    // Extraer datos del equipo si existe
    let tipo_producto = null;
    let marca = null;
    let modelo = null;
    let serial = null;

    if (orden.equipo) {
      tipo_producto = orden.equipo.tipo_equipo;
      serial = orden.equipo.serial;
      if (orden.equipo.modelo) {
        modelo = orden.equipo.modelo.equipo;
        if (orden.equipo.modelo.marca) {
          marca = orden.equipo.modelo.marca.nombre;
        }
      }
    }

    // Si no hay equipo, intentar extraer de comentarios_recepcion
    if (!tipo_producto && orden.comentarios_recepcion) {
      const tipoMatch = orden.comentarios_recepcion.match(/Tipo:\s*(.+)/);
      if (tipoMatch) tipo_producto = tipoMatch[1].trim();
    }

    if (!serial && orden.comentarios_recepcion) {
      const serialMatch = orden.comentarios_recepcion.match(/Serie\/Pieza:\s*(.+)/);
      if (serialMatch) serial = serialMatch[1].trim();
    }

    return {
      ...orden,
      tipo_producto,
      marca,
      modelo,
      serial,
      numero_orden: orden.codigo,
      estado: mapEstadoToOrdenStatus(orden.estado_actual),
      fase_actual: mapEstadoToOrdenPhase(orden.estado_actual)
    };
  });

  return processedData || [];
}

// Helper para mapear estado_actual a OrdenStatus
function mapEstadoToOrdenStatus(estadoActual: string): any {
  const estadoMap: Record<string, any> = {
    'Recepción': 'pendiente',
    'Diagnóstico': 'en_proceso',
    'Cotización': 'en_proceso',
    'Esperando aprobación': 'pendiente',
    'Esperando aceptación': 'pendiente',
    'Solicitud de repuestos': 'espera_repuestos',
    'Esperando repuestos': 'espera_repuestos',
    'Reparación': 'en_proceso',
    'Entrega': 'completada',
    'Finalizada': 'completada',
    'Cancelada': 'cancelada'
  };
  return estadoMap[estadoActual] || 'pendiente';
}

// Helper para mapear estado_actual a OrdenPhase
function mapEstadoToOrdenPhase(estadoActual: string): any {
  const faseMap: Record<string, any> = {
    'Recepción': 'recepcion',
    'Diagnóstico': 'diagnostico',
    'Cotización': 'cotizacion',
    'Esperando aprobación': 'cotizacion',
    'Esperando aceptación': 'cotizacion',
    'Solicitud de repuestos': 'cotizacion',
    'Esperando repuestos': 'cotizacion',
    'Reparación': 'reparacion',
    'Entrega': 'entrega',
    'Finalizada': 'finalizada',
    'Cancelada': 'finalizada'
  };
  return faseMap[estadoActual] || 'recepcion';
}

/**
 * Obtener una orden por ID
 */
export async function obtenerOrdenPorId(id: string) {
  const { data, error } = await supabase
    .from("ordenes")
    .select(`
      *,
      cliente:clientes(*),
      equipo:equipos(
        *,
        modelo:modelos(
          *,
          marca:marcas(*)
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ Error al obtener orden:", error);
    throw error;
  }

  // Mapear estado_actual a fase_actual si no existe
  if (data && !data.fase_actual && data.estado_actual) {
    data.fase_actual = mapEstadoToOrdenPhase(data.estado_actual);
  }

  return data as Orden;
}

/**
 * Actualizar diagnóstico de una orden
 * Solo se puede modificar si está en fase de diagnóstico
 */
export async function actualizarDiagnostico(
  ordenId: string,
  diagnostico: any
) {
  // Verificar que la orden esté en fase de diagnóstico
  const { data: ordenActual, error: fetchError } = await supabase
    .from("ordenes")
    .select("estado_actual")
    .eq("id", ordenId)
    .single();

  if (fetchError) throw fetchError;

  if (ordenActual.estado_actual !== 'Diagnóstico') {
    throw new Error("No se puede modificar el diagnóstico. La orden ya avanzó de fase.");
  }

  const { data, error } = await supabase
    .from("ordenes")
    .update({
      comentarios_diagnostico: diagnostico.comentarios || '',
      ultima_actualizacion: new Date().toISOString()
    })
    .eq("id", ordenId)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar diagnóstico:", error);
    throw error;
  }

  console.log("✅ Diagnóstico actualizado");
  return data as Orden;
}

/**
 * Avanzar orden a fase de cotización
 */
export async function avanzarACotizacion(
  ordenId: string,
  cotizacion?: any
) {
  // Verificar que la orden esté en diagnóstico
  const { data: ordenActual, error: fetchError } = await supabase
    .from("ordenes")
    .select("estado_actual")
    .eq("id", ordenId)
    .single();

  if (fetchError) throw fetchError;

  if (ordenActual.estado_actual !== 'Diagnóstico') {
    throw new Error("La orden debe estar en fase de diagnóstico para avanzar a cotización.");
  }

  const { data, error } = await supabase
    .from("ordenes")
    .update({
      estado_actual: 'Cotización',
      ultima_actualizacion: new Date().toISOString()
    })
    .eq("id", ordenId)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al avanzar a cotización:", error);
    throw error;
  }

  console.log("✅ Orden avanzada a cotización");
  
  // Enviar notificación de cambio de fase
  try {
    await notificarCambioFase(ordenId, 'Cotización');
  } catch (emailError) {
    console.error("⚠️ Error al enviar correo de cambio de fase:", emailError);
  }
  
  return data as Orden;
}

/**
 * Actualizar cotización (solo si está en fase de cotización)
 */
export async function actualizarCotizacion(
  ordenId: string,
  cotizacion: any
) {
  const { data: ordenActual, error: fetchError } = await supabase
    .from("ordenes")
    .select("estado_actual")
    .eq("id", ordenId)
    .single();

  if (fetchError) throw fetchError;

  if (ordenActual.estado_actual !== 'Cotización') {
    throw new Error("La orden debe estar en fase de cotización para modificarla.");
  }

  const { data, error } = await supabase
    .from("ordenes")
    .update({
      comentarios_cotizacion: cotizacion.comentarios || '',
      total: cotizacion.total || 0,
      fecha_cotizacion: cotizacion.fecha_cotizacion || new Date().toISOString(),
      ultima_actualizacion: new Date().toISOString()
    })
    .eq("id", ordenId)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar cotización:", error);
    throw error;
  }

  console.log("✅ Cotización actualizada");
  return data as Orden;
}

/**
 * Marcar orden como en espera de repuestos
 * Mantiene la fase en cotización pero cambia el estado interno
 */
export async function marcarEsperaRepuestos(ordenId: string) {
  const { data, error } = await supabase
    .from("ordenes")
    .update({
      estado_actual: 'Esperando repuestos',
      fase_actual: 'cotizacion',
      ultima_actualizacion: new Date().toISOString()
    })
    .eq("id", ordenId)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al marcar espera de repuestos:", error);
    throw error;
  }

  console.log("✅ Orden marcada como en espera de repuestos");
  return data as Orden;
}

/**
 * Avanzar orden a fase de reparación
 */
export async function avanzarAReparacion(
  ordenId: string,
  reparacion: any
) {
  const { data: ordenActual, error: fetchError } = await supabase
    .from("ordenes")
    .select("estado_actual, aprobado_cliente")
    .eq("id", ordenId)
    .single();

  if (fetchError) throw fetchError;

  if (ordenActual.estado_actual !== 'Cotización') {
    throw new Error("La orden debe estar en fase de cotización para avanzar a reparación.");
  }

  // Verificar que la cotización esté aprobada
  if (!ordenActual.aprobado_cliente) {
    throw new Error("La cotización debe ser aprobada por el cliente antes de iniciar la reparación.");
  }

  const { data, error } = await supabase
    .from("ordenes")
    .update({
      estado_actual: 'Reparación',
      fecha_inicio_reparacion: new Date().toISOString(),
      ultima_actualizacion: new Date().toISOString()
    })
    .eq("id", ordenId)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al avanzar a reparación:", error);
    throw error;
  }

  console.log("✅ Orden avanzada a reparación");
  
  // Enviar notificación de cambio de fase
  try {
    await notificarCambioFase(ordenId, 'Reparación');
  } catch (emailError) {
    console.error("⚠️ Error al enviar correo de cambio de fase:", emailError);
  }
  
  return data as Orden;
}

/**
 * Finalizar orden
 */
export async function finalizarOrden(ordenId: string) {
  const { data, error } = await supabase
    .from("ordenes")
    .update({
      estado_actual: 'Finalizada',
      fecha_finalizacion: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", ordenId)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al finalizar orden:", error);
    throw error;
  }

  console.log("✅ Orden finalizada");
  
  // Enviar notificación de cambio de fase
  try {
    await notificarCambioFase(ordenId, 'Finalizada');
  } catch (emailError) {
    console.error("⚠️ Error al enviar correo de cambio de fase:", emailError);
  }
  
  return data as Orden;
}

/**
 * Agregar comentario de retroceso
 */
export async function agregarComentarioRetroceso(
  ordenId: string,
  comentario: {
    fase_origen: OrdenPhase;
    fase_destino: OrdenPhase;
    comentario: string;
    usuario_id: string;
  }
) {
  const { data: ordenActual, error: fetchError } = await supabase
    .from("ordenes")
    .select("comentarios_retroceso")
    .eq("id", ordenId)
    .single();

  if (fetchError) throw fetchError;

  const comentariosActuales = ordenActual.comentarios_retroceso || [];
  const nuevoComentario = {
    ...comentario,
    fecha: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("ordenes")
    .update({
      comentarios_retroceso: [...comentariosActuales, nuevoComentario],
      fase_actual: comentario.fase_destino,
      updated_at: new Date().toISOString()
    })
    .eq("id", ordenId)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al agregar comentario de retroceso:", error);
    throw error;
  }

  console.log("✅ Comentario de retroceso agregado");
  return data as Orden;
}

/**
 * Obtener órdenes por estado
 */
export async function obtenerOrdenesPorEstado(estado: OrdenStatus) {
  const { data, error } = await supabase
    .from("ordenes")
    .select(`
      *,
      cliente:clientes(*)
    `)
    .eq("estado", estado)
    .order("fecha_creacion", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener órdenes por estado:", error);
    throw error;
  }

  return data;
}

/**
 * Obtener órdenes por fase
 */
export async function obtenerOrdenesPorFase(fase: OrdenPhase) {
  const { data, error } = await supabase
    .from("ordenes")
    .select(`
      *,
      cliente:clientes(*)
    `)
    .eq("fase_actual", fase)
    .order("fecha_creacion", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener órdenes por fase:", error);
    throw error;
  }

  return data;
}

/**
 * Buscar órdenes por número de orden o cliente
 */
export async function buscarOrdenes(termino: string) {
  const { data, error } = await supabase
    .from("ordenes")
    .select(`
      *,
      cliente:clientes(*)
    `)
    .or(`numero_orden.ilike.%${termino}%`)
    .order("fecha_creacion", { ascending: false });

  if (error) {
    console.error("❌ Error al buscar órdenes:", error);
    throw error;
  }

  return data;
}
