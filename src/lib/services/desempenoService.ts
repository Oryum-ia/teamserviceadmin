import { supabase } from "@/lib/supabaseClient";

/**
 * Tipos para desempeño por fase
 */
export interface TiempoFase {
  fase: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  duracion_horas?: number;
  tecnico_id?: string;
  tecnico_nombre?: string;
}

export interface DesempenoTecnico {
  tecnico_id: string;
  tecnico_nombre: string;
  // Volumen
  total_ordenes: number;
  ordenes_completadas: number;
  ordenes_en_proceso: number;
  ordenes_pendientes: number; // sin avanzar
  // Tiempos (en horas)
  tiempo_promedio_diagnostico?: number;
  tiempo_promedio_reparacion?: number;
  tiempos_diagnostico: number[];
  tiempos_reparacion: number[];
  // Conteos por fase
  ordenes_diagnostico: number;
  ordenes_reparacion: number;
  // Productividad calculada
  ordenes_por_dia: number; // órdenes completadas / días activos
  tasa_completacion: number; // 0-100
  eficiencia_score: number; // 0-100
  // Fechas para calcular días activos
  primera_orden: string;
  ultima_orden: string;
  dias_activos: number;
  // Detalle de órdenes (para vista individual)
  ordenes_detalle: OrdenDetalleTecnico[];
}

export interface OrdenDetalleTecnico {
  id: string;
  codigo: string;
  estado_actual: string;
  fecha_creacion: string;
  cliente_nombre?: string;
  // Tiempos calculados en horas
  tiempo_diagnostico?: number;
  tiempo_reparacion?: number;
  // Rol del técnico en esta orden
  rol: ('diagnostico' | 'reparacion')[];
}

export interface OrdenConTiempos {
  id: string;
  codigo: string;
  cliente_nombre: string;
  estado_actual: string;
  fecha_creacion: string;
  fecha_inicio_diagnostico?: string;
  fecha_fin_diagnostico?: string;
  fecha_inicio_reparacion?: string;
  fecha_fin_reparacion?: string;
  fecha_entrega?: string;
  tecnico_diagnostico?: string;
  tecnico_repara?: string;
  tiempo_diagnostico?: number;
  tiempo_reparacion?: number;
  tiempo_total?: number;
}

/**
 * Calcula horas entre dos fechas. Retorna undefined si alguna falta.
 * Filtra valores negativos o mayores a 720h (30 días).
 */
function calcularHorasEntre(inicio?: string | null, fin?: string | null): number | undefined {
  if (!inicio || !fin) return undefined;
  const i = new Date(inicio);
  const f = new Date(fin);
  const horas = (f.getTime() - i.getTime()) / (1000 * 60 * 60);
  if (horas <= 0 || horas > 720) return undefined;
  return horas;
}

/**
 * Calcula días laborales entre dos fechas (excluyendo domingos).
 */
function calcularDiasActivos(primera: string, ultima: string): number {
  const inicio = new Date(primera);
  const fin = new Date(ultima);
  let dias = 0;
  const current = new Date(inicio);
  current.setHours(0, 0, 0, 0);
  fin.setHours(23, 59, 59, 999);
  
  while (current <= fin) {
    // Contar todos los días excepto domingos (0)
    if (current.getDay() !== 0) {
      dias++;
    }
    current.setDate(current.getDate() + 1);
  }
  return Math.max(dias, 1); // Mínimo 1 día
}

/**
 * Obtener desempeño detallado por técnico
 */
