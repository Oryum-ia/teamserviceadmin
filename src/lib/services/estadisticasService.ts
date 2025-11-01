import { supabase } from "@/lib/supabaseClient";
import { EstadisticasGlobales, DesempenoEmpleado, DesempenoSede, OrdenStatus, OrdenPhase } from "@/types/database.types";

/**
 * Obtener estadísticas globales de la empresa
 */
export async function obtenerEstadisticasGlobales(): Promise<EstadisticasGlobales> {
  // Obtener todas las órdenes
  const { data: ordenes, error } = await supabase
    .from("ordenes")
    .select("estado_actual, total, fecha_creacion");

  if (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    throw error;
  }

  // Calcular estadísticas
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const ordenesPorEstado: Record<OrdenStatus, number> = {
    pendiente: 0,
    en_proceso: 0,
    espera_repuestos: 0,
    completada: 0,
    cancelada: 0
  };

  const ordenesPorFase: Record<string, number> = {
    'Recepción': 0,
    'Diagnóstico': 0,
    'Cotización': 0,
    'Reparación': 0,
    'Entrega': 0,
    'Finalizada': 0
  };

  let ingresos_totales = 0;
  let ingresos_mes_actual = 0;
  let ordenes_dia = 0;
  let ordenes_semana = 0;
  let ordenes_mes = 0;

  ordenes?.forEach(orden => {
    const estadoNormalizado = orden.estado_actual?.toLowerCase() || '';
    
    // Mapear estado_actual a OrdenStatus
    let estadoKey: OrdenStatus | null = null;
    
    if (estadoNormalizado.includes('pendiente')) {
      estadoKey = 'pendiente';
    } else if (estadoNormalizado.includes('proceso') || 
               estadoNormalizado.includes('diagnóstico') || 
               estadoNormalizado.includes('diagnostico') || 
               estadoNormalizado.includes('reparación') || 
               estadoNormalizado.includes('reparacion') ||
               estadoNormalizado.includes('cotización') ||
               estadoNormalizado.includes('cotizacion') ||
               estadoNormalizado.includes('aprobación') ||
               estadoNormalizado.includes('recepción') ||
               estadoNormalizado.includes('recepcion')) {
      estadoKey = 'en_proceso';
    } else if (estadoNormalizado.includes('repuesto') || estadoNormalizado.includes('esperando') || estadoNormalizado.includes('espera')) {
      estadoKey = 'espera_repuestos';
    } else if (estadoNormalizado.includes('finalizada')) {
      estadoKey = 'completada';
    } else if (estadoNormalizado.includes('cancelada') || estadoNormalizado.includes('anulada')) {
      estadoKey = 'cancelada';
    }
    
    if (estadoKey && ordenesPorEstado[estadoKey] !== undefined) {
      ordenesPorEstado[estadoKey]++;
    }

    // Mapear estado_actual a fase correspondiente (basado en el estado real)
    let faseNombre: string | null = null;
    
    if (estadoNormalizado.includes('recepción') || estadoNormalizado.includes('recepcion')) {
      faseNombre = 'Recepción';
    } else if (estadoNormalizado.includes('diagnóstico') || estadoNormalizado.includes('diagnostico')) {
      faseNombre = 'Diagnóstico';
    } else if (estadoNormalizado.includes('cotización') || estadoNormalizado.includes('cotizacion') || 
               estadoNormalizado.includes('aprobación') || estadoNormalizado.includes('aprobacion')) {
      faseNombre = 'Cotización';
    } else if (estadoNormalizado.includes('reparación') || estadoNormalizado.includes('reparacion') || 
               estadoNormalizado.includes('repuesto')) {
      faseNombre = 'Reparación';
    } else if (estadoNormalizado.includes('entrega') && !estadoNormalizado.includes('finalizada')) {
      faseNombre = 'Entrega';
    } else if (estadoNormalizado.includes('finalizada')) {
      faseNombre = 'Finalizada';
    }
    
    if (faseNombre && ordenesPorFase[faseNombre] !== undefined) {
      ordenesPorFase[faseNombre]++;
    }

    // Calcular ingresos
    const total = orden.total || 0;
    ingresos_totales += total;

    const fechaCreacion = new Date(orden.fecha_creacion);
    if (fechaCreacion >= startOfMonth) {
      ingresos_mes_actual += total;
    }

    // Contar órdenes por período
    if (fechaCreacion >= startOfDay) {
      ordenes_dia++;
    }
    if (fechaCreacion >= startOfWeek) {
      ordenes_semana++;
    }
    if (fechaCreacion >= startOfMonth) {
      ordenes_mes++;
    }
  });

  return {
    total_ordenes: ordenes?.length || 0,
    ordenes_por_estado: ordenesPorEstado,
    ordenes_por_fase: ordenesPorFase,
    ingresos_totales,
    ingresos_mes_actual,
    ordenes_dia,
    ordenes_semana,
    ordenes_mes
  };
}

