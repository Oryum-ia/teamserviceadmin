import { supabase } from "@/lib/supabaseClient";
import { Comentario } from "@/types/database.types";
import { crearTimestampColombia } from "@/lib/utils/dateUtils";

/**
 * Obtener todos los comentarios con información de usuario y orden
 */
export async function obtenerTodosLosComentarios() {
  const { data, error } = await supabase
    .from("comentarios")
    .select(`
      *,
      usuarios!comentarios_usuario_id_fkey(id, email, nombre),
      ordenes!comentarios_orden_id_fkey(id, codigo)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener comentarios:", error);
    throw error;
  }

  // Transformar la respuesta para que coincida con la interfaz esperada
  const transformedData = data?.map((item: any) => ({
    ...item,
    usuario: item.usuarios,
    orden: item.ordenes ? {
      id: item.ordenes.id,
      numero_orden: item.ordenes.codigo // Mapear codigo a numero_orden
    } : null
  }));

  return transformedData || [];
}

/**
 * Buscar comentarios por texto
 */
export async function buscarComentarios(query: string) {
  const { data, error } = await supabase
    .from("comentarios")
    .select(`
      *,
      usuarios!comentarios_usuario_id_fkey(id, email, nombre),
      ordenes!comentarios_orden_id_fkey(id, codigo)
    `)
    .ilike("comentario", `%${query}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al buscar comentarios:", error);
    throw error;
  }

  // Transformar la respuesta
  const transformedData = data?.map((item: any) => ({
    ...item,
    usuario: item.usuarios,
    orden: item.ordenes ? {
      id: item.ordenes.id,
      numero_orden: item.ordenes.codigo // Mapear codigo a numero_orden
    } : null
  }));

  return transformedData || [];
}

/**
 * Crear un comentario de retroceso de fase
 */
export async function crearComentarioRetroceso(data: {
  orden_id: string;
  estado_anterior: string;
  estado_nuevo: string;
  comentario: string;
}) {
  // Obtener usuario actual
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  const comentarioData = {
    orden_id: data.orden_id,
    estado_anterior: data.estado_anterior,
    estado_nuevo: data.estado_nuevo,
    comentario: data.comentario,
    usuario_id: userId || null,
    created_at: crearTimestampColombia()
  };

  const { data: comentario, error } = await supabase
    .from("comentarios")
    .insert([comentarioData])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al crear comentario de retroceso:", error);
    throw error;
  }

  console.log("✅ Comentario de retroceso creado");
  return comentario;
}

/**
 * Crear un nuevo comentario
 */
export async function crearComentario(data: {
  orden_id: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  comentario: string;
}) {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  const comentarioData = {
    orden_id: data.orden_id,
    estado_anterior: data.estado_anterior || null,
    estado_nuevo: data.estado_nuevo || null,
    comentario: data.comentario,
    usuario_id: userId || null
  };

  const { data: comentario, error } = await supabase
    .from("comentarios")
    .insert([comentarioData])
    .select(`
      *,
      usuarios!comentarios_usuario_id_fkey(id, email, nombre),
      ordenes!comentarios_orden_id_fkey(id, codigo)
    `)
    .single();

  if (error) {
    console.error("❌ Error al crear comentario:", error);
    throw error;
  }

  console.log("✅ Comentario creado");
  return comentario;
}

/**
 * Actualizar un comentario
 */
export async function actualizarComentario(id: string, data: {
  comentario?: string;
  estado_anterior?: string;
  estado_nuevo?: string;
}) {
  const { data: comentario, error } = await supabase
    .from("comentarios")
    .update(data)
    .eq("id", id)
    .select(`
      *,
      usuarios!comentarios_usuario_id_fkey(id, email, nombre),
      ordenes!comentarios_orden_id_fkey(id, codigo)
    `)
    .single();

  if (error) {
    console.error("❌ Error al actualizar comentario:", error);
    throw error;
  }

  console.log("✅ Comentario actualizado");
  return comentario;
}

/**
 * Eliminar un comentario
 */
export async function eliminarComentario(id: string) {
  const { error } = await supabase
    .from("comentarios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Error al eliminar comentario:", error);
    throw error;
  }

  console.log("✅ Comentario eliminado");
  return true;
}

/**
 * Obtener comentarios de una orden
 */
export async function obtenerComentariosPorOrden(ordenId: string) {
  const { data, error } = await supabase
    .from("comentarios")
    .select(`
      *,
      usuario:usuarios(id, email, nombre)
    `)
    .eq("orden_id", ordenId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener comentarios:", error);
    throw error;
  }

  return data || [];
}

/**
 * Retroceder una fase con comentario
 */
export async function retrocederFaseConComentario(
  ordenId: string,
  estadoActual: string,
  estadoNuevo: string,
  comentario: string
) {
  // Crear el comentario de retroceso
  await crearComentarioRetroceso({
    orden_id: ordenId,
    estado_anterior: estadoActual,
    estado_nuevo: estadoNuevo,
    comentario
  });

  // Actualizar la orden a la fase anterior
  const { error } = await supabase
    .from("ordenes")
    .update({
      estado_actual: estadoNuevo,
      updated_at: crearTimestampColombia()
    })
    .eq("id", ordenId);

  if (error) {
    console.error("❌ Error al retroceder fase:", error);
    throw error;
  }

  console.log("✅ Fase retrocedida exitosamente");
  return true;
}
