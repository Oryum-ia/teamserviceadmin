import { supabase } from "@/lib/supabaseClient";
import { CarruselImagen } from "@/types/database.types";

/**
 * Crear una nueva imagen de carrusel
 */
export async function crearImagenCarrusel(data: Omit<CarruselImagen, 'id' | 'created_at' | 'updated_at'>) {
  const { data: imagen, error } = await supabase
    .from("carrusel")
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al crear imagen de carrusel:", error);
    throw error;
  }

  console.log("✅ Imagen de carrusel creada:", imagen);
  return imagen as CarruselImagen;
}

/**
 * Obtener todas las imágenes del carrusel ordenadas por orden
 */
export async function obtenerTodasLasImagenes() {
  const { data, error } = await supabase
    .from("carrusel")
    .select("*")
    .order("orden", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("❌ Error al obtener imágenes del carrusel:", error);
    throw error;
  }

  return data as CarruselImagen[];
}

/**
 * Obtener una imagen por su ID
 */
export async function obtenerImagenPorId(id: string) {
  const { data, error } = await supabase
    .from("carrusel")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ Error al obtener imagen:", error);
    throw error;
  }

  return data as CarruselImagen;
}

/**
 * Actualizar una imagen existente
 */
export async function actualizarImagen(id: string, data: Partial<Omit<CarruselImagen, 'id' | 'created_at' | 'updated_at'>>) {
  const { data: imagen, error } = await supabase
    .from("carrusel")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar imagen:", error);
    throw error;
  }

  console.log("✅ Imagen actualizada:", imagen);
  return imagen as CarruselImagen;
}

/**
 * Eliminar una imagen
 */
export async function eliminarImagen(id: string) {
  const { error } = await supabase
    .from("carrusel")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Error al eliminar imagen:", error);
    throw error;
  }

  console.log("✅ Imagen eliminada");
  return true;
}

/**
 * Activar o desactivar una imagen
 */
export async function toggleActivoImagen(id: string, activo: boolean) {
  const { data: imagen, error } = await supabase
    .from("carrusel")
    .update({ activo })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar estado de la imagen:", error);
    throw error;
  }

  console.log("✅ Estado de la imagen actualizado:", imagen);
  return imagen as CarruselImagen;
}

/**
 * Subir imagen de carrusel
 */
export async function subirImagenCarrusel(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `carrusel/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('imagenes-tienda')
    .upload(filePath, file);

  if (uploadError) {
    console.error("❌ Error al subir imagen:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('imagenes-tienda')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Eliminar imagen del storage
 */
export async function eliminarImagenDelStorage(imagenUrl: string) {
  try {
    // Extraer el path de la URL
    const urlParts = imagenUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf('carrusel')).join('/');

    const { error } = await supabase.storage
      .from('imagenes-tienda')
      .remove([filePath]);

    if (error) {
      console.error("❌ Error al eliminar imagen:", error);
      throw error;
    }

    console.log("✅ Imagen eliminada del storage");
    return true;
  } catch (err) {
    console.error("❌ Error al procesar eliminación de imagen:", err);
    return false;
  }
}

/**
 * Actualizar orden de imágenes
 */
export async function actualizarOrdenImagenes(imagenes: { id: string; orden: number }[]) {
  const promises = imagenes.map(({ id, orden }) =>
    supabase.from("carrusel").update({ orden }).eq("id", id)
  );

  const results = await Promise.all(promises);
  
  const hasError = results.some(result => result.error);
  if (hasError) {
    console.error("❌ Error al actualizar orden de imágenes");
    throw new Error("Error al actualizar orden");
  }

  console.log("✅ Orden de imágenes actualizado");
  return true;
}
