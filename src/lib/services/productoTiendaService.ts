import { supabase } from "@/lib/supabaseClient";
import { ProductoTienda } from "@/types/database.types";

/**
 * Crear un nuevo producto de tienda
 */
export async function crearProductoTienda(data: Omit<ProductoTienda, 'id' | 'created_at' | 'updated_at'>) {
  const { data: producto, error } = await supabase
    .from("producto_tienda")
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al crear producto:", error);
    throw error;
  }

  console.log("✅ Producto creado:", producto);
  return producto as ProductoTienda;
}

/**
 * Obtener todos los productos de tienda ordenados por fecha de creación
 */
export async function obtenerTodosLosProductos() {
  const { data, error } = await supabase
    .from("producto_tienda")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener productos:", error);
    throw error;
  }

  return data as ProductoTienda[];
}

/**
 * Buscar productos por nombre o descripción
 */
export async function buscarProductos(termino: string) {
  const { data, error } = await supabase
    .from("producto_tienda")
    .select("*")
    .or(`nombre.ilike.%${termino}%,descripcion.ilike.%${termino}%`)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("❌ Error al buscar productos:", error);
    throw error;
  }

  return data as ProductoTienda[];
}

/**
 * Obtener un producto por su ID
 */
export async function obtenerProductoPorId(id: string) {
  const { data, error } = await supabase
    .from("producto_tienda")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ Error al obtener producto:", error);
    throw error;
  }

  return data as ProductoTienda;
}

/**
 * Actualizar un producto existente
 */
export async function actualizarProducto(id: string, data: Partial<Omit<ProductoTienda, 'id' | 'created_at' | 'updated_at'>>) {
  const { data: producto, error } = await supabase
    .from("producto_tienda")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar producto:", error);
    throw error;
  }

  console.log("✅ Producto actualizado:", producto);
  return producto as ProductoTienda;
}

/**
 * Eliminar un producto
 */
export async function eliminarProducto(id: string) {
  const { error } = await supabase
    .from("producto_tienda")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Error al eliminar producto:", error);
    throw error;
  }

  console.log("✅ Producto eliminado");
  return true;
}

/**
 * Activar o desactivar un producto
 */
export async function toggleActivoProducto(id: string, activo: boolean) {
  const { data: producto, error } = await supabase
    .from("producto_tienda")
    .update({ activo })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar estado del producto:", error);
    throw error;
  }

  console.log("✅ Estado del producto actualizado:", producto);
  return producto as ProductoTienda;
}

/**
 * Subir imagen de producto
 */
export async function subirImagenProducto(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `productos/${fileName}`;

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
 * Eliminar imagen de producto del storage
 */
export async function eliminarImagenProducto(imagenUrl: string) {
  try {
    // Extraer el path de la URL
    const urlParts = imagenUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf('productos')).join('/');

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
