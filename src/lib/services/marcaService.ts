import { supabase } from "@/lib/supabaseClient";

export interface Marca {
  id: string;
  nombre: string;
  descripcion?: string;
  pais_origen?: string;
  sitio_web?: string;
  activo: boolean;
  created_at: string;
}

/**
 * Obtener todas las marcas activas
 */
export async function obtenerTodasLasMarcas() {
  const { data, error } = await supabase
    .from("marcas")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener marcas:", error);
    throw error;
  }

  return data as Marca[];
}

/**
 * Obtener una marca por ID
 */
export async function obtenerMarcaPorId(id: string) {
  const { data, error } = await supabase
    .from("marcas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ Error al obtener marca:", error);
    throw error;
  }

  return data as Marca;
}

/**
 * Crear una nueva marca
 */
export async function crearMarca(data: {
  nombre: string;
  descripcion?: string;
  pais_origen?: string;
  sitio_web?: string;
}) {
  // Limpiar y validar datos
  const marcaData = {
    nombre: data.nombre.trim(),
    descripcion: data.descripcion?.trim() || null,
    pais_origen: data.pais_origen?.trim() || null,
    sitio_web: data.sitio_web?.trim() || null,
    activo: true
  };

  const { data: marca, error } = await supabase
    .from("marcas")
    .insert([marcaData])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al crear marca:", error);
    // Manejar error de duplicado
    if (error.code === '23505') {
      throw new Error('Ya existe una marca con ese nombre');
    }
    throw error;
  }

  console.log("✅ Marca creada:", marca);
  return marca as Marca;
}

/**
 * Actualizar una marca
 */
export async function actualizarMarca(id: string, data: Partial<Marca>) {
  const { data: marca, error } = await supabase
    .from("marcas")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar marca:", error);
    if (error.code === '23505') {
      throw new Error('Ya existe una marca con ese nombre');
    }
    throw error;
  }

  console.log("✅ Marca actualizada");
  return marca as Marca;
}

/**
 * Eliminar (desactivar) una marca
 */
export async function desactivarMarca(id: string) {
  const { data, error } = await supabase
    .from("marcas")
    .update({ activo: false })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al desactivar marca:", error);
    throw error;
  }

  console.log("✅ Marca desactivada");
  return data as Marca;
}

/**
 * Buscar marcas por nombre
 */
export async function buscarMarcas(termino: string) {
  const { data, error } = await supabase
    .from("marcas")
    .select("*")
    .eq("activo", true)
    .ilike("nombre", `%${termino}%`)
    .order("nombre", { ascending: true })
    .limit(10);

  if (error) {
    console.error("❌ Error al buscar marcas:", error);
    throw error;
  }

  return data as Marca[];
}
