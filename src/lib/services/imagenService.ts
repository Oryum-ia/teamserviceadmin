import { supabase } from "@/lib/supabaseClient";

const BUCKET_NAME = "ordenes-imagenes"; // Bucket para imágenes de órdenes

function obtenerExtensionSegura(file: File): string {
  const nombre = file.name || "";
  const indicePunto = nombre.lastIndexOf('.');
  const extensionDesdeNombre = indicePunto > -1 ? nombre.slice(indicePunto + 1).trim().toLowerCase() : '';

  if (extensionDesdeNombre) {
    return extensionDesdeNombre;
  }

  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('video/')) {
    if (mime.includes('mp4')) return 'mp4';
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('quicktime')) return 'mov';
    if (mime.includes('x-matroska')) return 'mkv';
    if (mime.includes('x-msvideo')) return 'avi';
    return 'mp4';
  }

  if (mime.startsWith('image/')) {
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    if (mime.includes('png')) return 'png';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('heic')) return 'heic';
    if (mime.includes('gif')) return 'gif';
    return 'jpg';
  }

  return 'bin';
}

/**
 * Subir imagen de orden
 */
export async function subirImagenOrden(
  ordenId: string,
  file: File,
  tipo: "recepcion" | "diagnostico" | "reparacion" | "entrega" = "diagnostico"
): Promise<string> {
  const fileExt = obtenerExtensionSegura(file);
  const fileName = `${ordenId}/${tipo}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.warn("⚠️ Error subida directa (posible bloqueo RLS). Intentando vía API Proxy...", error.message);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', BUCKET_NAME);
      formData.append('path', fileName);

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Error en API Upload');
      }

      const result = await response.json();
      console.log("✅ Imagen subida vía API:", result.publicUrl);
      return result.publicUrl;

    } catch (apiError) {
       console.error("❌ Falló el fallback a API Storage:", apiError);
       // Lanzar el error original de Storage para debug
       throw error;
    }
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  console.log("✅ Imagen subida:", urlData.publicUrl);
  return urlData.publicUrl;
}

/**
 * Subir múltiples imágenes
 */
export async function subirMultiplesImagenes(
  ordenId: string,
  files: File[],
  tipo: "recepcion" | "diagnostico" | "reparacion" | "entrega" = "diagnostico"
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    subirImagenOrden(ordenId, file, tipo)
  );

  const urls = await Promise.all(uploadPromises);
  return urls;
}

/**
 * Eliminar imagen de Storage
 */
export async function eliminarImagenOrden(url: string): Promise<boolean> {
  try {
    // Extraer el path del archivo desde la URL
    const urlObj = new URL(url);
    const path = urlObj.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];

    if (!path) {
      throw new Error("No se pudo extraer el path de la imagen");
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error("❌ Error al eliminar imagen:", error);
      throw error;
    }

    console.log("✅ Imagen eliminada del storage");
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar imagen:", error);
    throw error;
  }
}

/**
 * Actualizar fotos en recepción de la orden
 */
export async function actualizarFotosRecepcion(
  ordenId: string,
  fotos: string[]
): Promise<void> {
  console.log(`📸 Actualizando fotos recepción vía API para orden ${ordenId}`);
  await actualizarFotosViaApi(ordenId, 'recepcion', fotos);
}

/**
 * Actualizar fotos en el diagnóstico de la orden
 */
export async function actualizarFotosDiagnostico(
  ordenId: string,
  fotos: string[]
): Promise<void> {
  console.log(`📸 Actualizando fotos diagnóstico vía API para orden ${ordenId}`);
  await actualizarFotosViaApi(ordenId, 'diagnostico', fotos);
}

/**
 * Actualizar fotos en reparación
 */
export async function actualizarFotosReparacion(
  ordenId: string,
  fotos: string[]
): Promise<void> {
  console.log(`📸 Actualizando fotos reparación vía API para orden ${ordenId}`);
  await actualizarFotosViaApi(ordenId, 'reparacion', fotos);
}

/**
 * Actualizar fotos en entrega
 */
export async function actualizarFotosEntrega(
  ordenId: string,
  fotos: string[]
): Promise<void> {
  console.log(`📸 Actualizando fotos entrega vía API para orden ${ordenId}`);
  await actualizarFotosViaApi(ordenId, 'entrega', fotos);
}

/**
 * Descargar imagen
 */
export async function descargarImagen(url: string, nombreArchivo: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(blobUrl);
    console.log("✅ Imagen descargada");
    console.log("✅ Imagen descargada");
  } catch (error) {
    console.error("❌ Error al descargar imagen:", error);
    throw error;
  }
}

/**
 * Helper privado para actualizar fotos vía API cuando RLS falla
 */
async function actualizarFotosViaApi(ordenId: string, tipo: string, fotos: string[]) {
  const maxIntentos = 3;
  let ultimoError: Error | null = null;

  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      console.log(`🔄 Intento ${intento}/${maxIntentos} de actualizar fotos vía API...`);
      
      const response = await fetch(`/api/ordenes/${ordenId}/fotos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, fotos })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      console.log(`✅ Fotos de ${tipo} guardadas exitosamente (API - intento ${intento})`);
      return; // Éxito, salir de la función
    } catch (error) {
      ultimoError = error as Error;
      console.error(`❌ Error en intento ${intento}:`, error);
      
      if (intento < maxIntentos) {
        // Esperar antes de reintentar (backoff exponencial)
        const espera = Math.min(1000 * Math.pow(2, intento - 1), 5000);
        console.log(`⏳ Esperando ${espera}ms antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, espera));
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  throw new Error(`Falló actualización API después de ${maxIntentos} intentos: ${ultimoError?.message || 'Error desconocido'}`);
}