export async function obtenerDesempenoDetallado(
  fechaInicio?: string,
  fechaFin?: string
): Promise<DesempenoTecnico[]> {
  let query = supabase
    .from("ordenes")
    .select(`
      id,
      codigo,
      estado_actual,
      fecha_creacion,
      fecha_inicio_diagnostico,
      fecha_fin_diagnostico,
      fecha_inicio_reparacion,
      fecha_fin_reparacion,
      fecha_entrega,
      tecnico_diagnostico,
      tecnico_repara,
      usuario_diagnostico:usuarios!ordenes_tecnico_diagnostico_fkey(id, nombre, rol),
      usuario_repara:usuarios!ordenes_tecnico_repara_fkey(id, nombre, rol),
      cliente:clientes(razon_social, nombre_comercial)
    `)
    .order("fecha_creacion", { ascending: false });

  if (fechaInicio) {
    query = query.gte("fecha_creacion", fechaInicio);
  }
  if (fechaFin) {
    query = query.lte("fecha_creacion", fechaFin);
  }

  const { data: ordenes, error } = await query;

  if (error) {
    console.error("❌ Error al obtener órdenes para desempeño:", error);
    throw error;
  }

  // Mapa para agrupar por técnico
  const tecnicosMap = new Map<string, {
    nombre: string;
    ordenes: Map<string, { orden: any; roles: Set<string> }>;
    tiempos_diagnostico: number[];
    tiempos_reparacion: number[];
    ordenes_diagnostico: number;
    ordenes_reparacion: number;
  }>();

  const ensureTecnico = (id: string, nombre: string) => {
    if (!tecnicosMap.has(id)) {
      tecnicosMap.set(id, {
        nombre,
        ordenes: new Map(),
        tiempos_diagnostico: [],
        tiempos_reparacion: [],
        ordenes_diagnostico: 0,
        ordenes_reparacion: 0
      });
    }
    return tecnicosMap.get(id)!;
  };

  ordenes?.forEach((orden: any) => {
    const clienteNombre = orden.cliente?.razon_social || orden.cliente?.nombre_comercial || 'Sin cliente';

    // Procesar técnico de diagnóstico
    if (orden.tecnico_diagnostico && orden.usuario_diagnostico?.rol === 'tecnico') {
      const tecnico = ensureTecnico(orden.tecnico_diagnostico, orden.usuario_diagnostico.nombre);
      
      if (!tecnico.ordenes.has(orden.id)) {
        tecnico.ordenes.set(orden.id, { orden, roles: new Set() });
      }
      tecnico.ordenes.get(orden.id)!.roles.add('diagnostico');

      const tiempoDiag = calcularHorasEntre(orden.fecha_inicio_diagnostico, orden.fecha_fin_diagnostico);
      if (tiempoDiag !== undefined) {
        tecnico.tiempos_diagnostico.push(tiempoDiag);
        tecnico.ordenes_diagnostico++;
      }
    }

    // Procesar técnico de reparación
    if (orden.tecnico_repara && orden.usuario_repara?.rol === 'tecnico') {
      const tecnico = ensureTecnico(orden.tecnico_repara, orden.usuario_repara.nombre);
      
      if (!tecnico.ordenes.has(orden.id)) {
        tecnico.ordenes.set(orden.id, { orden, roles: new Set() });
      }
      tecnico.ordenes.get(orden.id)!.roles.add('reparacion');

      const tiempoRep = calcularHorasEntre(orden.fecha_inicio_reparacion, orden.fecha_fin_reparacion);
      if (tiempoRep !== undefined) {
        tecnico.tiempos_reparacion.push(tiempoRep);
        tecnico.ordenes_reparacion++;
      }
    }
  });

  // Convertir a array y calcular métricas
  return Array.from(tecnicosMap.entries()).map(([tecnico_id, data]) => {
    const ordenesArr = Array.from(data.ordenes.values());
    
    const ordenes_completadas = ordenesArr.filter(({ orden }) => {
      const estado = orden.estado_actual?.toLowerCase() || '';
      return estado.includes('finalizada') || estado.includes('completada') || 
             estado.includes('entregada') || estado.includes('entrega');
    }).length;

    const ordenes_en_proceso = ordenesArr.filter(({ orden }) => {
      const estado = orden.estado_actual?.toLowerCase() || '';
      return estado.includes('proceso') || estado.includes('diagnóstico') || 
             estado.includes('diagnostico') || estado.includes('reparación') || 
             estado.includes('reparacion') || estado.includes('cotización') || 
             estado.includes('cotizacion');
    }).length;

    const ordenes_pendientes = ordenesArr.filter(({ orden }) => {
      const estado = orden.estado_actual?.toLowerCase() || '';
      return estado.includes('pendiente') || estado.includes('esperando');
    }).length;

    // Tiempos promedio
    const tiempo_promedio_diagnostico = data.tiempos_diagnostico.length > 0
      ? data.tiempos_diagnostico.reduce((a, b) => a + b, 0) / data.tiempos_diagnostico.length
      : undefined;

    const tiempo_promedio_reparacion = data.tiempos_reparacion.length > 0
      ? data.tiempos_reparacion.reduce((a, b) => a + b, 0) / data.tiempos_reparacion.length
      : undefined;

    // Calcular días activos y órdenes por día
    const fechas = ordenesArr.map(({ orden }) => orden.fecha_creacion).sort();
    const primera_orden = fechas[0] || '';
    const ultima_orden = fechas[fechas.length - 1] || '';
    const dias_activos = primera_orden && ultima_orden 
      ? calcularDiasActivos(primera_orden, ultima_orden) 
      : 1;
    
    const total_ordenes = ordenesArr.length;
    const ordenes_por_dia = total_ordenes / dias_activos;
    const tasa_completacion = total_ordenes > 0 
      ? (ordenes_completadas / total_ordenes) * 100 
      : 0;

    // Score de eficiencia: pondera completación, velocidad y volumen
    const factor_completacion = tasa_completacion;
    
    // Penalizar tiempos largos de diagnóstico (ideal < 2h)
    const factor_vel_diag = tiempo_promedio_diagnostico !== undefined
      ? Math.max(0, 100 - Math.max(0, (tiempo_promedio_diagnostico - 2) * 15))
      : 50;

    // Penalizar tiempos largos de reparación (ideal < 1h)
    const factor_vel_rep = tiempo_promedio_reparacion !== undefined
      ? Math.max(0, 100 - Math.max(0, (tiempo_promedio_reparacion - 1) * 20))
      : 50;

    // Bonus por volumen (más órdenes por día = mejor)
    const factor_volumen = Math.min(100, ordenes_por_dia * 50);

    const eficiencia_score = Math.round(
      factor_completacion * 0.35 + 
      factor_vel_diag * 0.2 + 
      factor_vel_rep * 0.2 + 
      factor_volumen * 0.25
    );

    // Detalle de órdenes para vista individual
    const ordenes_detalle: OrdenDetalleTecnico[] = ordenesArr.map(({ orden, roles }) => ({
      id: orden.id,
      codigo: orden.codigo || 'Sin código',
      estado_actual: orden.estado_actual || 'Sin estado',
      fecha_creacion: orden.fecha_creacion,
      cliente_nombre: orden.cliente?.razon_social || orden.cliente?.nombre_comercial || 'Sin cliente',
      tiempo_diagnostico: calcularHorasEntre(orden.fecha_inicio_diagnostico, orden.fecha_fin_diagnostico),
      tiempo_reparacion: calcularHorasEntre(orden.fecha_inicio_reparacion, orden.fecha_fin_reparacion),
      rol: Array.from(roles) as ('diagnostico' | 'reparacion')[]
    })).sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());

    return {
      tecnico_id,
      tecnico_nombre: data.nombre,
      total_ordenes,
      ordenes_completadas,
      ordenes_en_proceso,
      ordenes_pendientes,
      tiempo_promedio_diagnostico,
      tiempo_promedio_reparacion,
      tiempos_diagnostico: data.tiempos_diagnostico,
      tiempos_reparacion: data.tiempos_reparacion,
      ordenes_diagnostico: data.ordenes_diagnostico,
      ordenes_reparacion: data.ordenes_reparacion,
      ordenes_por_dia: parseFloat(ordenes_por_dia.toFixed(2)),
      tasa_completacion: Math.round(tasa_completacion),
      eficiencia_score: Math.min(100, Math.max(0, eficiencia_score)),
      primera_orden,
      ultima_orden,
      dias_activos,
      ordenes_detalle
    };
  }).sort((a, b) => b.eficiencia_score - a.eficiencia_score);
}

