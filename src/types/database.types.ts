// Types for the TeamService Costa database

// ============================================
// ROLES
// ============================================
export type UserRole = 'tecnico' | 'admin' | 'super-admin';

// ============================================
// ORDEN PHASES & STATUS
// ============================================
export type OrdenPhase = 'recepcion' | 'diagnostico' | 'cotizacion' | 'reparacion' | 'entrega' | 'finalizada';
export type OrdenStatus = 'pendiente' | 'en_proceso' | 'espera_repuestos' | 'completada' | 'cancelada';

// ============================================
// USUARIO (User)
// ============================================
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  sede?: string;
  activo: boolean;
  created_at: string;
}

// ============================================
// CLIENTE (Client)
// ============================================
export interface Cliente {
  id: string;
  tipo_documento?: string; // CC, NIT, CE, etc.
  identificacion: string;
  dv?: string; // Dígito de verificación (para NIT)
  es_juridica: boolean; // Persona natural o jurídica
  razon_social?: string; // Razón social (para persona jurídica)
  regimen?: string; // Régimen fiscal
  nombre_comercial?: string;
  ciudad?: string;
  direccion?: string;
  telefono?: string;
  telefono_contacto?: string;
  nombre_contacto?: string;
  correo_electronico?: string;
  comentarios?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// ORDEN STATE
// ============================================
export type OrdenEstado = 
  | 'Recepción'
  | 'Diagnóstico' 
  | 'Cotización'
  | 'Esperando repuestos'
  | 'Esperando aceptación'
  | 'Reparación'
  | 'Entrega'
  | 'Finalizada'
  | 'Bodega'
  | 'Chatarrizado';

// ============================================
// REPUESTO (Spare Part)
// ============================================
export interface RepuestoDiagnostico {
  codigo: string;
  descripcion: string;
  cantidad: string | number;
  pieza_causante?: string;
}

export interface RepuestoCotizacion {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  iva: number;
  en_stock: boolean;
}

// ============================================
// ORDEN (Order) - Updated to match DB schema
// ============================================
export interface Orden {
  id: string;
  codigo: string;
  numero_orden?: string;
  cliente_id: string;
  equipo_id?: string;
  
  // Estado actual de la orden
  estado_actual: OrdenEstado;
  fase_actual?: OrdenPhase; // Legacy field
  estado?: OrdenStatus; // Legacy field
  
  // Tipo de orden
  tipo_orden?: 'Reparación' | 'Mantenimiento';
  es_retrabajo?: boolean;
  
  // Valores monetarios
  valor_revision?: number;
  precio_envio?: number;
  subtotal?: number;
  iva?: number;
  total?: number;
  
  // Aprobación del cliente
  aprobado_cliente?: boolean | null;
  envio_cotizacion?: boolean;
  terminos_aceptados?: boolean;
  
  // Firmas
  firma_cliente?: string;
  firma_entrega?: string;
  fecha_firma_cliente?: string;
  fecha_firma_entrega?: string;
  fecha_aceptacion_terminos?: string;
  
  // Fechas de fases
  fecha_creacion: string;
  fecha_fin_recepcion?: string;
  fecha_inicio_diagnostico?: string;
  fecha_fin_diagnostico?: string;
  fecha_cotizacion?: string;
  fecha_aprobacion?: string;
  fecha_solicitud_repuestos?: string;
  fecha_recepcion_repuestos?: string;
  fecha_inicio_reparacion?: string;
  fecha_fin_reparacion?: string;
  fecha_entrega?: string;
  fecha_proximo_mantenimiento?: string;
  ultima_actualizacion?: string;
  
  // Técnicos asignados
  tecnico_recepcion?: string;
  tecnico_diagnostico?: string;
  tecnico_cotiza?: string;
  tecnico_repara?: string;
  tecnico_entrega?: string;
  
  // Comentarios por fase
  comentarios_recepcion?: string;
  comentarios_diagnostico?: string;
  comentarios_cotizacion?: string;
  comentarios_reparacion?: string;
  
  // Datos JSON
  repuestos_diagnostico?: RepuestoDiagnostico[];
  repuestos_cotizacion?: {
    repuestos: RepuestoCotizacion[];
    subtotal?: number;
    iva?: number;
    total?: number;
    valor_revision?: number;
    ultima_actualizacion?: string;
  };
  accesorios?: Array<{
    nombre: string;
    estado: 'traido' | 'no_traido' | 'desconocido';
  }>;
  
  // Fotos
  fotos_recepcion?: string[];
  fotos_diagnostico?: string[];
  fotos_reparacion?: string[];
  fotos_entrega?: string[];
  
