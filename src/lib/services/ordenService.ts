
import { supabase } from "@/lib/supabaseClient";
import { Orden, OrdenPhase, OrdenStatus } from "@/types/database.types";
import { crearTimestampColombia } from "@/lib/utils/dateUtils";
import { notificarOrdenCreada, notificarCambioFase } from "./emailNotificationService";
import { crearEquipo } from "./equipoService";

/**
 * Obtener el siguiente número de secuencia para códigos de orden
 */
async function obtenerSiguienteNumeroOrden(): Promise<number> {
  // Obtener el último código de orden que sigue el patrón ORD-{número}
  const { data, error } = await supabase
    .from('ordenes')
    .select('codigo')
    .like('codigo', 'ORD-%')
    .order('fecha_creacion', { ascending: false })
    .limit(100); // Obtener las últimas 100 para encontrar el número más alto

  if (error) {
    console.error('Error al obtener última orden:', error);
    // Si hay error, empezar desde 1
    return 1;
  }

  if (!data || data.length === 0) {
    // Si no hay órdenes, empezar desde 1
    return 1;
  }

  // Extraer todos los números de los códigos ORD-{número}
  const numeros = data
    .map(orden => {
      const match = orden.codigo.match(/^ORD-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0);

  if (numeros.length === 0) {
    return 1;
  }

  // Retornar el número más alto + 1
  return Math.max(...numeros) + 1;
}

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
  valor_revision?: number;
  sede?: string;
  precio_envio?: number;
}) {
  // Generar código de orden secuencial (ORD-1, ORD-2, etc.)
  const numeroOrden = await obtenerSiguienteNumeroOrden();
  const codigo = `ORD-${numeroOrden}`;

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
    fecha_creacion: crearTimestampColombia(),
    comentarios_recepcion: comentarioRecepcion,
    es_retrabajo: data.es_retrabajo || false,
    valor_revision: data.valor_revision || 0,
    revision_pagada: false,
    aprobado_cliente: null,
    total: 0,
    sede: data.sede || null,
    precio_envio: data.precio_envio || 0
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
    // Si es error de RLS (42501), intentar via API Admin (Bypass Permissions)
    if (error.code === '42501') {
      console.warn("⚠️ Error RLS (42501) detectado. Intentando crear orden vía API Admin...");
      
      try {
        const response = await fetch('/api/ordenes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ordenData)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Error en API crear orden');
        }

        const ordenAdmin = await response.json();
        console.log("✅ Orden creada vía API (Bypass RLS):", ordenAdmin);
        
        // Ejecutar notificación de correo
        try {
          await notificarOrdenCreada(ordenAdmin.id);
        } catch (emailError) {
          console.error("⚠️ Error al enviar correo de confirmación:", emailError);
        }

        return ordenAdmin;

      } catch (apiError) {
        console.error("❌ Falló el fallback a API Admin:", apiError);
        throw apiError; 
      }
    }

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
 * @deprecated Use obtenerOrdenesPaginadas instead
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

  // Obtener sedes de usuarios por email (responsable)
  // COMENTADO TEMPORALMENTE: Posible causa de bloqueo si la tabla usuarios tiene RLS restrictivo
  let sedesPorEmail: Record<string, string> = {};

  // Procesar los datos para extraer información del equipo y comentarios
  const processedData = data?.map(orden => processOrderData(orden, sedesPorEmail));

  return processedData || [];
}

/**
 * Obtener órdenes paginadas con filtros server-side
 */
