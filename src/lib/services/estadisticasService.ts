import { supabase } from "@/lib/supabaseClient";
import { EstadisticasGlobales, DesempenoEmpleado, DesempenoSede, OrdenStatus, OrdenPhase } from "@/types/database.types";

/**
 * Obtener estadísticas globales de la empresa con filtros opcionales
 */
export async function obtenerEstadisticasGlobales(filtros?: {
  sede?: string;
  mes?: string; // Formato: YYYY-MM
  anio?: number;
}): Promise<EstadisticasGlobales> {
  // Iniciar query base
  let query = supabase
    .from("ordenes")
    .select("estado_actual, total, fecha_creacion, sede");

  // Aplicar filtros
  if (filtros?.sede && filtros.sede !== 'todas') {
    // Normalizar la sede del filtro
    const sedeNormalizada = normalizarSedeParaFiltro(filtros.sede);
    
    // Obtener todas las órdenes y filtrar en memoria por sede normalizada
    const { data: todasOrdenes, error } = await query;
    
    if (error) {
      console.error("❌ Error al obtener estadísticas:", error);
      throw error;
    }
    
    // Filtrar por sede normalizada
    const ordenesFiltradas = todasOrdenes?.filter(orden => {
      if (!orden.sede) return false;
      const sedeOrdenNormalizada = normalizarSedeParaFiltro(orden.sede);
      return sedeOrdenNormalizada === sedeNormalizada;
    });
    
    // Continuar con las órdenes filtradas
    return calcularEstadisticas(ordenesFiltradas || [], filtros);
  }

  // Si no hay filtro de sede, aplicar filtros de fecha directamente
  if (filtros?.mes) {
    // Filtrar por mes específico (YYYY-MM)
    const [anio, mes] = filtros.mes.split('-');
    const inicioMes = new Date(parseInt(anio), parseInt(mes) - 1, 1);
    const finMes = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59);
    
    query = query
      .gte('fecha_creacion', inicioMes.toISOString())
      .lte('fecha_creacion', finMes.toISOString());
  } else if (filtros?.anio) {
    // Filtrar por año
    const inicioAnio = new Date(filtros.anio, 0, 1);
    const finAnio = new Date(filtros.anio, 11, 31, 23, 59, 59);
    
    query = query
      .gte('fecha_creacion', inicioAnio.toISOString())
      .lte('fecha_creacion', finAnio.toISOString());
  }

  const { data: ordenes, error } = await query;

  if (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    throw error;
  }

  return calcularEstadisticas(ordenes || [], filtros);
}

/**
 * Función auxiliar para calcular estadísticas desde un array de órdenes
 */