  // Entrega
  entrega?: {
    tipo_entrega?: 'Reparado' | 'Devuelto';
    calificacion?: number;
    comentarios_cliente?: string;
  };
  calificacion?: number;
  comentarios_cliente?: string;
  
  // Notas
  nota_orden?: string;
  
  // Metadatos
  sede?: string;
  responsable?: string;
  
  // Relaciones (cargadas con join)
  cliente?: Cliente;
  equipo?: {
    id: string;
    tipo_equipo?: string;
    modelo_id?: string;
    modelo?: {
      id: string;
      equipo?: string;
      cuidado_uso?: string;
      marca?: {
        id: string;
        nombre: string;
      };
    };
  };
  
  // Legacy/compatibility
  diagnostico?: {
    descripcion_problema?: string;
    estado_general?: string;
    observaciones?: string;
    notas_internas?: string[];
    comentarios?: string;
  };
  cotizacion?: {
    repuestos?: RepuestoCotizacion[];
    mano_obra?: number;
    subtotal?: number;
    iva?: number;
    total?: number;
    aprobada_por_cliente?: boolean;
    fecha_aprobacion?: string;
    espera_repuestos?: boolean;
  };
  reparacion?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    tecnico_id?: string;
    descripcion_trabajo?: string;
  };
  
  // Comentarios de retroceso
  comentarios_retroceso?: Array<{
    fase_origen: OrdenPhase;
    fase_destino: OrdenPhase;
    comentario: string;
    usuario_id: string;
    fecha: string;
  }>;

  created_at?: string;
  updated_at?: string;
}


// ============================================
// COMENTARIO (Feedback/Comment)
// ============================================
export interface Comentario {
  id: string;
  orden_id: string;
  fase_origen: OrdenPhase;
  fase_destino: OrdenPhase;
  comentario: string;
  usuario_id: string;
  usuario_nombre?: string;
  created_at: string;
}

// ============================================
// INVENTARIO (Inventory)
// ============================================
export type TipoInventario = 'accesorio' | 'modelo';

export interface ItemInventario {
  id: string;
  tipo: TipoInventario;
  nombre: string;
  marca?: string;
  modelo?: string;
  descripcion?: string;
  cantidad_disponible: number;
  precio_unitario?: number;
  ubicacion?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// PRODUCTO TIENDA (Store Product)
// ============================================
export interface Especificacion {
  nombre: string;
  valor: string;
}

export interface ProductoTienda {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  descuento?: number; // Porcentaje de descuento (0-100)
  categoria_id?: string; // Relación con categoría
  marca_id?: string; // Relación con marca
  sub_categoria?: string; // Sub-categoría o línea del producto
  codigo?: string; // Código de referencia del producto
  imagenes?: string[]; // Array de URLs de imágenes
  especificaciones?: Especificacion[]; // Array de especificaciones dinámicas
  tiempo_garantia?: string; // Tiempo de garantía (ej: "1 año", "6 meses")
  promocion?: boolean;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// CATEGORIA (Category)
// ============================================
export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
}

// ============================================
// CARRUSEL (Landing Carousel)
// ============================================
export interface CarruselImagen {
  id: string;
  titulo?: string;
  descripcion?: string;
  imagen_url: string;
  orden?: number;
  activo?: boolean;
  seccion?: 'principal' | 'labor-social' | 'clientes' | string; // Secciones del carrusel
  created_at?: string;
  updated_at?: string;
}

// ============================================
// ESTADÍSTICAS (Statistics)
// ============================================
export interface EstadisticasGlobales {
  total_ordenes: number;
  ordenes_por_estado: Record<OrdenStatus, number>;
  ordenes_por_fase: Record<string, number>; // Cambiado a string para soportar keys con acentos como 'Diagnóstico', 'Recepción', etc.
  ingresos_totales: number;
  ingresos_mes_actual: number;
  ordenes_dia: number;
  ordenes_semana: number;
  ordenes_mes: number;
}

export interface DesempenoEmpleado {
  usuario_id: string;
  nombre: string;
  ordenes_completadas: number;
  ordenes_en_proceso: number;
  tiempo_promedio_reparacion: number; // en días
  calificacion_promedio?: number;
}

export interface DesempenoSede {
  sede: string;
  ordenes_completadas: number;
  ordenes_en_proceso: number;
  ingresos_totales: number;
  empleados_activos: number;
}

// ============================================
// CUPON (Coupon)
// ============================================
export interface Cupon {
  id: string;
  codigo: string; // Nombre/código único del cupón
  porcentaje_descuento: number; // Porcentaje de descuento (0-100)
  usado: boolean; // Si ya fue usado
  activo: boolean; // Si está activo o no
  fecha_uso?: string; // Fecha en que fue usado
  created_at: string;
  updated_at: string;
}

// ============================================
// API RESPONSES
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