/**
 * Obtener desempeño individual por empleado
 */
export async function obtenerDesempenoEmpleado(usuarioId?: string): Promise<DesempenoEmpleado[]> {
  let query = supabase
    .from("ordenes")
    .select(`
      tecnico_diagnostico,
      tecnico_repara,
      estado_actual,
      fecha_creacion,
      fecha_entrega
    `);

  if (usuarioId) {
    // Filtrar por usuario específico
    query = query.or(`tecnico_diagnostico.eq.${usuarioId},tecnico_repara.eq.${usuarioId}`);
  }

  const { data: ordenes, error } = await query;

  if (error) {
    console.error("❌ Error al obtener desempeño de empleados:", error);
    throw error;
  }

  // Agrupar órdenes por técnico
  const empleadosMap = new Map<string, {
    nombre: string;
    ordenes_completadas: number;
    ordenes_en_proceso: number;
    tiempos_reparacion: number[];
  }>();

  ordenes?.forEach(orden => {
    const tecnicoId = orden.tecnico_repara || orden.tecnico_diagnostico;
    if (!tecnicoId) return;

    if (!empleadosMap.has(tecnicoId)) {
      empleadosMap.set(tecnicoId, {
        nombre: '', // Se llenará después con datos del usuario
        ordenes_completadas: 0,
        ordenes_en_proceso: 0,
        tiempos_reparacion: []
      });
    }

    const empleado = empleadosMap.get(tecnicoId)!;

    if (orden.estado_actual === 'completada' || orden.estado_actual === 'Completada') {
      empleado.ordenes_completadas++;

      // Calcular tiempo de reparación en días
      if (orden.fecha_entrega) {
        const inicio = new Date(orden.fecha_creacion);
        const fin = new Date(orden.fecha_entrega);
        const dias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
        empleado.tiempos_reparacion.push(dias);
      }
    } else if (orden.estado_actual?.toLowerCase().includes('proceso')) {
      empleado.ordenes_en_proceso++;
    }
  });

  // Obtener nombres de los empleados
  const empleadoIds = Array.from(empleadosMap.keys());
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre")
    .in("id", empleadoIds);

  usuarios?.forEach(usuario => {
    const empleado = empleadosMap.get(usuario.id);
    if (empleado) {
      empleado.nombre = usuario.nombre;
    }
  });

  // Convertir a array y calcular promedios
  return Array.from(empleadosMap.entries()).map(([usuario_id, data]) => ({
    usuario_id,
    nombre: data.nombre || 'Desconocido',
    ordenes_completadas: data.ordenes_completadas,
    ordenes_en_proceso: data.ordenes_en_proceso,
    tiempo_promedio_reparacion: data.tiempos_reparacion.length > 0
      ? data.tiempos_reparacion.reduce((a, b) => a + b, 0) / data.tiempos_reparacion.length
      : 0
  }));
}

/**
 * Obtener desempeño por sede
 */
