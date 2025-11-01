import { supabase } from "@/lib/supabaseClient";

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
}

/**
 * Obtener todas las categorías activas
 */
export async function obtenerTodasLasCategorias() {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener categorías:", error);
    throw error;
  }

  return data as Categoria[];
}

/**
 * Obtener una categoría por ID
 */
export async function obtenerCategoriaPorId(id: string) {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ Error al obtener categoría:", error);
    throw error;
  }

  return data as Categoria;
}

/**
 * Crear una nueva categoría
 */
export async function crearCategoria(data: {
  nombre: string;
  descripcion?: string;
}) {
  // Limpiar y validar datos
  const categoriaData = {
    nombre: data.nombre.trim(),
    descripcion: data.descripcion?.trim() || null,
    activo: true
  };

  const { data: categoria, error } = await supabase
    .from("categorias")
    .insert([categoriaData])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al crear categoría:", error);
    // Manejar error de duplicado
    if (error.code === '23505') {
      throw new Error('Ya existe una categoría con ese nombre');
    }
    throw error;
  }

  console.log("✅ Categoría creada:", categoria);
  return categoria as Categoria;
}

/**
 * Actualizar una categoría
 */
export async function actualizarCategoria(id: string, data: Partial<Categoria>) {
  const { data: categoria, error } = await supabase
    .from("categorias")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar categoría:", error);
    if (error.code === '23505') {
      throw new Error('Ya existe una categoría con ese nombre');
    }
    throw error;
  }

  console.log("✅ Categoría actualizada");
  return categoria as Categoria;
}

/**
 * Eliminar (desactivar) una categoría
 */
export async function desactivarCategoria(id: string) {
  const { data, error } = await supabase
    .from("categorias")
    .update({ activo: false })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al desactivar categoría:", error);
    throw error;
  }

  console.log("✅ Categoría desactivada");
  return data as Categoria;
}

/**
 * Buscar categorías por nombre
 */
export async function buscarCategorias(termino: string) {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("activo", true)
    .ilike("nombre", `%${termino}%`)
    .order("nombre", { ascending: true })
    .limit(10);

  if (error) {
    console.error("❌ Error al buscar categorías:", error);
    throw error;
  }

  return data as Categoria[];
}