export async function obtenerOrdenesPaginadas({
  page = 1,
  pageSize = 20,
  filters = {} as any
}) {
  console.log('🔍 [ordenService] obtenerOrdenesPaginadas llamado con:', { page, pageSize, filters });
  
  // Verificar sesión antes de hacer la consulta
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error al verificar sesión:', sessionError);
      throw new Error('Error al verificar la sesión. Por favor, recargue la página.');
    }

    if (!session) {
      console.error('❌ No hay sesión válida');
      throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    }

    console.log('✅ Sesión válida verificada');
  } catch (error) {
    console.error('❌ Error en verificación de sesión:', error);
    throw error;
  }
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Iniciar query
  let query = supabase
    .from("ordenes")
    .select(`
      *,
      cliente:clientes!inner(*), 
      equipo:equipos(
        *,
        modelo:modelos(
          *,
          marca:marcas(*)
        )
      )
    `, { count: 'exact' });

  // Aplicar filtros
  if (filters.numeroOrden) {
    console.log('🔎 Aplicando filtro numeroOrden:', filters.numeroOrden);
    query = query.ilike('codigo', `%${filters.numeroOrden}%`);
  }

  if (filters.identificacion) {
    console.log('🔎 Aplicando filtro identificacion:', filters.identificacion);
    // Filtrar por ID de cliente en relación
     query = query.ilike('cliente.identificacion', `%${filters.identificacion}%`);
  }
  
  if (filters.cliente) {
    console.log('🔎 Aplicando filtro cliente:', filters.cliente);
     // Filtro en tabla relacionada clientes
     query = query.or(`razon_social.ilike.%${filters.cliente}%,nombre_comercial.ilike.%${filters.cliente}%`, { foreignTable: 'clientes' });
  }

  // Filtro de fase
  if (filters.fase) {
    console.log('🔎 Aplicando filtro fase:', filters.fase);
    // Filtrar por fase basado en estado_actual
    // Si contiene múltiples estados separados por coma, filtrar por todos
    if (filters.fase.includes(',')) {
      const fases = filters.fase.split(',').map(f => f.trim());
      console.log('🔎 Filtrando por múltiples fases:', fases);
      query = query.in('estado_actual', fases);
    } else {
      // Usar coincidencia exacta para evitar falsos positivos
      query = query.eq('estado_actual', filters.fase);
    }
  }

  // Filtro de estado
  if (filters.estado && filters.estado !== 'all') {
    console.log('🔎 Aplicando filtro estado:', filters.estado);
    const estadosDB = mapStatusToEstadosDB(filters.estado);
    console.log('📊 Estados DB mapeados:', estadosDB);
    if (estadosDB.length > 0) {
      query = query.in('estado_actual', estadosDB);
    }
  }
  
  if (filters.sede) {
      query = query.ilike('sede', `%${filters.sede}%`);
  }

  // Ordenar y paginar
  query = query.order("fecha_creacion", { ascending: false }).range(from, to);
  
  const { data, count, error } = await query;
  
  if (error) {
    console.error("❌ Error al obtener órdenes paginadas:", error);
    throw error;
  }
  
  const sedesPorEmail: Record<string, string> = {};
  
  let processedData = data?.map(orden => processOrderData(orden, sedesPorEmail)) || [];
  
  // Aplicar filtros client-side para campos anidados (serial, marca, modelo, equipo)
  // Esto es necesario porque PostgREST no soporta filtros en relaciones anidadas profundas
  if (filters.serial || filters.marca || filters.modelo || filters.equipo) {
    console.log('🔎 Aplicando filtros client-side para campos anidados');
    processedData = processedData.filter(orden => {
      let matches = true;
      
      if (filters.serial && matches) {
        const serial = orden.serial?.toLowerCase() || '';
        matches = serial.includes(filters.serial.toLowerCase());
      }
      
      if (filters.marca && matches) {
        const marca = orden.marca?.toLowerCase() || '';
        matches = marca.includes(filters.marca.toLowerCase());
      }
      
      if (filters.modelo && matches) {
        const modelo = orden.modelo?.toLowerCase() || '';
        matches = modelo.includes(filters.modelo.toLowerCase());
      }
      
      if (filters.equipo && matches) {
        const equipo = orden.tipo_producto?.toLowerCase() || '';
        matches = equipo.includes(filters.equipo.toLowerCase());
      }
      
      return matches;
    });
  }
  
  return { 
    data: processedData, 
    count: processedData.length // Ajustar count si se filtra client-side
  };
}

// Helper para procesar datos de orden
function processOrderData(orden: any, sedesPorEmail: Record<string, string>) {
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
      fase_actual: mapEstadoToOrdenPhase(orden.estado_actual),
      sede_creador: orden.responsable ? sedesPorEmail[orden.responsable] || null : null
    };
}

// Helper para mapear status frontend a estados DB
function mapStatusToEstadosDB(status: string): string[] {
  switch(status) {
    case 'pendiente': return ['Recepción', 'Esperando aprobación', 'Esperando aceptación'];
    case 'en_proceso': return ['Diagnóstico', 'Cotización', 'Reparación'];
    case 'espera_repuestos': return ['Solicitud de repuestos', 'Esperando repuestos'];
    case 'completada': return ['Entrega', 'Finalizada'];
    case 'cancelada': return ['Cancelada'];
    default: return [];
  }
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
      ultima_actualizacion: crearTimestampColombia()
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
      ultima_actualizacion: crearTimestampColombia()
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
      precio_envio: cotizacion.precio_envio || 0,
      fecha_cotizacion: cotizacion.fecha_cotizacion || crearTimestampColombia(),
      tecnico_cotiza: cotizacion.tecnico_cotiza || null,
      ultima_actualizacion: crearTimestampColombia()
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
      ultima_actualizacion: crearTimestampColombia()
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
      fecha_inicio_reparacion: crearTimestampColombia(),
      ultima_actualizacion: crearTimestampColombia()
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
      fecha_finalizacion: crearTimestampColombia(),
      updated_at: crearTimestampColombia()
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
    fecha: crearTimestampColombia()
  };

  const { data, error } = await supabase
    .from("ordenes")
    .update({
      comentarios_retroceso: [...comentariosActuales, nuevoComentario],
      fase_actual: comentario.fase_destino,
      updated_at: crearTimestampColombia()
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

/**
 * Eliminar una orden por ID
 */
export async function eliminarOrden(ordenId: string) {
  const { error } = await supabase
    .from("ordenes")
    .delete()
    .eq("id", ordenId);

  if (error) {
    console.error("❌ Error al eliminar orden:", error);
    throw error;
  }

  console.log("✅ Orden eliminada:", ordenId);
  return true;
}