function calcularEstadisticas(ordenes: any[], filtros?: any): EstadisticasGlobales {
  // Calcular estadísticas
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Si hay filtro de mes, usar ese mes como referencia
  let mesReferencia = startOfMonth;
  if (filtros?.mes) {
    const [anio, mes] = filtros.mes.split('-');
    mesReferencia = new Date(parseInt(anio), parseInt(mes) - 1, 1);
  }

  const ordenesPorEstado: Record<OrdenStatus, number> = {
    pendiente: 0,
    en_proceso: 0,
    espera_repuestos: 0,
    completada: 0,
    cancelada: 0
  };

  // Contar manualmente por fase
  const conteoRecepcion = ordenes?.filter(o => 
    o.estado_actual?.toLowerCase().includes('recepción') || 
    o.estado_actual?.toLowerCase().includes('recepcion')
  ).length || 0;

  const conteoDiagnostico = ordenes?.filter(o => 
    o.estado_actual?.toLowerCase().includes('diagnóstico') || 
    o.estado_actual?.toLowerCase().includes('diagnostico')
  ).length || 0;

  // Cotización incluye "Cotización" y "Esperando aceptación"
  const conteoCotizacion = ordenes?.filter(o => 
    o.estado_actual?.toLowerCase().includes('cotización') || 
    o.estado_actual?.toLowerCase().includes('cotizacion') ||
    o.estado_actual?.toLowerCase().includes('esperando aceptación') ||
    o.estado_actual?.toLowerCase().includes('esperando aceptacion')
  ).length || 0;

  const conteoReparacion = ordenes?.filter(o => 
    o.estado_actual?.toLowerCase().includes('reparación') || 
    o.estado_actual?.toLowerCase().includes('reparacion')
  ).length || 0;

  const conteoEntrega = ordenes?.filter(o => 
    o.estado_actual?.toLowerCase() === 'entrega'
  ).length || 0;

  const conteoFinalizada = ordenes?.filter(o => 
    o.estado_actual?.toLowerCase().includes('finalizada') ||
    o.estado_actual?.toLowerCase().includes('entregada')
  ).length || 0;

  const ordenesPorFase: Record<string, number> = {
    'Recepción': conteoRecepcion,
    'Diagnóstico': conteoDiagnostico,
    'Cotización': conteoCotizacion,
    'Reparación': conteoReparacion,
    'Entrega': conteoEntrega,
    'Finalizada': conteoFinalizada
  };

  let ingresos_totales = 0;
  let ingresos_mes_actual = 0;
  let ordenes_dia = 0;
  let ordenes_semana = 0;
  let ordenes_mes = 0;

  ordenes?.forEach(orden => {
    const estadoNormalizado = orden.estado_actual?.toLowerCase() || '';

    // Mapear estado_actual a OrdenStatus
    let estadoKey: OrdenStatus;

    if (estadoNormalizado.includes('finalizada') || estadoNormalizado.includes('completada') || estadoNormalizado.includes('entregada')) {
      estadoKey = 'completada';
    } else if (estadoNormalizado.includes('cancelada') || estadoNormalizado.includes('anulada')) {
      estadoKey = 'cancelada';
    } else if (estadoNormalizado.includes('repuesto') || estadoNormalizado.includes('esperando') || estadoNormalizado.includes('espera')) {
      estadoKey = 'espera_repuestos';
    } else if (estadoNormalizado.includes('pendiente')) {
      estadoKey = 'pendiente';
    } else {
      estadoKey = 'en_proceso';
    }

    if (ordenesPorEstado[estadoKey] !== undefined) {
      ordenesPorEstado[estadoKey]++;
    }

    // Calcular ingresos
    const total = orden.total || 0;
    ingresos_totales += total;

    const fechaCreacion = new Date(orden.fecha_creacion);
    
    // Si hay filtro de mes, todos los ingresos son del "mes actual" (el mes filtrado)
    // Si no hay filtro, usar la lógica normal
    if (filtros?.mes) {
      // Cuando hay filtro de mes, todos los ingresos son del mes filtrado
      ingresos_mes_actual += total;
    } else {
      // Sin filtro, solo contar ingresos del mes actual del sistema
      if (fechaCreacion >= mesReferencia) {
        ingresos_mes_actual += total;
      }
    }

    // Contar órdenes por período (solo si no hay filtro de mes)
    if (!filtros?.mes) {
      if (fechaCreacion >= startOfDay) {
        ordenes_dia++;
      }
      if (fechaCreacion >= startOfWeek) {
        ordenes_semana++;
      }
      if (fechaCreacion >= startOfMonth) {
        ordenes_mes++;
      }
    } else {
      // Si hay filtro de mes, todas las órdenes son del "mes actual"
      ordenes_mes = ordenes.length;
      // No tiene sentido mostrar "hoy" o "esta semana" cuando hay filtro de mes
      ordenes_dia = 0;
      ordenes_semana = 0;
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
    const estadoNormalizado = orden.estado_actual?.toLowerCase() || '';

    // Aplicar la misma lógica: solo completadas o entregadas cuentan como completadas
    if (estadoNormalizado.includes('finalizada') || estadoNormalizado.includes('completada') || estadoNormalizado.includes('entregada')) {
      empleado.ordenes_completadas++;

      // Calcular tiempo de reparación en días
      if (orden.fecha_entrega) {
        const inicio = new Date(orden.fecha_creacion);
        const fin = new Date(orden.fecha_entrega);
        const dias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
        empleado.tiempos_reparacion.push(dias);
      }
    } else if (!estadoNormalizado.includes('cancelada') && !estadoNormalizado.includes('anulada')) {
      // Todas las órdenes que no estén canceladas se consideran "en proceso"
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

    const estadoNormalizado = orden.estado_actual?.toLowerCase() || '';

    // Aplicar la misma lógica: solo completadas o entregadas cuentan como completadas
    if (estadoNormalizado.includes('finalizada') || estadoNormalizado.includes('completada') || estadoNormalizado.includes('entregada')) {
      sedeData.ordenes_completadas++;
      sedeData.ingresos_totales += orden.total || 0;
    } else if (!estadoNormalizado.includes('cancelada') && !estadoNormalizado.includes('anulada')) {
      // Todas las órdenes que no estén canceladas se consideran "en proceso"
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
 * Obtener estadísticas para el dashboard (resumen) con filtros opcionales
 */
export async function obtenerEstadisticasDashboard(filtros?: {
  sede?: string;
  mes?: string;
  anio?: number;
}) {
  const estadisticasGlobales = await obtenerEstadisticasGlobales(filtros);

  // Construir query para órdenes recientes
  let query = supabase
    .from("ordenes")
    .select(`
      id,
      codigo,
      estado_actual,
      tipo_orden,
      fecha_creacion,
      cliente_id,
      sede,
      clientes (
        identificacion,
        razon_social,
        nombre_comercial
      )
    `);

  // Aplicar filtros de fecha
  if (filtros?.mes) {
    const [anio, mes] = filtros.mes.split('-');
    const inicioMes = new Date(parseInt(anio), parseInt(mes) - 1, 1);
    const finMes = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59);
    
    query = query
      .gte('fecha_creacion', inicioMes.toISOString())
      .lte('fecha_creacion', finMes.toISOString());
  } else if (filtros?.anio) {
    const inicioAnio = new Date(filtros.anio, 0, 1);
    const finAnio = new Date(filtros.anio, 11, 31, 23, 59, 59);
    
    query = query
      .gte('fecha_creacion', inicioAnio.toISOString())
      .lte('fecha_creacion', finAnio.toISOString());
  }

  const { data: ordenesRecientes, error: errorRecientes } = await query
    .order("fecha_creacion", { ascending: false })
    .limit(50); // Obtener más para filtrar por sede

  if (errorRecientes) {
    console.error("❌ Error al obtener órdenes recientes:", errorRecientes);
  }

  // Filtrar por sede normalizada si es necesario
  let ordenesFiltradas = ordenesRecientes || [];
  if (filtros?.sede && filtros.sede !== 'todas') {
    const sedeNormalizada = normalizarSedeParaFiltro(filtros.sede);
    ordenesFiltradas = ordenesFiltradas.filter(orden => {
      if (!orden.sede) return false;
      const sedeOrdenNormalizada = normalizarSedeParaFiltro(orden.sede);
      return sedeOrdenNormalizada === sedeNormalizada;
    });
  }

  // Limitar a 10 después del filtrado
  ordenesFiltradas = ordenesFiltradas.slice(0, 10);

  // Mapear órdenes con formato consistente
  const ordenesMapeadas = ordenesFiltradas.map(orden => {
    const estadoActual = orden.estado_actual || 'Sin estado';
    let fase = 'Sin fase';
    
    // Determinar fase basada en el contenido del estado_actual
    if (estadoActual.toLowerCase().includes('recepción') || estadoActual.toLowerCase().includes('recepcion')) {
      fase = 'Recepción';
    } else if (estadoActual.toLowerCase().includes('diagnóstico') || estadoActual.toLowerCase().includes('diagnostico')) {
      fase = 'Diagnóstico';
    } else if (estadoActual.toLowerCase().includes('cotización') || estadoActual.toLowerCase().includes('cotizacion')) {
      fase = 'Cotización';
    } else if (estadoActual.toLowerCase().includes('reparación') || estadoActual.toLowerCase().includes('reparacion')) {
      fase = 'Reparación';
    } else if (estadoActual.toLowerCase() === 'entrega') {
      fase = 'Entrega';
    } else if (estadoActual.toLowerCase().includes('finalizada') || estadoActual.toLowerCase().includes('entregada')) {
      fase = 'Finalizada';
    }

    return {
      id: orden.id,
      numero_orden: orden.codigo || 'Sin código',
      estado: estadoActual,
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

/**
 * Obtener lista de sedes únicas normalizadas
 */
export async function obtenerSedes(): Promise<string[]> {
  const { data, error } = await supabase
    .from("ordenes")
    .select("sede")
    .not('sede', 'is', null);

  if (error) {
    console.error("❌ Error al obtener sedes:", error);
    return [];
  }

  // Normalizar sedes (quitar tildes, espacios extras, convertir a capitalizado)
  const normalizarSede = (sede: string): string => {
    return sede
      .trim() // Quitar espacios al inicio y final
      .toLowerCase() // Convertir a minúsculas
      .normalize('NFD') // Descomponer caracteres con tildes
      .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .split(' ') // Separar por espacios
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizar cada palabra
      .join(' '); // Unir de nuevo
  };

  // Obtener sedes únicas normalizadas
  const sedesNormalizadas = new Map<string, string>();
  
  data.forEach(item => {
    if (item.sede) {
      const sedeNormalizada = normalizarSede(item.sede);
      // Guardar la primera versión encontrada de cada sede normalizada
      if (!sedesNormalizadas.has(sedeNormalizada)) {
        sedesNormalizadas.set(sedeNormalizada, sedeNormalizada);
      }
    }
  });

  return Array.from(sedesNormalizadas.values()).sort();
}

/**
 * Normalizar nombre de sede para comparaciones
 */
export function normalizarSedeParaFiltro(sede: string): string {
  return sede
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
