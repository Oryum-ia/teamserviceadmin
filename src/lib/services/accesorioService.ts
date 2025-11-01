import { supabase } from "@/lib/supabaseClient";

/**
 * Obtener todos los accesorios
 */
export async function obtenerTodosLosAccesorios() {
  const { data, error } = await supabase
    .from("accesorios")
    .select("*")
    .order("descripcion", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener accesorios:", error);
    throw error;
  }

  return data;
}

/**
 * Crear un nuevo accesorio
 */
export async function crearAccesorio(data: {
  descripcion: string;
  marca?: string;
}) {
  const { data: accesorio, error } = await supabase
    .from("accesorios")
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al crear accesorio:", error);
    throw error;
  }

  console.log("✅ Accesorio creado:", accesorio);
  return accesorio;
}

/**
 * Obtener accesorios de un modelo
 */
export async function obtenerAccesoriosDelModelo(modeloId: string) {
  const { data, error } = await supabase
    .from("modelos_accesorios")
    .select(`
      accesorio:accesorios(*)
    `)
    .eq("modelo_id", modeloId);

  if (error) {
    console.error("❌ Error al obtener accesorios del modelo:", error);
    throw error;
  }

  return data?.map(item => item.accesorio) || [];
}

/**
 * Asignar accesorios a un modelo
 */
export async function asignarAccesoriosAModelo(modeloId: string, accesorioIds: string[]) {
  // Primero eliminar las relaciones existentes
  const { error: deleteError } = await supabase
    .from("modelos_accesorios")
    .delete()
    .eq("modelo_id", modeloId);

  if (deleteError) {
    console.error("❌ Error al eliminar relaciones existentes:", deleteError);
    throw deleteError;
  }

  // Si no hay accesorios, retornar
  if (accesorioIds.length === 0) {
    return [];
  }

  // Crear nuevas relaciones
  const relaciones = accesorioIds.map(accesorioId => ({
    modelo_id: modeloId,
    accesorio_id: accesorioId
  }));

  const { data, error } = await supabase
    .from("modelos_accesorios")
    .insert(relaciones)
    .select();

  if (error) {
    console.error("❌ Error al asignar accesorios:", error);
    throw error;
  }

  console.log("✅ Accesorios asignados al modelo");
  return data;
}

/**
 * Actualizar un accesorio
 */
export async function actualizarAccesorio(id: string, data: Partial<{
  descripcion: string;
  marca?: string;
}>) {
  const { data: accesorio, error } = await supabase
    .from("accesorios")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar accesorio:", error);
    throw error;
  }

  console.log("✅ Accesorio actualizado");
  return accesorio;
}

/**
 * Eliminar un accesorio
 */
export async function eliminarAccesorio(id: string) {
  const { error } = await supabase
    .from("accesorios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Error al eliminar accesorio:", error);
    throw error;
  }

  console.log("✅ Accesorio eliminado");
  return true;
}