export async function obtenerDesempenoSede(sede?: string): Promise<DesempenoSede[]> {
  // Obtener todos los usuarios
  let queryUsuarios = supabase.from("usuarios").select("id, sede, activo");

  if (sede) {
    queryUsuarios = queryUsuarios.eq("sede", sede);
  }

  const { data: usuarios, error: errorUsuarios } = await queryUsuarios;

  if (errorUsuarios) {
    console.error("❌ Error al obtener usuarios:", errorUsuarios);
    throw errorUsuarios;
  }

  // Agrupar por sede
  const sedesMap = new Map<string, {
    ordenes_completadas: number;
    ordenes_en_proceso: number;
    ingresos_totales: number;
    empleados_activos: number;
  }>();

  usuarios?.forEach(usuario => {
    const sedeUsuario = usuario.sede || 'Sin sede';
    if (!sedesMap.has(sedeUsuario)) {
      sedesMap.set(sedeUsuario, {
        ordenes_completadas: 0,
        ordenes_en_proceso: 0,
        ingresos_totales: 0,
        empleados_activos: 0
      });
    }

    if (usuario.activo) {
      sedesMap.get(sedeUsuario)!.empleados_activos++;
    }
  });

  // Obtener órdenes por técnico de cada sede
  const usuarioIds = usuarios?.map(u => u.id) || [];

  const { data: ordenes, error: errorOrdenes } = await supabase
    .from("ordenes")
    .select("tecnico_diagnostico, tecnico_repara, estado_actual, total");

  if (errorOrdenes) {
    console.error("❌ Error al obtener órdenes:", errorOrdenes);
    throw errorOrdenes;
  }

  ordenes?.forEach(orden => {
    const tecnicoId = orden.tecnico_repara || orden.tecnico_diagnostico;
    if (!tecnicoId) return;

    const usuario = usuarios?.find(u => u.id === tecnicoId);
    if (!usuario) return;

    const sedeUsuario = usuario.sede || 'Sin sede';
    const sedeData = sedesMap.get(sedeUsuario);
    if (!sedeData) return;

    if (orden.estado_actual === 'completada' || orden.estado_actual === 'Completada') {
      sedeData.ordenes_completadas++;
      sedeData.ingresos_totales += orden.total || 0;
    } else if (orden.estado_actual?.toLowerCase().includes('proceso')) {
      sedeData.ordenes_en_proceso++;
    }
  });

  // Convertir a array
  return Array.from(sedesMap.entries()).map(([sede, data]) => ({
    sede,
    ...data
  }));
}

/**
 * Obtener estadísticas para el dashboard (resumen)
 */
export async function obtenerEstadisticasDashboard() {
  const estadisticasGlobales = await obtenerEstadisticasGlobales();

  // Obtener órdenes recientes con datos del cliente
  const { data: ordenesRecientes, error: errorRecientes } = await supabase
    .from("ordenes")
    .select(`
      id,
      codigo,
      estado_actual,
      tipo_orden,
      fecha_creacion,
      cliente_id,
      clientes (
        identificacion,
        razon_social,
        nombre_comercial
      )
    `)
    .order("fecha_creacion", { ascending: false })
    .limit(10);

  if (errorRecientes) {
    console.error("❌ Error al obtener órdenes recientes:", errorRecientes);
  }

  // Mapear órdenes con formato consistente
  const ordenesMapeadas = (ordenesRecientes || []).map(orden => {
    const estadoNormalizado = orden.estado_actual?.toLowerCase() || '';
    let fase = 'Sin fase';
    
    if (estadoNormalizado.includes('recepción') || estadoNormalizado.includes('recepcion') || estadoNormalizado === 'recibida') {
      fase = 'Recepción';
    } else if (estadoNormalizado.includes('diagnóstico') || estadoNormalizado.includes('diagnostico')) {
      fase = 'Diagnóstico';
    } else if (estadoNormalizado.includes('cotización') || estadoNormalizado.includes('cotizacion') || estadoNormalizado.includes('aprobación')) {
      fase = 'Cotización';
    } else if (estadoNormalizado.includes('reparación') || estadoNormalizado.includes('reparacion') || estadoNormalizado.includes('repuesto')) {
      fase = 'Reparación';
    } else if (estadoNormalizado.includes('finalizada') || estadoNormalizado.includes('completada') || estadoNormalizado.includes('entregada')) {
      fase = 'Finalizada';
    }

    return {
      id: orden.id,
      numero_orden: orden.codigo || 'Sin código',
      estado: orden.estado_actual || 'Sin estado',
      fase_actual: fase,
      created_at: orden.fecha_creacion,
      cliente: orden.clientes || null
    };
  });

  return {
    estadisticas: estadisticasGlobales,
    ordenes_recientes: ordenesMapeadas
  };
}
