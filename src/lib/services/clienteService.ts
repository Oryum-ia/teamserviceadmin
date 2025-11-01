import { supabase } from "@/lib/supabaseClient";
import { Cliente } from "@/types/database.types";

/**
 * Crear un nuevo cliente (persona natural o jurídica)
 */
export async function crearCliente(data: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) {
  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al crear cliente:", error);
    throw error;
  }

  console.log("✅ Cliente creado:", cliente);
  return cliente as Cliente;
}

/**
 * Obtener todos los clientes ordenados por fecha de creación
 */
export async function obtenerTodosLosClientes() {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener clientes:", error);
    throw error;
  }

  return data as Cliente[];
}

/**
 * Buscar clientes por identificación o nombre
 */
export async function buscarClientes(termino: string) {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .or(`identificacion.ilike.%${termino}%,razon_social.ilike.%${termino}%,nombre_comercial.ilike.%${termino}%,correo_electronico.ilike.%${termino}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al buscar clientes:", error);
    throw error;
  }

  return data as Cliente[];
}

/**
 * Obtener un cliente por su ID
 */
export async function obtenerClientePorId(id: string) {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ Error al obtener cliente:", error);
    throw error;
  }

  return data as Cliente;
}

/**
 * Obtener un cliente por su identificación
 */
export async function obtenerClientePorIdentificacion(identificacion: string) {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("identificacion", identificacion)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No se encontró el cliente
      return null;
    }
    console.error("❌ Error al obtener cliente:", error);
    throw error;
  }

  return data as Cliente;
}

/**
 * Actualizar un cliente existente
 */
export async function actualizarCliente(id: string, data: Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>>) {
  const { data: cliente, error } = await supabase
    .from("clientes")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar cliente:", error);
    throw error;
  }

  console.log("✅ Cliente actualizado:", cliente);
  return cliente as Cliente;
}

/**
 * Eliminar un cliente (soft delete - marcar como inactivo si es necesario)
 */
export async function eliminarCliente(id: string) {
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Error al eliminar cliente:", error);
    throw error;
  }

  console.log("✅ Cliente eliminado");
  return true;
}

/**
 * Obtener el historial de órdenes de un cliente
 */
export async function obtenerOrdenesCliente(clienteId: string) {
  const { data, error } = await supabase
    .from("ordenes")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener órdenes del cliente:", error);
    throw error;
  }

  return data;
}

/**
 * Obtener estadísticas de un cliente
 */
export async function obtenerEstadisticasCliente(clienteId: string) {
  const { data: ordenes, error } = await supabase
    .from("ordenes")
    .select("estado, fase_actual, created_at")
    .eq("cliente_id", clienteId);

  if (error) {
    console.error("❌ Error al obtener estadísticas del cliente:", error);
    throw error;
  }

  return {
    total_ordenes: ordenes?.length || 0,
    ordenes_activas: ordenes?.filter(o => o.estado !== 'completada' && o.estado !== 'cancelada').length || 0,
    ordenes_completadas: ordenes?.filter(o => o.estado === 'completada').length || 0,
    ultima_orden: ordenes?.[0]?.created_at || null,
  };
}
