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
// ORDEN (Order)
// ============================================
export interface Orden {
  id: string;
  cliente_id: string;
  numero_orden: string;
  fase_actual: OrdenPhase;
  estado: OrdenStatus;
  responsable?: string;

  // Datos del producto
  tipo_producto?: string;
  marca?: string;
  modelo?: string;
  serial?: string;

  // Diagnóstico
  diagnostico?: {
    descripcion_problema?: string;
    estado_general?: string;
    observaciones?: string;
    notas_internas?: string[];
    preventivos?: Array<{
      item: string;
      descripcion: string;
      precio: number;
    }>;
    tecnico_id?: string;
    fecha_diagnostico?: string;
  };

  // Cotización
  cotizacion?: {
    repuestos?: Array<{
      nombre: string;
      cantidad: number;
      precio_unitario: number;
      precio_total: number;
    }>;
    mano_obra?: number;
    subtotal?: number;
    iva?: number;
    total?: number;
    aprobada_por_cliente?: boolean;
    fecha_aprobacion?: string;
    espera_repuestos?: boolean;
    fecha_espera_repuestos?: string;
  };

  // Reparación
  reparacion?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    tecnico_id?: string;
    descripcion_trabajo?: string;
    repuestos_usados?: Array<{
      nombre: string;
      cantidad: number;
    }>;
  };

  // Metadata
  comentarios_retroceso?: Array<{
    fase_origen: OrdenPhase;
    fase_destino: OrdenPhase;
    comentario: string;
    usuario_id: string;
    fecha: string;
  }>;

  created_at: string;
  updated_at: string;
  fecha_finalizacion?: string;
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
  categoria_id?: string; // Relación con categoría
  marca_id?: string; // Relación con marca
  imagenes?: string[]; // Array de URLs de imágenes
  especificaciones?: Especificacion[]; // Array de especificaciones dinámicas
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
