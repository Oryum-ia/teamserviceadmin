/**
 * Utilidades para manejo de fechas en zona horaria de Colombia (America/Bogota)
 * Todas las fechas del sistema deben usar estas funciones para garantizar consistencia
 * Se implementa un cálculo manual de offset UTC-5 para evitar dependencias del entorno
 */

const COLOMBIA_OFFSET_HOURS = 5;
const COLOMBIA_OFFSET_MS = COLOMBIA_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Obtiene la fecha y hora actual AJUSTADA a la zona horaria de Colombia
 * ¡CUIDADO! El objeto Date devuelto tendrá los valores de fecha/hora de Colombia
 * en sus métodos UTC (getUTCHours, etc).
 * Si usas .getHours() dependerá del entorno local, por lo que se recomienda
 * usar las funciones de formateo de este archivo.
 */
export function obtenerFechaActualColombia(): Date {
  return new Date();
}

/**
 * Obtiene la fecha y hora actual en formato ISO real (UTC)
 * Esto es lo correcto para guardar en BD (Supabase usa UTC)
 */
export function obtenerFechaActualColombiaISO(): string {
  return new Date().toISOString();
}

/**
 * Helper interno para obtener un objeto Date desplazado a la hora de Colombia.
 * Al usar métodos .getUTC*() en este objeto, obtendrás la hora colombiana.
 */
function getShiftedColombiaDate(dateInput: Date | string): Date {
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  // Restamos 5 horas al tiempo UTC para llegar a la hora de Colombia
  // Ejemplo: 21:00 UTC - 5h = 16:00 (que es la hora en Colombia)
  // Al leer esto como UTC (getUTCHours), leeremos 16.
  return new Date(dateObj.getTime() - COLOMBIA_OFFSET_MS);
}

/**
 * Convierte una fecha a zona horaria de Colombia (Shifted Date)
 * @param date - Fecha a convertir
 * @returns Date object ajustado
 */
export function convertirAZonaHorariaColombia(date: Date | string): Date {
  // Esta función existía para compatibilidad, ahora usamos el helper
  return getShiftedColombiaDate(date);
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
  const shiftedDate = getShiftedColombiaDate(date);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'UTC', // IMPORTANTE: Usar UTC porque ya ajustamos manualmente
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options,
  };
  
  return shiftedDate.toLocaleString('es-CO', defaultOptions);
}

/**
 * Formato corto: "21/11/2025, 3:30 PM"
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
 * Formato largo: "21 de noviembre de 2025, 3:30 PM"
 */
export function formatearFechaColombiaLarga(date: Date | string): string {
  return formatearFechaColombia(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Obtiene solo la fecha en formato YYYY-MM-DD (Hora Colombia)
 */
export function obtenerFechaColombiaYYYYMMDD(): string {
  const shifted = getShiftedColombiaDate(new Date());
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la hora en formato HH:mm:ss (Hora Colombia)
 */
export function obtenerHoraColombiaHHMMSS(): string {
  const shifted = getShiftedColombiaDate(new Date());
  const hours = String(shifted.getUTCHours()).padStart(2, '0');
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0');
  const seconds = String(shifted.getUTCSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Crea timestamp ISO. Alias para mantener compatibilidad.
 */
export function crearTimestampColombia(): string {
  return obtenerFechaActualColombiaISO();
}

/**
 * Verifica si una fecha está en el pasado (zona horaria Colombia)
 */
export function esFechaPasada(date: Date | string): boolean {
  const inputTime = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const nowTime = new Date().getTime();
  return inputTime < nowTime;
}

/**
 * Verifica si una fecha está en el futuro (zona horaria Colombia)
 */
export function esFechaFutura(date: Date | string): boolean {
  const inputTime = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const nowTime = new Date().getTime();
  return inputTime > nowTime;
}

/**
 * Calcula diferencia en días
 */
export function calcularDiferenciaDias(fecha1: Date | string, fecha2: Date | string): number {
  const d1 = getShiftedColombiaDate(fecha1);
  const d2 = getShiftedColombiaDate(fecha2);
  
  // Normalizar a medianoche para contar días completos
  d1.setUTCHours(0,0,0,0);
  d2.setUTCHours(0,0,0,0);
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
}

/**
 * Obtiene el inicio del día en Colombia (00:00:00)
 * Retorna un objeto Date real (UTC) que corresponde a esa hora
 */
export function obtenerInicioDiaColombia(date?: Date | string): Date {
  // 1. Obtener la hora colombiana desplazada
  const shifted = getShiftedColombiaDate(date || new Date());
  
  // 2. Alinear a medianoche en ese "tiempo colombiano"
  shifted.setUTCHours(0, 0, 0, 0);
  
  // 3. Devolver los milisegundos desplazados inversamente (+5h) para tener el instante real UTC
  // Esto es: Las 00:00 Col son las 05:00 UTC
  return new Date(shifted.getTime() + COLOMBIA_OFFSET_MS);
}

/**
 * Obtiene el fin del día en Colombia (23:59:59.999)
 */
export function obtenerFinDiaColombia(date?: Date | string): Date {
  const shifted = getShiftedColombiaDate(date || new Date());
  shifted.setUTCHours(23, 59, 59, 999);
  return new Date(shifted.getTime() + COLOMBIA_OFFSET_MS);
}

export const COLOMBIA_TIMEZONE = 'America/Bogota';

/**
 * Convierte un string de datetime-local (YYYY-MM-DDTHH:mm) interpretado como
 * hora de Colombia a un ISO string UTC para guardar en base de datos.
 *
 * Esta función hace la conversión inversa de formatForInput() en EntregaForm.
 * Útil cuando los usuarios ingresan una hora que debe ser guardada en UTC.
 *
 * @param datetimeLocal - String en formato "YYYY-MM-DDTHH:mm" (hora Colombia)
 * @returns ISO string en UTC (e.g., "2025-01-28T09:00:00.000Z")
 *
 * @example
 * // Usuario ingresa "2025-01-28T04:00" (4 AM Colombia)
 * convertirDatetimeLocalColombiaAUTC("2025-01-28T04:00")
 * // Retorna: "2025-01-28T09:00:00.000Z" (9 AM UTC = 4 AM Colombia UTC-5)
 */
export function convertirDatetimeLocalColombiaAUTC(datetimeLocal: string): string {
  // Parsear componentes del string datetime-local
  // Formato esperado: YYYY-MM-DDTHH:mm
  const [datePart, timePart] = datetimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Crear Date en UTC usando los componentes como si fueran UTC
  // Esto nos da una fecha con esos números, pero interpretada como UTC
  const dateInColombiaAsUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  // Sumar el offset de Colombia (UTC-5 = +5 horas) para obtener el tiempo UTC real
  // Ejemplo: Si el usuario ingresó 04:00 Colombia, sumamos 5h = 09:00 UTC
  const actualUTC = new Date(dateInColombiaAsUTC.getTime() + COLOMBIA_OFFSET_MS);

  return actualUTC.toISOString();
}
