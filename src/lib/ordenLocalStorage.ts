/**
 * Servicio para gestionar el estado de órdenes en localStorage
 * con sincronización en tiempo real con Supabase
 * 
 * ⚠️ SSR-Safe: Todas las funciones verifican typeof window antes de acceder a localStorage
 */

const ORDEN_STORAGE_KEY = 'orden_activa';
const ORDEN_TIMESTAMP_KEY = 'orden_timestamp';

/**
 * Verificar si estamos en el cliente (browser)
 */
const isClient = typeof window !== 'undefined';

export interface OrdenLocalData {
  id: number;
  // Datos básicos de la orden
  numero_orden: string;
  cliente_id: number;
  equipo: string;
  marca: string;
  modelo: string;
  serie: string;
  fase_actual: string;
  estado: string;
  
  // Datos de cotización
  tipo_orden?: string | null;
  tecnico_repara?: number | null;
  aprobacion_marca?: any;
  
  // Datos de diagnóstico
  diagnostico?: string | null;
  tecnico_diagnostico?: number | null;
  fecha_diagnostico?: string | null;
  
  // Datos de reparación
  trabajos_realizados?: string | null;
  repuestos_utilizados?: any;
  fecha_reparacion?: string | null;
  
  // Metadatos
  ultima_actualizacion: string;
  created_at?: string;
  
  // Relaciones
  cliente?: any;
  tecnico?: any;
}

/**
 * Guardar orden completa en localStorage
 */
export const saveOrdenToLocalStorage = (orden: OrdenLocalData): void => {
  if (!isClient) return;
  
  try {
    window.localStorage.setItem(ORDEN_STORAGE_KEY, JSON.stringify(orden));
    window.localStorage.setItem(ORDEN_TIMESTAMP_KEY, new Date().toISOString());
    console.log('✅ Orden guardada en localStorage:', orden.numero_orden);
  } catch (error) {
    console.error('❌ Error guardando orden en localStorage:', error);
  }
};

/**
 * Obtener orden desde localStorage
 */
export const getOrdenFromLocalStorage = (): OrdenLocalData | null => {
  if (!isClient) return null;
  
  try {
    const ordenStr = window.localStorage.getItem(ORDEN_STORAGE_KEY);
    if (!ordenStr) return null;
    
    const orden = JSON.parse(ordenStr);
    console.log('📦 Orden cargada desde localStorage:', orden.numero_orden);
    return orden;
  } catch (error) {
    console.error('❌ Error leyendo orden desde localStorage:', error);
    return null;
  }
};

/**
 * Actualizar campos específicos de la orden en localStorage
 */
export const updateOrdenFields = (fields: Partial<OrdenLocalData>): void => {
  if (!isClient) return;
  
  try {
    const orden = getOrdenFromLocalStorage();
    if (!orden) {
      console.warn('⚠️ No hay orden en localStorage para actualizar');
      return;
    }
    
    const ordenActualizada = {
      ...orden,
      ...fields,
      ultima_actualizacion: new Date().toISOString()
    };
    
    saveOrdenToLocalStorage(ordenActualizada);
  } catch (error) {
    console.error('❌ Error actualizando campos de orden:', error);
  }
};

/**
 * Limpiar orden del localStorage
 */
export const clearOrdenFromLocalStorage = (): void => {
  if (!isClient) return;
  
  try {
    window.localStorage.removeItem(ORDEN_STORAGE_KEY);
    window.localStorage.removeItem(ORDEN_TIMESTAMP_KEY);
    console.log('🗑️ Orden eliminada de localStorage');
  } catch (error) {
    console.error('❌ Error limpiando localStorage:', error);
  }
};

/**
 * Verificar si la orden en localStorage es la misma que la solicitada
 */
export const isOrdenInLocalStorage = (ordenId: number): boolean => {
  if (!isClient) return false;
  
  const orden = getOrdenFromLocalStorage();
  return orden?.id === ordenId;
};

/**
 * Obtener timestamp de última actualización
 */
export const getOrdenTimestamp = (): string | null => {
  if (!isClient) return null;
  
  try {
    return window.localStorage.getItem(ORDEN_TIMESTAMP_KEY);
  } catch {
    return null;
  }
};
