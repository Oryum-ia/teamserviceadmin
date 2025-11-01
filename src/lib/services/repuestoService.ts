import { supabase } from "@/lib/supabaseClient";

/**
 * Obtener todos los repuestos
 */
export async function obtenerTodosLosRepuestos() {
  const { data, error } = await supabase
    .from("repuestos")
    .select("*")
    .order("descripcion", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener repuestos:", error);
    throw error;
  }

  return data;
}

/**
 * Crear un nuevo repuesto
 */
export async function crearRepuesto(data: {
  codigo?: string;
  descripcion?: string;
  cantidad?: number;
  causante?: string;
  escrito?: string;
}) {
  const { data: repuesto, error } = await supabase
    .from("repuestos")
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al crear repuesto:", error);
    throw error;
  }

  console.log("✅ Repuesto creado:", repuesto);
  return repuesto;
}

/**
 * Obtener repuestos de un modelo
 */
export async function obtenerRepuestosDelModelo(modeloId: string) {
  const { data, error } = await supabase
    .from("modelos_repuestos")
    .select(`
      repuesto:repuestos(*)
    `)
    .eq("modelo_id", modeloId);

  if (error) {
    console.error("❌ Error al obtener repuestos del modelo:", error);
    throw error;
  }

  return data?.map(item => item.repuesto) || [];
}

/**
 * Asignar repuestos a un modelo
 */
export async function asignarRepuestosAModelo(modeloId: string, repuestoIds: string[]) {
  // Primero eliminar las relaciones existentes
  const { error: deleteError } = await supabase
    .from("modelos_repuestos")
    .delete()
    .eq("modelo_id", modeloId);

  if (deleteError) {
    console.error("❌ Error al eliminar relaciones existentes:", deleteError);
    throw deleteError;
  }

  // Si no hay repuestos, retornar
  if (repuestoIds.length === 0) {
    return [];
  }

  // Crear nuevas relaciones
  const relaciones = repuestoIds.map(repuestoId => ({
    modelo_id: modeloId,
    repuesto_id: repuestoId
  }));

  const { data, error } = await supabase
    .from("modelos_repuestos")
    .insert(relaciones)
    .select();

  if (error) {
    console.error("❌ Error al asignar repuestos:", error);
    throw error;
  }

  console.log("✅ Repuestos asignados al modelo");
  return data;
}

/**
 * Actualizar un repuesto
 */
export async function actualizarRepuesto(id: string, data: Partial<{
  codigo?: string;
  descripcion?: string;
  cantidad?: number;
  causante?: string;
  escrito?: string;
}>) {
  const { data: repuesto, error } = await supabase
    .from("repuestos")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar repuesto:", error);
    throw error;
  }

  console.log("✅ Repuesto actualizado");
  return repuesto;
}

/**
 * Eliminar un repuesto
 */
export async function eliminarRepuesto(id: string) {
  const { error } = await supabase
    .from("repuestos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Error al eliminar repuesto:", error);
    throw error;
  }

  console.log("✅ Repuesto eliminado");
  return true;
}

/**
 * Guardar repuestos de diagnóstico en una orden
 */
export async function guardarRepuestosDiagnostico(
  ordenId: string,
  repuestos: Array<{
    codigo: string;
    descripcion: string;
    cantidad: number;
    pieza_causante?: string;
  }>
) {
  const { error } = await supabase
    .from("ordenes")
    .update({
      repuestos_diagnostico: repuestos,
      ultima_actualizacion: new Date().toISOString()
    })
    .eq("id", ordenId);

  if (error) {
    console.error("❌ Error al guardar repuestos de diagnóstico:", error);
    throw error;
  }

  console.log("✅ Repuestos de diagnóstico guardados");
  return true;
}

/**
 * Obtener repuestos de diagnóstico de una orden
 */
export async function obtenerRepuestosDiagnostico(ordenId: string) {
  const { data, error } = await supabase
    .from("ordenes")
    .select("repuestos_diagnostico")
    .eq("id", ordenId)
    .single();

  if (error) {
    console.error("❌ Error al obtener repuestos de diagnóstico:", error);
    throw error;
  }

  return data?.repuestos_diagnostico || [];
}

/**
 * Guardar repuestos de cotización en una orden
 */
export async function guardarRepuestosCotizacion(
  ordenId: string,
  repuestos: Array<{
    codigo: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    iva: number;
    en_stock: boolean;
  }>
) {
  const { error } = await supabase
    .from("ordenes")
    .update({
      repuestos_cotizacion: repuestos,
      ultima_actualizacion: new Date().toISOString()
    })
    .eq("id", ordenId);

  if (error) {
    console.error("❌ Error al guardar repuestos de cotización:", error);
    throw error;
  }

  console.log("✅ Repuestos de cotización guardados");
  return true;
}

/**
 * Obtener repuestos de cotización de una orden
 */
export async function obtenerRepuestosCotizacion(ordenId: string) {
  const { data, error } = await supabase
    .from("ordenes")
    .select("repuestos_cotizacion")
    .eq("id", ordenId)
    .single();

  if (error) {
    console.error("❌ Error al obtener repuestos de cotización:", error);
    throw error;
  }

  return data?.repuestos_cotizacion || [];
}
