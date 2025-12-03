/**
 * Servicio para verificar órdenes en bodega vencidas (más de 1 semana)
 * y crear notificaciones automáticas
 */

import { getSupabase } from '@/lib/supabaseClient';

const DIAS_LIMITE_BODEGA = 7; // 1 semana

interface OrdenEnBodega {
  id: string;
  codigo: string;
  fecha_bodega: string;
  cliente: {
    nombre_comercial?: string;
    razon_social?: string;
    nombre_contacto?: string;
  };
  equipo?: {
    modelo?: {
      equipo?: string;
      marca?: {
        nombre?: string;
      };
    };
  };
}

/**
 * Verifica si una orden en bodega ha superado el límite de días
 */
const esBodegaVencida = (fechaBodega: string): boolean => {
  const fecha = new Date(fechaBodega);
  const ahora = new Date();
  const diffTime = ahora.getTime() - fecha.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= DIAS_LIMITE_BODEGA;
};

/**
 * Calcula los días transcurridos desde que se envió a bodega
 */
const calcularDiasEnBodega = (fechaBodega: string): number => {
  const fecha = new Date(fechaBodega);
  const ahora = new Date();
  const diffTime = ahora.getTime() - fecha.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verifica si ya existe una notificación de bodega vencida para esta orden
 */
const existeNotificacionBodegaVencida = async (ordenId: string): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('notificaciones')
    .select('id')
    .eq('referencia_id', ordenId)
    .eq('referencia_tipo', 'orden')
    .eq('tipo', 'warning')
    .ilike('titulo', '%bodega%')
    .limit(1);

  if (error) {
    console.error('Error al verificar notificación existente:', error);
    return false;
  }

  return (data?.length || 0) > 0;
};

/**
 * Crea una notificación de bodega vencida
 */
const crearNotificacionBodegaVencida = async (orden: OrdenEnBodega): Promise<void> => {
  const diasEnBodega = calcularDiasEnBodega(orden.fecha_bodega);
  const clienteNombre = orden.cliente?.nombre_comercial || orden.cliente?.razon_social || orden.cliente?.nombre_contacto || 'Cliente';
  const equipoDescripcion = orden.equipo?.modelo 
    ? `${orden.equipo.modelo.marca?.nombre || ''} ${orden.equipo.modelo.equipo || ''}`.trim()
    : 'Equipo';

  const supabase = getSupabase();
  if (!supabase) {
    console.error('Error: Cliente Supabase no disponible');
    return;
  }

  const { error } = await supabase
    .from('notificaciones')
    .insert({
      tipo: 'warning',
      titulo: `Producto en bodega por ${diasEnBodega} días`,
      mensaje: `La orden ${orden.codigo} del cliente ${clienteNombre} (${equipoDescripcion}) lleva más de ${DIAS_LIMITE_BODEGA} días en bodega. Considere contactar al cliente.`,
      leida: false,
      referencia_id: orden.id,
      referencia_tipo: 'orden',
      datos_adicionales: {
        orden_codigo: orden.codigo,
        cliente_nombre: clienteNombre,
        equipo: equipoDescripcion,
        fecha_bodega: orden.fecha_bodega,
        dias_en_bodega: diasEnBodega
      }
    });

  if (error) {
    console.error('Error al crear notificación de bodega vencida:', error);
  } else {
    console.log(`✅ Notificación creada para orden ${orden.codigo} - ${diasEnBodega} días en bodega`);
  }
};

/**
 * Verifica todas las órdenes en bodega y crea notificaciones para las vencidas
 * Esta función debe llamarse periódicamente (ej: al cargar el dashboard)
 */
export const verificarOrdenesBodegaVencidas = async (): Promise<number> => {
  const supabase = getSupabase();
  if (!supabase) {
    console.error('Error: Cliente Supabase no disponible');
    return 0;
  }

  try {
    // Obtener todas las órdenes en estado Bodega
    const { data: ordenes, error } = await supabase
      .from('ordenes')
      .select(`
        id,
        codigo,
        fecha_bodega,
        cliente:clientes(nombre_comercial, razon_social, nombre_contacto),
        equipo:equipos(
          modelo:modelos(
            equipo,
            marca:marcas(nombre)
          )
        )
      `)
      .eq('estado_actual', 'Bodega')
      .not('fecha_bodega', 'is', null);

    if (error) {
      console.error('Error al obtener órdenes en bodega:', error);
      return 0;
    }

    if (!ordenes || ordenes.length === 0) {
      return 0;
    }

    let notificacionesCreadas = 0;

    for (const orden of ordenes) {
      // Verificar si la orden ha superado el límite
      if (esBodegaVencida(orden.fecha_bodega)) {
        // Verificar si ya existe una notificación para esta orden
        const yaNotificada = await existeNotificacionBodegaVencida(orden.id);
        
        if (!yaNotificada) {
          await crearNotificacionBodegaVencida(orden as unknown as OrdenEnBodega);
          notificacionesCreadas++;
        }
      }
    }

    if (notificacionesCreadas > 0) {
      console.log(`📦 Se crearon ${notificacionesCreadas} notificaciones de bodega vencida`);
    }

    return notificacionesCreadas;
  } catch (error) {
    console.error('Error en verificarOrdenesBodegaVencidas:', error);
    return 0;
  }
};

/**
 * Obtiene el conteo de órdenes en bodega vencidas
 */
export const contarOrdenesBodegaVencidas = async (): Promise<number> => {
  const supabase = getSupabase();
  if (!supabase) return 0;

  try {
    const { data: ordenes, error } = await supabase
      .from('ordenes')
      .select('id, fecha_bodega')
      .eq('estado_actual', 'Bodega')
      .not('fecha_bodega', 'is', null);

    if (error || !ordenes) {
      return 0;
    }

    return ordenes.filter(orden => esBodegaVencida(orden.fecha_bodega)).length;
  } catch (error) {
    console.error('Error al contar órdenes en bodega vencidas:', error);
    return 0;
  }
};
