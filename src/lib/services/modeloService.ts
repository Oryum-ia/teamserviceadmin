import { supabase } from "@/lib/supabaseClient";

/**
 * Obtener todos los modelos con sus marcas
 */
export async function obtenerTodosLosModelos() {
  const { data, error } = await supabase
    .from("modelos")
    .select(`
      *,
      marca:marcas(*)
    `)
    .order("equipo", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener modelos:", error);
    throw error;
  }

  return data;
}

/**
 * Crear un nuevo modelo
 */
export async function crearModelo(data: {
  equipo: string;
  marca_id?: string;
  marca?: string;  // Mantener por compatibilidad con datos antiguos
  referencia?: string;
  valor_revision?: number;
  cuidado_uso?: string;
}) {
  // Limpiar datos: convertir strings vacíos a null para foreign keys
  const modeloData = {
    equipo: data.equipo,
    marca_id: data.marca_id && data.marca_id.trim() !== '' ? data.marca_id : null,
    marca: data.marca || null,  // Mantener por compatibilidad
    referencia: data.referencia || null,
    valor_revision: data.valor_revision || 0,
    cuidado_uso: data.cuidado_uso || null
  };

  const { data: modelo, error } = await supabase
    .from("modelos")
    .insert([modeloData])
    .select(`
      *,
      marca:marcas(*)
    `)
    .single();

  if (error) {
    console.error("❌ Error al crear modelo:", error);
    throw error;
  }

  console.log("✅ Modelo creado:", modelo);
  return modelo;
}

/**
 * Actualizar un modelo
 */
export async function actualizarModelo(id: string, data: Partial<{
  equipo: string;
  marca_id?: string;
  marca?: string;
  referencia?: string;
  valor_revision?: number;
  cuidado_uso?: string;
}>) {
  const { data: modelo, error } = await supabase
    .from("modelos")
    .update(data)
    .eq("id", id)
    .select(`
      *,
      marca:marcas(*)
    `)
    .single();

  if (error) {
    console.error("❌ Error al actualizar modelo:", error);
    throw error;
  }

  console.log("✅ Modelo actualizado");
  return modelo;
}

/**
 * Eliminar (desactivar) un modelo
 */
export async function eliminarModelo(id: string) {
  const { error } = await supabase
    .from("modelos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Error al eliminar modelo:", error);
    throw error;
  }

  console.log("✅ Modelo eliminado");
  return true;
}
