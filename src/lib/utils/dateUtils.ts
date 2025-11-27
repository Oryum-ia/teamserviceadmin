/**
 * Utilidades para manejo de fechas en zona horaria de Colombia (America/Bogota)
 * Todas las fechas del sistema deben usar estas funciones para garantizar consistencia
 */

const COLOMBIA_TIMEZONE = 'America/Bogota';

/**
 * Obtiene la fecha y hora actual en zona horaria de Colombia
 * @returns Date object (en UTC, pero representa la hora actual)
 */
export function obtenerFechaActualColombia(): Date {
  // Simplemente retornar la fecha actual
  // El formateo con zona horaria se hace al mostrar
  return new Date();
}

/**
 * Obtiene la fecha y hora actual en formato ISO para guardar en base de datos
 * IMPORTANTE: Guarda en UTC, el formateo a Colombia se hace al mostrar
 * @returns string en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
export function obtenerFechaActualColombiaISO(): string {
  return new Date().toISOString();
}

/**
 * Convierte una fecha a zona horaria de Colombia
 * @param date - Fecha a convertir
 * @returns Date object ajustado a Colombia
 */
export function convertirAZonaHorariaColombia(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const colombiaString = dateObj.toLocaleString('en-US', {
    timeZone: COLOMBIA_TIMEZONE,
  });
  
  return new Date(colombiaString);
}

/**
 * Formatea una fecha en zona horaria de Colombia
 * @param date - Fecha a formatear
 * @param options - Opciones de formato (Intl.DateTimeFormatOptions)
 * @returns string formateado
 */
export function formatearFechaColombia(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Restar 5 horas para convertir UTC a Colombia (UTC-5)
  const colombiaDate = new Date(dateObj.getTime() - (5 * 60 * 60 * 1000));
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return colombiaDate.toLocaleString('es-CO', defaultOptions);
}

/**
 * Formatea una fecha en formato corto para Colombia
 * Ejemplo: "21/11/2025, 3:30 PM"
 */
export function formatearFechaColombiaCorta(date: Date | string): string {
  return formatearFechaColombia(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea una fecha en formato largo para Colombia
 * Ejemplo: "21 de noviembre de 2025, 3:30 PM"
 */
export function formatearFechaColombiaLarga(date: Date | string): string {
  return formatearFechaColombia(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Obtiene solo la fecha (sin hora) en zona horaria de Colombia
 * @returns string en formato YYYY-MM-DD
 */
export function obtenerFechaColombiaYYYYMMDD(): string {
  const colombiaDate = obtenerFechaActualColombia();
  const year = colombiaDate.getFullYear();
  const month = String(colombiaDate.getMonth() + 1).padStart(2, '0');
  const day = String(colombiaDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la hora actual en zona horaria de Colombia
 * @returns string en formato HH:mm:ss
 */
export function obtenerHoraColombiaHHMMSS(): string {
  const colombiaDate = obtenerFechaActualColombia();
  const hours = String(colombiaDate.getHours()).padStart(2, '0');
  const minutes = String(colombiaDate.getMinutes()).padStart(2, '0');
  const seconds = String(colombiaDate.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Crea un timestamp para Supabase en zona horaria de Colombia
 * Útil para campos created_at, updated_at, etc.
 */
export function crearTimestampColombia(): string {
  return obtenerFechaActualColombiaISO();
}

/**
 * Verifica si una fecha está en el pasado (zona horaria Colombia)
 */
export function esFechaPasada(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = obtenerFechaActualColombia();
  return dateObj < now;
}

/**
 * Verifica si una fecha está en el futuro (zona horaria Colombia)
 */
export function esFechaFutura(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = obtenerFechaActualColombia();
  return dateObj > now;
}

/**
 * Calcula la diferencia en días entre dos fechas (zona horaria Colombia)
 */
export function calcularDiferenciaDias(fecha1: Date | string, fecha2: Date | string): number {
  const date1 = convertirAZonaHorariaColombia(fecha1);
  const date2 = convertirAZonaHorariaColombia(fecha2);
  
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Obtiene el inicio del día en zona horaria de Colombia
 */
export function obtenerInicioDiaColombia(date?: Date | string): Date {
  const dateObj = date 
    ? convertirAZonaHorariaColombia(date)
    : obtenerFechaActualColombia();
  
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

/**
 * Obtiene el fin del día en zona horaria de Colombia
 */
export function obtenerFinDiaColombia(date?: Date | string): Date {
  const dateObj = date 
    ? convertirAZonaHorariaColombia(date)
    : obtenerFechaActualColombia();
  
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}

// Exportar constante de zona horaria para uso directo si es necesario
export { COLOMBIA_TIMEZONE };
