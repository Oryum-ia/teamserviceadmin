// Tipos para Encuestas
export interface Encuesta {
  id: number;
  nombre_completo: string;
  email: string;
  telefono?: string;
  sede: string;
  atencion_calificacion: number;
  calidad_calificacion: number;
  tiempo_calificacion: number;
  productos_calificacion: number;
  satisfaccion_general: number;
  recomendacion_puntuacion: number;
  comentarios?: string;
  fecha_creacion: string;
  ip_address?: string;
  user_agent?: string;
  user_id?: string;
}

// Tipos para PQR
export type TipoSolicitudPQR = 'peticion' | 'queja' | 'reclamo' | 'sugerencia' | 'felicitacion';
export type EstadoPQR = 'recibido' | 'en_proceso' | 'resuelto' | 'cerrado';
export type PrioridadPQR = 'baja' | 'media' | 'alta' | 'urgente';

export interface PQR {
  id: number;
  tipo_solicitud: TipoSolicitudPQR;
  nombre_completo: string;
  email: string;
  telefono: string;
  ciudad: string;
  asunto: string;
  mensaje: string;
  archivo_adjunto?: string;
  estado: EstadoPQR;
  prioridad: PrioridadPQR;
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_respuesta?: string;
  respuesta?: string;
  radicado: string;
  ip_address?: string;
  user_agent?: string;
  id_usuario_asignado?: string;
}

// Filtros para las tablas
export interface EncuestaFilters {
  sede?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface PQRFilters {
  tipo?: TipoSolicitudPQR;
  estado?: EstadoPQR;
  prioridad?: PrioridadPQR;
  fechaDesde?: string;
  fechaHasta?: string;
}
