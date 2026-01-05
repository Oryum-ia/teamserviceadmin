export interface Notification {
  id: string;
  type: 'pqr_nuevo' | 'encuesta_nueva' | 'cotizacion_aceptada' | 'cotizacion_rechazada' | 'terminos_aceptados' | 'order_authorized' | 'warranty_info' | 'system_alert' | 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  duration?: number; // Duration in ms, if undefined it will stay until manually closed
  actionButton?: {
    text: string;
    action: () => void;
  };
  data?: NotificationData;
  referenciaId?: string;
  referenciaTipo?: 'orden' | 'pqr' | 'encuesta';
}

export interface NotificationData {
  orderInfo?: OrderInfo;
  warrantyInfo?: WarrantyInfo;
  customerInfo?: CustomerInfo;
  pqrInfo?: PQRInfo;
  encuestaInfo?: EncuestaInfo;
  cotizacionInfo?: CotizacionInfo;
}

export interface OrderInfo {
  orderId: string;
  orderNumber: string;
  status: 'authorized' | 'pending' | 'completed' | 'cancelled';
  amount?: number;
  currency?: string;
  date: Date;
  description?: string;
}

export interface WarrantyInfo {
  warrantyId: string;
  warrantyType: string;
  expirationDate: Date;
  coverage: string;
  terms?: string;
}

export interface CustomerInfo {
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface PQRInfo {
  pqrId: string;
  radicado: string;
  tipoSolicitud: 'peticion' | 'queja' | 'reclamo' | 'sugerencia' | 'felicitacion';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  email: string;
  telefono: string;
  ciudad: string;
  asunto: string;
}

export interface EncuestaInfo {
  encuestaId: string;
  nombre: string;
  email: string;
  sede: 'monteria' | 'cartagena' | 'apartado';
  promedio: number;
  nps: number;
  atencion: number;
  calidad: number;
  tiempo: number;
  productos: number;
  satisfaccion: number;
  comentarios?: string;
}

export interface CotizacionInfo {
  ordenId: string;
  numeroOrden: string;
  clienteNombre: string;
  total: number;
  faseActual: string;
}

export type NotificationType = Notification['type'];

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => void;
  getUnreadCount: () => number;
}