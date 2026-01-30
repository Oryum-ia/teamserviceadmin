import { supabase } from '../supabaseClient';
import type { OrdenPago, EstadoPago, EstadisticasPagos } from '@/types/bold.types';

/**
 * Obtener todas las órdenes de pago
 */
export async function obtenerTodasLasOrdenes(): Promise<OrdenPago[]> {
  const { data, error } = await supabase
    .from('ordenes_pago')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener órdenes de pago:', error);
    throw new Error(`Error al obtener órdenes de pago: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtener una orden de pago por ID
 */
export async function obtenerOrdenPorId(id: string): Promise<OrdenPago | null> {
  const { data, error } = await supabase
    .from('ordenes_pago')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al obtener orden de pago:', error);
    throw new Error(`Error al obtener orden de pago: ${error.message}`);
  }

  return data;
}

/**
 * Obtener una orden de pago por order_id
 */
export async function obtenerOrdenPorOrderId(orderId: string): Promise<OrdenPago | null> {
  const { data, error } = await supabase
    .from('ordenes_pago')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No encontrado
    }
    console.error('Error al obtener orden de pago:', error);
    throw new Error(`Error al obtener orden de pago: ${error.message}`);
  }

  return data;
}

/**
 * Filtrar órdenes por estado
 */
export async function filtrarOrdenesPorEstado(estado: EstadoPago): Promise<OrdenPago[]> {
  const { data, error } = await supabase
    .from('ordenes_pago')
    .select('*')
    .eq('estado_pago', estado)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al filtrar órdenes:', error);
    throw new Error(`Error al filtrar órdenes: ${error.message}`);
  }

  return data || [];
}

/**
 * Filtrar órdenes por email del cliente
 */
export async function filtrarOrdenesPorEmail(email: string): Promise<OrdenPago[]> {
  const { data, error } = await supabase
    .from('ordenes_pago')
    .select('*')
    .ilike('cliente_email', `%${email}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al filtrar órdenes por email:', error);
    throw new Error(`Error al filtrar órdenes por email: ${error.message}`);
  }

  return data || [];
}

/**
 * Filtrar órdenes por rango de fechas
 */
export async function filtrarOrdenesPorFechas(
  fechaInicio: string,
  fechaFin: string
): Promise<OrdenPago[]> {
  const { data, error } = await supabase
    .from('ordenes_pago')
    .select('*')
    .gte('created_at', fechaInicio)
    .lte('created_at', fechaFin)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al filtrar órdenes por fechas:', error);
    throw new Error(`Error al filtrar órdenes por fechas: ${error.message}`);
  }

  return data || [];
}

/**
 * Actualizar estado de pago
 */
export async function actualizarEstadoPago(
  orderId: string,
  estado: EstadoPago,
  transactionId?: string
): Promise<OrdenPago> {
  const updateData: any = {
    estado_pago: estado,
    updated_at: new Date().toISOString(),
  };

  if (transactionId) {
    updateData.bold_transaction_id = transactionId;
  }

  if (estado === 'aprobado') {
    updateData.fecha_pago = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('ordenes_pago')
    .update(updateData)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar estado de pago:', error);
    throw new Error(`Error al actualizar estado de pago: ${error.message}`);
  }

  return data;
}

/**
 * Eliminar una orden de pago
 */
export async function eliminarOrdenPago(id: string): Promise<void> {
  const { error } = await supabase
    .from('ordenes_pago')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar orden de pago:', error);
    throw new Error(`Error al eliminar orden de pago: ${error.message}`);
  }
}

/**
 * Obtener estadísticas de pagos
 */
export async function obtenerEstadisticasPagos(): Promise<EstadisticasPagos> {
  const { data: ordenes, error } = await supabase
    .from('ordenes_pago')
    .select('*');

  if (error) {
    console.error('Error al obtener estadísticas:', error);
    throw new Error(`Error al obtener estadísticas: ${error.message}`);
  }

  const stats: EstadisticasPagos = {
    total_ordenes: ordenes?.length || 0,
    ordenes_aprobadas: ordenes?.filter(o => o.estado_pago === 'aprobado').length || 0,
    ordenes_pendientes: ordenes?.filter(o => o.estado_pago === 'pendiente').length || 0,
    ordenes_rechazadas: ordenes?.filter(o => o.estado_pago === 'rechazado').length || 0,
    ordenes_canceladas: ordenes?.filter(o => o.estado_pago === 'cancelado').length || 0,
    ordenes_expiradas: ordenes?.filter(o => o.estado_pago === 'expirado').length || 0,
    total_ventas: ordenes
      ?.filter(o => o.estado_pago === 'aprobado')
      .reduce((sum, o) => sum + (o.total || 0), 0) || 0,
    promedio_venta: 0,
    ventas_por_dia: {},
    ventas_por_metodo: {
      pse: 0,
      'credit-card': 0,
      efecty: 0,
      whatsapp: 0,
    },
    productos_mas_vendidos: [],
  };

  // Calcular promedio de venta
  if (stats.ordenes_aprobadas > 0) {
    stats.promedio_venta = stats.total_ventas / stats.ordenes_aprobadas;
  }

  // Ventas por día (últimos 30 días)
  const ordenesAprobadas = ordenes?.filter(o => o.estado_pago === 'aprobado') || [];
  ordenesAprobadas.forEach(orden => {
    const fecha = new Date(orden.created_at).toISOString().split('T')[0];
    stats.ventas_por_dia[fecha] = (stats.ventas_por_dia[fecha] || 0) + orden.total;
  });

  // Ventas por método de pago
  ordenesAprobadas.forEach(orden => {
    if (orden.metodo_pago in stats.ventas_por_metodo) {
      stats.ventas_por_metodo[orden.metodo_pago] += orden.total;
    }
  });

  // Productos más vendidos
  const productosMap = new Map<string, { cantidad: number; total: number }>();
  ordenesAprobadas.forEach(orden => {
    if (orden.productos && Array.isArray(orden.productos)) {
      orden.productos.forEach((producto: any) => {
        const key = producto.name;
        const existing = productosMap.get(key) || { cantidad: 0, total: 0 };
        productosMap.set(key, {
          cantidad: existing.cantidad + (producto.quantity || 0),
          total: existing.total + (producto.price * producto.quantity || 0),
        });
      });
    }
  });

  stats.productos_mas_vendidos = Array.from(productosMap.entries())
    .map(([nombre, data]) => ({
      nombre,
      cantidad: data.cantidad,
      total_ventas: data.total,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  return stats;
}

/**
 * Buscar órdenes (por order_id, email o nombre)
 */
export async function buscarOrdenes(query: string): Promise<OrdenPago[]> {
  const { data, error } = await supabase
    .from('ordenes_pago')
    .select('*')
    .or(`order_id.ilike.%${query}%,cliente_email.ilike.%${query}%,cliente_nombre.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al buscar órdenes:', error);
    throw new Error(`Error al buscar órdenes: ${error.message}`);
  }

  return data || [];
}
