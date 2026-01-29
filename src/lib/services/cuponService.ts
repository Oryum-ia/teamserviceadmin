import { supabase } from "@/lib/supabaseClient";
import { Cupon } from "@/types/database.types";
import { crearTimestampColombia } from "@/lib/utils/dateUtils";

/**
 * Crear un nuevo cupón de descuento
 */
export async function crearCupon(data: Partial<Omit<Cupon, 'id' | 'created_at' | 'updated_at'>>) {
  const { data: cupon, error } = await supabase
    .from("cupones")
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al crear cupón:", error);
    throw error;
  }

  console.log("✅ Cupón creado:", cupon);
  return cupon as Cupon;
}

/**
 * Obtener todos los cupones ordenados por fecha de creación
 */
export async function obtenerTodosLosCupones() {
  const { data, error } = await supabase
    .from("cupones")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener cupones:", error);
    throw error;
  }

  return data as Cupon[];
}

/**
 * Buscar cupones por código
 */
export async function buscarCupones(termino: string) {
  const { data, error } = await supabase
    .from("cupones")
    .select("*")
    .ilike("codigo", `%${termino}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al buscar cupones:", error);
    throw error;
  }

  return data as Cupon[];
}

/**
 * Obtener un cupón por su ID
 */
export async function obtenerCuponPorId(id: string) {
  const { data, error } = await supabase
    .from("cupones")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ Error al obtener cupón:", error);
    throw error;
  }

  return data as Cupon;
}

/**
 * Obtener un cupón por su código (requiere autenticación - uso admin)
 */
export async function obtenerCuponPorCodigo(codigo: string) {
  const { data, error } = await supabase
    .from("cupones")
    .select("*")
    .eq("codigo", codigo)
    .single();

  if (error) {
    console.error("❌ Error al obtener cupón:", error);
    throw error;
  }

  return data as Cupon;
}

/**
 * Validar cupón públicamente (sin autenticación - uso público)
 * Solo retorna cupones activos y no usados
 */
export async function validarCuponPublico(codigo: string) {
  const { data, error } = await supabase
    .from("cupones")
    .select("*")
    .eq("codigo", codigo)
    .eq("activo", true)
    .eq("usado", false)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No se encontró el cupón o no cumple las condiciones
      return null;
    }
    console.error("❌ Error al validar cupón público:", error);
    throw error;
  }

  return data as Cupon;
}

/**
 * Actualizar un cupón existente
 */
export async function actualizarCupon(id: string, data: Partial<Omit<Cupon, 'id' | 'created_at' | 'updated_at'>>) {
  const { data: cupon, error } = await supabase
    .from("cupones")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar cupón:", error);
    throw error;
  }

  console.log("✅ Cupón actualizado:", cupon);
  return cupon as Cupon;
}

/**
 * Eliminar un cupón
 */
export async function eliminarCupon(id: string) {
  const { error } = await supabase
    .from("cupones")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Error al eliminar cupón:", error);
    throw error;
  }

  console.log("✅ Cupón eliminado");
  return true;
}

/**
 * Activar o desactivar un cupón
 */
export async function toggleActivoCupon(id: string, activo: boolean) {
  const { data: cupon, error } = await supabase
    .from("cupones")
    .update({ activo })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar estado del cupón:", error);
    throw error;
  }

  console.log("✅ Estado del cupón actualizado:", cupon);
  return cupon as Cupon;
}

/**
 * Marcar un cupón como usado
 */
export async function marcarCuponComoUsado(id: string) {
  const { data: cupon, error } = await supabase
    .from("cupones")
    .update({ 
      usado: true,
      fecha_uso: crearTimestampColombia()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al marcar cupón como usado:", error);
    throw error;
  }

  console.log("✅ Cupón marcado como usado:", cupon);
  return cupon as Cupon;
}

/**
 * Validar si un cupón es válido para usar
 */
export async function validarCupon(codigo: string): Promise<{ valido: boolean; cupon?: Cupon; mensaje?: string }> {
  try {
    const cupon = await obtenerCuponPorCodigo(codigo);
    
    if (!cupon.activo) {
      return { valido: false, mensaje: "El cupón no está activo" };
    }
    
    if (cupon.usado) {
      return { valido: false, mensaje: "El cupón ya ha sido usado" };
    }
    
    return { valido: true, cupon };
  } catch (error) {
    return { valido: false, mensaje: "Cupón no encontrado" };
  }
}
