import { supabase } from "@/lib/supabaseClient";

const BUCKET_NAME = "ordenes-imagenes"; // Bucket para imágenes de órdenes

/**
 * Subir imagen de orden
 */
export async function subirImagenOrden(
  ordenId: string,
  file: File,
  tipo: "recepcion" | "diagnostico" | "reparacion" | "entrega" = "diagnostico"
): Promise<string> {
  const fileExt = file.name.split(".").pop();
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
  const response = await fetch(`/api/ordenes/${ordenId}/fotos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, fotos })
  });

  if (!response.ok) {
     const errData = await response.json();
     throw new Error(errData.error || 'Falló actualización API');
  }
  console.log(`✅ Fotos de ${tipo} guardadas exitosamente (API Bypass)`);
}
