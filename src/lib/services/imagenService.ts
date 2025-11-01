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
    console.error("❌ Error al subir imagen:", error);
    throw error;
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
  const { error } = await supabase
    .from("ordenes")
    .update({
      fotos_recepcion: fotos,
      updated_at: new Date().toISOString()
    })
    .eq("id", ordenId);

  if (error) {
    console.error("❌ Error al actualizar fotos de recepción:", error);
    throw error;
  }

  console.log("✅ Fotos de recepción actualizadas en la orden");
}

/**
 * Actualizar fotos en el diagnóstico de la orden
 */
export async function actualizarFotosDiagnostico(
  ordenId: string,
  fotos: string[]
): Promise<void> {
  const { error } = await supabase
    .from("ordenes")
    .update({
      fotos_diagnostico: fotos,
      updated_at: new Date().toISOString()
    })
    .eq("id", ordenId);

  if (error) {
    console.error("❌ Error al actualizar fotos:", error);
    throw error;
  }

  console.log("✅ Fotos actualizadas en la orden");
}

/**
 * Actualizar fotos en reparación
 */
export async function actualizarFotosReparacion(
  ordenId: string,
  fotos: string[]
): Promise<void> {
  const { error } = await supabase
    .from("ordenes")
    .update({
      fotos_reparacion: fotos,
      updated_at: new Date().toISOString()
    })
    .eq("id", ordenId);

  if (error) {
    console.error("❌ Error al actualizar fotos de reparación:", error);
    throw error;
  }

  console.log("✅ Fotos de reparación actualizadas");
}

/**
 * Actualizar fotos en entrega
 */
export async function actualizarFotosEntrega(
  ordenId: string,
  fotos: string[]
): Promise<void> {
  const { error } = await supabase
    .from("ordenes")
    .update({
      fotos_entrega: fotos,
      updated_at: new Date().toISOString()
    })
    .eq("id", ordenId);

  if (error) {
    console.error("❌ Error al actualizar fotos de entrega:", error);
    throw error;
  }

  console.log("✅ Fotos de entrega actualizadas");
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
  } catch (error) {
    console.error("❌ Error al descargar imagen:", error);
    throw error;
  }
}