/**
 * Obtener órdenes con tiempos calculados por fase
 */
export async function obtenerOrdenesConTiempos(
  tecnicoId?: string,
  fechaInicio?: string,
  fechaFin?: string
): Promise<OrdenConTiempos[]> {
  let query = supabase
    .from("ordenes")
    .select(`
      id,
      codigo,
      estado_actual,
      fecha_creacion,
      fecha_inicio_diagnostico,
      fecha_fin_diagnostico,
      fecha_inicio_reparacion,
      fecha_fin_reparacion,
      fecha_entrega,
      tecnico_diagnostico,
      tecnico_repara,
      cliente:clientes(razon_social, nombre_comercial)
    `)
    .order("fecha_creacion", { ascending: false });

  if (tecnicoId) {
    query = query.or(`tecnico_diagnostico.eq.${tecnicoId},tecnico_repara.eq.${tecnicoId}`);
  }
  if (fechaInicio) {
    query = query.gte("fecha_creacion", fechaInicio);
  }
  if (fechaFin) {
    query = query.lte("fecha_creacion", fechaFin);
  }

  const { data: ordenes, error } = await query;

  if (error) {
    console.error("❌ Error al obtener órdenes con tiempos:", error);
    throw error;
  }

  return (ordenes || []).map((orden: any) => {
    const tiempo_diagnostico = calcularHorasEntre(orden.fecha_inicio_diagnostico, orden.fecha_fin_diagnostico);
    const tiempo_reparacion = calcularHorasEntre(orden.fecha_inicio_reparacion, orden.fecha_fin_reparacion);
    const tiempo_total = calcularHorasEntre(orden.fecha_creacion, orden.fecha_entrega);

    return {
      id: orden.id,
      codigo: orden.codigo || 'Sin código',
      cliente_nombre: orden.cliente?.razon_social || orden.cliente?.nombre_comercial || 'Sin cliente',
      estado_actual: orden.estado_actual || 'Sin estado',
      fecha_creacion: orden.fecha_creacion,
      fecha_inicio_diagnostico: orden.fecha_inicio_diagnostico,
      fecha_fin_diagnostico: orden.fecha_fin_diagnostico,
      fecha_inicio_reparacion: orden.fecha_inicio_reparacion,
      fecha_fin_reparacion: orden.fecha_fin_reparacion,
      fecha_entrega: orden.fecha_entrega,
      tecnico_diagnostico: orden.tecnico_diagnostico,
      tecnico_repara: orden.tecnico_repara,
      tiempo_diagnostico,
      tiempo_reparacion,
      tiempo_total
    };
  });
}

