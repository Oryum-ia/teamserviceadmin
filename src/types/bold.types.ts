// Types for Bold Payment Integration

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado' | 'expirado';
export type MetodoPago = 'pse' | 'credit-card' | 'efecty' | 'whatsapp';

export interface ProductoOrden {
  id: string;
  name: string;
  model?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrdenPago {
  id: string;
  order_id: string;
  bold_transaction_id?: string;
  
  // Información del cliente
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  cliente_documento?: string;
  cliente_tipo_documento?: string;
  
  // Dirección de envío
  direccion_completa: string;
  ciudad: string;
  departamento: string;
  codigo_postal?: string;
  
  // Productos
  productos: ProductoOrden[];
  
  // Valores monetarios
  subtotal: number;
  descuento: number;
  codigo_cupon?: string;
  costo_envio: number;
  total: number;
  
  // Pago
  metodo_pago: MetodoPago;
  estado_pago: EstadoPago;
  
  // Notas
  notas_pedido?: string;
  hash_integridad?: string;
  
  // Fechas
  created_at: string;
  updated_at?: string;
  fecha_pago?: string;
}

export interface EstadisticasPagos {
  total_ordenes: number;
  ordenes_aprobadas: number;
  ordenes_pendientes: number;
  ordenes_rechazadas: number;
  ordenes_canceladas: number;
  ordenes_expiradas: number;
  total_ventas: number;
  promedio_venta: number;
  ventas_por_dia: Record<string, number>;
  ventas_por_metodo: Record<MetodoPago, number>;
  productos_mas_vendidos: Array<{
    nombre: string;
    cantidad: number;
    total_ventas: number;
  }>;
}
