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
  total_ordenes: number;
  ordenes_completadas: number;
  ordenes_en_proceso: number;
  tiempo_promedio_cotizacion?: number; // en horas
  tiempo_promedio_reparacion?: number; // en horas
  tiempos_cotizacion: number[];
  tiempos_reparacion: number[];
  eficiencia_score: number; // 0-100
}

export interface OrdenConTiempos {
  id: string;
  codigo: string;
  cliente_nombre: string;
  estado_actual: string;
  fecha_creacion: string;
  fecha_inicio_diagnostico?: string;
  fecha_fin_diagnostico?: string;
  fecha_cotizacion?: string;
  fecha_inicio_reparacion?: string;
  fecha_fin_reparacion?: string;
  fecha_entrega?: string;
  tecnico_diagnostico?: string;
  tecnico_cotiza?: string;
  tecnico_repara?: string;
  tiempo_diagnostico?: number;
  tiempo_cotizacion?: number;
  tiempo_reparacion?: number;
  tiempo_total?: number;
}

/**
 * Obtener desempeño detallado por técnico
 */
export async function obtenerDesempenoDetallado(
  fechaInicio?: string,
  fechaFin?: string
): Promise<DesempenoTecnico[]> {
  // Query base
  let query = supabase
    .from("ordenes")
    .select(`
      id,
      codigo,
      estado_actual,
      fecha_creacion,
      fecha_inicio_diagnostico,
      fecha_fin_diagnostico,
      fecha_cotizacion,
      fecha_inicio_reparacion,
      fecha_fin_reparacion,
      fecha_entrega,
      tecnico_diagnostico,
      tecnico_cotiza,
      tecnico_repara,
      usuario_diagnostico:usuarios!ordenes_tecnico_diagnostico_fkey(id, nombre, rol),
      usuario_cotiza:usuarios!ordenes_tecnico_cotiza_fkey(id, nombre, rol),
      usuario_repara:usuarios!ordenes_tecnico_repara_fkey(id, nombre, rol)
    `)
    .order("fecha_creacion", { ascending: false });

  // Filtros de fecha
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
    ordenes: any[];
    tiempos_cotizacion: number[];
    tiempos_reparacion: number[];
  }>();

  ordenes?.forEach((orden: any) => {
    // Conjunto para rastrear qué técnicos ya se contaron para esta orden
    const tecnicosEnOrden = new Set<string>();

    // Procesar técnico de cotización (prioridad para métricas de cotización)
    // Solo procesar si el usuario es técnico
    if (orden.tecnico_cotiza && orden.usuario_cotiza && orden.usuario_cotiza.rol === 'tecnico') {
      if (!tecnicosMap.has(orden.tecnico_cotiza)) {
        tecnicosMap.set(orden.tecnico_cotiza, {
          nombre: orden.usuario_cotiza.nombre,
          ordenes: [],
          tiempos_cotizacion: [],
          tiempos_reparacion: []
        });
      }

      const tecnico = tecnicosMap.get(orden.tecnico_cotiza)!;
      
      // Solo contar la orden una vez por técnico
      if (!tecnicosEnOrden.has(orden.tecnico_cotiza)) {
        tecnico.ordenes.push(orden);
        tecnicosEnOrden.add(orden.tecnico_cotiza);
      }

      // Calcular tiempo de cotización (desde fin diagnóstico hasta cotización)
      if (orden.fecha_fin_diagnostico && orden.fecha_cotizacion) {
        const inicio = new Date(orden.fecha_fin_diagnostico);
        const fin = new Date(orden.fecha_cotizacion);
        const horas = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
        if (horas > 0 && horas < 720) { // Máximo 30 días
          tecnico.tiempos_cotizacion.push(horas);
        }
      }
    }

    // Procesar técnico de reparación (prioridad para métricas de reparación)
    // Solo procesar si el usuario es técnico
    if (orden.tecnico_repara && orden.usuario_repara && orden.usuario_repara.rol === 'tecnico') {
      if (!tecnicosMap.has(orden.tecnico_repara)) {
        tecnicosMap.set(orden.tecnico_repara, {
          nombre: orden.usuario_repara.nombre,
          ordenes: [],
          tiempos_cotizacion: [],
          tiempos_reparacion: []
        });
      }

      const tecnico = tecnicosMap.get(orden.tecnico_repara)!;
      
      // Solo contar la orden una vez por técnico
      if (!tecnicosEnOrden.has(orden.tecnico_repara)) {
        tecnico.ordenes.push(orden);
        tecnicosEnOrden.add(orden.tecnico_repara);
      }
      
      // Calcular tiempo de reparación
      if (orden.fecha_inicio_reparacion && orden.fecha_fin_reparacion) {
        const inicio = new Date(orden.fecha_inicio_reparacion);
        const fin = new Date(orden.fecha_fin_reparacion);
        const horas = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
        if (horas > 0 && horas < 720) { // Máximo 30 días
          tecnico.tiempos_reparacion.push(horas);
        }
      }
    }

    // Procesar técnico de diagnóstico (solo si no es cotiza ni repara y es técnico)
    if (orden.tecnico_diagnostico && orden.usuario_diagnostico && 
        orden.usuario_diagnostico.rol === 'tecnico' &&
        orden.tecnico_diagnostico !== orden.tecnico_cotiza && 
        orden.tecnico_diagnostico !== orden.tecnico_repara) {
      if (!tecnicosMap.has(orden.tecnico_diagnostico)) {
        tecnicosMap.set(orden.tecnico_diagnostico, {
          nombre: orden.usuario_diagnostico.nombre,
          ordenes: [],
          tiempos_cotizacion: [],
          tiempos_reparacion: []
        });
      }
      
      const tecnico = tecnicosMap.get(orden.tecnico_diagnostico)!;
      if (!tecnicosEnOrden.has(orden.tecnico_diagnostico)) {
        tecnico.ordenes.push(orden);
        tecnicosEnOrden.add(orden.tecnico_diagnostico);
      }
    }
  });

  // Convertir a array y calcular métricas
  return Array.from(tecnicosMap.entries()).map(([tecnico_id, data]) => {
    const ordenes_completadas = data.ordenes.filter(o => 
      o.estado_actual?.toLowerCase().includes('finalizada') || 
      o.estado_actual?.toLowerCase().includes('completada') ||
      o.estado_actual?.toLowerCase().includes('entregada') ||
      o.estado_actual?.toLowerCase().includes('entrega')
    ).length;

    const ordenes_en_proceso = data.ordenes.filter(o => 
      o.estado_actual?.toLowerCase().includes('proceso') ||
      o.estado_actual?.toLowerCase().includes('diagnóstico') ||
      o.estado_actual?.toLowerCase().includes('diagnostico') ||
      o.estado_actual?.toLowerCase().includes('reparación') ||
      o.estado_actual?.toLowerCase().includes('reparacion') ||
      o.estado_actual?.toLowerCase().includes('cotización') ||
      o.estado_actual?.toLowerCase().includes('cotizacion')
    ).length;

    const tiempo_promedio_cotizacion = data.tiempos_cotizacion.length > 0
      ? data.tiempos_cotizacion.reduce((a, b) => a + b, 0) / data.tiempos_cotizacion.length
      : undefined;

    const tiempo_promedio_reparacion = data.tiempos_reparacion.length > 0
      ? data.tiempos_reparacion.reduce((a, b) => a + b, 0) / data.tiempos_reparacion.length
      : undefined;

    // Calcular score de eficiencia (basado en velocidad y tasa de completación)
    const tasa_completacion = data.ordenes.length > 0 
      ? (ordenes_completadas / data.ordenes.length) * 100 
      : 0;
    
    // Penalizar tiempos largos
    const factor_velocidad_cotizacion = tiempo_promedio_cotizacion 
      ? Math.max(0, 100 - (tiempo_promedio_cotizacion / 24) * 10) // Penalizar si toma más de 10 días
      : 50;
    
    const factor_velocidad_reparacion = tiempo_promedio_reparacion
      ? Math.max(0, 100 - (tiempo_promedio_reparacion / 48) * 10) // Penalizar si toma más de 20 días
      : 50;

    const eficiencia_score = (tasa_completacion * 0.5 + factor_velocidad_cotizacion * 0.25 + factor_velocidad_reparacion * 0.25);

    return {
      tecnico_id,
      tecnico_nombre: data.nombre,
      total_ordenes: data.ordenes.length,
      ordenes_completadas,
      ordenes_en_proceso,
      tiempo_promedio_cotizacion,
      tiempo_promedio_reparacion,
      tiempos_cotizacion: data.tiempos_cotizacion,
      tiempos_reparacion: data.tiempos_reparacion,
      eficiencia_score: Math.round(eficiencia_score)
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
      fecha_cotizacion,
      fecha_inicio_reparacion,
      fecha_fin_reparacion,
      fecha_entrega,
      tecnico_diagnostico,
      tecnico_cotiza,
      tecnico_repara,
      cliente:clientes(razon_social, nombre_comercial)
    `)
    .order("fecha_creacion", { ascending: false });

  if (tecnicoId) {
    query = query.or(`tecnico_diagnostico.eq.${tecnicoId},tecnico_cotiza.eq.${tecnicoId},tecnico_repara.eq.${tecnicoId}`);
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
    // Calcular tiempos entre fases
    const calcularHoras = (inicio?: string, fin?: string) => {
      if (!inicio || !fin) return undefined;
      const i = new Date(inicio);
      const f = new Date(fin);
      return Math.round((f.getTime() - i.getTime()) / (1000 * 60 * 60));
    };

    const tiempo_diagnostico = calcularHoras(orden.fecha_inicio_diagnostico, orden.fecha_fin_diagnostico);
    const tiempo_cotizacion = calcularHoras(orden.fecha_fin_diagnostico, orden.fecha_cotizacion);
    const tiempo_reparacion = calcularHoras(orden.fecha_inicio_reparacion, orden.fecha_fin_reparacion);
    const tiempo_total = calcularHoras(orden.fecha_creacion, orden.fecha_entrega);

    return {
      id: orden.id,
      codigo: orden.codigo || 'Sin código',
      cliente_nombre: orden.cliente?.razon_social || orden.cliente?.nombre_comercial || 'Sin cliente',
      estado_actual: orden.estado_actual || 'Sin estado',
      fecha_creacion: orden.fecha_creacion,
      fecha_inicio_diagnostico: orden.fecha_inicio_diagnostico,
      fecha_fin_diagnostico: orden.fecha_fin_diagnostico,
      fecha_cotizacion: orden.fecha_cotizacion,
      fecha_inicio_reparacion: orden.fecha_inicio_reparacion,
      fecha_fin_reparacion: orden.fecha_fin_reparacion,
      fecha_entrega: orden.fecha_entrega,
      tecnico_diagnostico: orden.tecnico_diagnostico,
      tecnico_cotiza: orden.tecnico_cotiza,
      tecnico_repara: orden.tecnico_repara,
      tiempo_diagnostico,
      tiempo_cotizacion,
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

  const tiempos_cotizacion = desempeno.flatMap(t => t.tiempos_cotizacion);
  const tiempos_reparacion = desempeno.flatMap(t => t.tiempos_reparacion);

  const promedio_cotizacion = tiempos_cotizacion.length > 0
    ? tiempos_cotizacion.reduce((a, b) => a + b, 0) / tiempos_cotizacion.length
    : 0;

  const promedio_reparacion = tiempos_reparacion.length > 0
    ? tiempos_reparacion.reduce((a, b) => a + b, 0) / tiempos_reparacion.length
    : 0;

  const eficiencia_promedio = desempeno.length > 0
    ? desempeno.reduce((acc, t) => acc + t.eficiencia_score, 0) / desempeno.length
    : 0;

  return {
    total_tecnicos,
    total_ordenes,
    total_completadas,
    tasa_completacion: total_ordenes > 0 ? (total_completadas / total_ordenes) * 100 : 0,
    promedio_cotizacion_horas: Math.round(promedio_cotizacion),
    promedio_reparacion_horas: Math.round(promedio_reparacion),
    eficiencia_promedio: Math.round(eficiencia_promedio)
  };
}