/**
 * Obtener resumen de rendimiento del equipo
 */
export async function obtenerResumenEquipo(fechaInicio?: string, fechaFin?: string) {
  const desempeno = await obtenerDesempenoDetallado(fechaInicio, fechaFin);

  const total_tecnicos = desempeno.length;
  const total_ordenes = desempeno.reduce((acc, t) => acc + t.total_ordenes, 0);
  const total_completadas = desempeno.reduce((acc, t) => acc + t.ordenes_completadas, 0);

  const tiempos_diagnostico = desempeno.flatMap(t => t.tiempos_diagnostico);
  const tiempos_reparacion = desempeno.flatMap(t => t.tiempos_reparacion);

  const promedio_diagnostico = tiempos_diagnostico.length > 0
    ? tiempos_diagnostico.reduce((a, b) => a + b, 0) / tiempos_diagnostico.length
    : 0;

  const promedio_reparacion = tiempos_reparacion.length > 0
    ? tiempos_reparacion.reduce((a, b) => a + b, 0) / tiempos_reparacion.length
    : 0;

  const eficiencia_promedio = desempeno.length > 0
    ? desempeno.reduce((acc, t) => acc + t.eficiencia_score, 0) / desempeno.length
    : 0;

  const ordenes_por_dia_promedio = desempeno.length > 0
    ? desempeno.reduce((acc, t) => acc + t.ordenes_por_dia, 0) / desempeno.length
    : 0;

  return {
    total_tecnicos,
    total_ordenes,
    total_completadas,
    tasa_completacion: total_ordenes > 0 ? (total_completadas / total_ordenes) * 100 : 0,
    promedio_diagnostico_horas: promedio_diagnostico,
    promedio_reparacion_horas: promedio_reparacion,
    eficiencia_promedio: Math.round(eficiencia_promedio),
    ordenes_por_dia_promedio: parseFloat(ordenes_por_dia_promedio.toFixed(2))
  };
}
