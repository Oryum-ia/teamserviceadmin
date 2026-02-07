/**
 * Utilidades para guardado robusto con reintentos
 */

/**
 * Ejecuta una función con reintentos y backoff exponencial
 * @param fn Función a ejecutar
 * @param maxIntentos Número máximo de intentos (default: 3)
 * @param nombreOperacion Nombre de la operación para logs
 * @returns Resultado de la función
 */
export async function ejecutarConReintentos<T>(
  fn: () => Promise<T>,
  maxIntentos: number = 3,
  nombreOperacion: string = 'operación'
): Promise<T> {
  let ultimoError: Error | null = null;

  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      console.log(`🔄 Intento ${intento}/${maxIntentos} de ${nombreOperacion}...`);
      const resultado = await fn();
      console.log(`✅ ${nombreOperacion} exitosa (intento ${intento})`);
      return resultado;
    } catch (error) {
      ultimoError = error as Error;
      console.error(`❌ Error en intento ${intento} de ${nombreOperacion}:`, error);

      if (intento < maxIntentos) {
        // Backoff exponencial: 1s, 2s, 4s (máximo 5s)
        const espera = Math.min(1000 * Math.pow(2, intento - 1), 5000);
        console.log(`⏳ Esperando ${espera}ms antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, espera));
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  throw new Error(
    `${nombreOperacion} falló después de ${maxIntentos} intentos: ${ultimoError?.message || 'Error desconocido'}`
  );
}

/**
 * Guarda fotos con reintentos automáticos
 * @param ordenId ID de la orden
 * @param fotos Array de URLs de fotos
 * @param tipo Tipo de fotos (recepcion, diagnostico, reparacion, entrega)
 * @param actualizarFn Función de actualización del servicio
 */
export async function guardarFotosConReintentos(
  ordenId: string,
  fotos: string[],
  tipo: 'recepcion' | 'diagnostico' | 'reparacion' | 'entrega',
  actualizarFn: (ordenId: string, fotos: string[]) => Promise<void>
): Promise<void> {
  await ejecutarConReintentos(
    () => actualizarFn(ordenId, fotos),
    3,
    `guardar fotos de ${tipo}`
  );
}

/**
 * Actualiza campos de la orden con reintentos
 * @param ordenId ID de la orden
 * @param campos Campos a actualizar
 * @param supabase Cliente de Supabase
 */
export async function actualizarOrdenConReintentos(
  ordenId: string,
  campos: Record<string, any>,
  supabase: any
): Promise<void> {
  await ejecutarConReintentos(
    async () => {
      const { error } = await supabase
        .from('ordenes')
        .update(campos)
        .eq('id', ordenId);

      if (error) throw error;
    },
    3,
    'actualizar orden'
  );
}

/**
 * Valida archivos antes de subirlos
 * @param files Archivos a validar
 * @param maxSize Tamaño máximo en bytes (default: 300MB)
 * @returns Objeto con archivos válidos e inválidos
 */
export function validarArchivos(
  files: File[],
  maxSize: number = 300 * 1024 * 1024
): {
  validos: File[];
  invalidos: string[];
} {
  const validos: File[] = [];
  const invalidos: string[] = [];

  files.forEach(file => {
    // Validar tipo
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      invalidos.push(`${file.name} (Tipo no válido)`);
      return;
    }

    // Validar tamaño
    if (file.size > maxSize) {
      invalidos.push(`${file.name} (Excede ${Math.round(maxSize / 1024 / 1024)}MB)`);
      return;
    }

    validos.push(file);
  });

  return { validos, invalidos };
}
