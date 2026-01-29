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
  cantidad?: string | number;
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
  cantidad?: string | number;
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
    cantidad: string | number;
    pieza_causante?: string;
  }>
) {
  const { error } = await supabase
    .from("ordenes")
    .update({
      repuestos_diagnostico: repuestos,
      ultima_actualizacion: new Date().toISOString()
    })
    .eq("id", Number(ordenId));

  if (error) {
    console.error("❌ Error al guardar repuestos de diagnóstico:", error);
    throw error;
  }

  console.log("✅ Repuestos de diagnóstico guardados");
  return true;
}

/**
 * Obtener repuestos de diagnóstico de una orden
 * Returns empty array if not found or error
 */
export async function obtenerRepuestosDiagnostico(ordenId: string) {
  try {
    const { data, error } = await supabase
      .from("ordenes")
      .select("repuestos_diagnostico")
      .eq("id", Number(ordenId))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log("ℹ️ Orden no encontrada para repuestos de diagnóstico");
        return [];
      }
      console.error("❌ Error al obtener repuestos de diagnóstico:", error);
      return [];
    }

    return data?.repuestos_diagnostico || [];
  } catch (err) {
    console.error("❌ Error inesperado al obtener repuestos de diagnóstico:", err);
    return [];
  }
}

/**
 * Guardar repuestos de cotización en una orden
 * Returns true on success, false on error
 */
export async function guardarRepuestosCotizacion(
  ordenId: string,
  repuestos: Array<{
    codigo: string;
    descripcion: string;
    cantidad: string | number;
    precio_unitario: number;
    descuento: number;
    iva: number;
    en_stock: boolean;
  }>,
  totales?: {
    subtotal: number;
    iva: number;
    total: number;
    valor_revision?: number;
  }
): Promise<boolean> {
  try {
    // Validar que ordenId sea válido
    if (!ordenId || ordenId === 'undefined' || ordenId === 'null') {
      console.error("❌ ordenId inválido:", ordenId);
      return false;
    }

    // Convertir a número y validar
    const ordenIdNum = Number(ordenId);
    if (isNaN(ordenIdNum)) {
      console.error("❌ ordenId no es un número válido:", ordenId);
      return false;
    }

    // Construir el objeto a guardar
    const dataToSave: any = {
      repuestos: repuestos,
      ultima_actualizacion: new Date().toISOString()
    };

    // Si se proporcionan totales, incluirlos en el JSON
    if (totales) {
      dataToSave.subtotal = totales.subtotal;
      dataToSave.iva = totales.iva;
      dataToSave.total = totales.total;
      if (totales.valor_revision !== undefined) {
        dataToSave.valor_revision = totales.valor_revision;
      }
    }

    const { error } = await supabase
      .from("ordenes")
      .update({
        repuestos_cotizacion: dataToSave,
        ultima_actualizacion: new Date().toISOString()
      })
      .eq("id", ordenIdNum);

    if (error) {
      console.error("❌ Error al guardar repuestos de cotización:", error);
      return false;
    }

    console.log("✅ Repuestos de cotización guardados con totales:", totales);
    return true;
  } catch (err) {
    console.error("❌ Error inesperado al guardar repuestos de cotización:", err);
    return false;
  }
}

/**
 * Obtener repuestos de cotización de una orden
 * Returns empty array if not found or error
 */
export async function obtenerRepuestosCotizacion(ordenId: string) {
  try {
    const { data, error } = await supabase
      .from("ordenes")
      .select("repuestos_cotizacion")
      .eq("id", Number(ordenId))
      .single();

    if (error) {
      // Si es un error de "no encontrado", retornar array vacío
      if (error.code === 'PGRST116') {
        console.log("ℹ️ Orden no encontrada para repuestos de cotización");
        return [];
      }
      console.error("❌ Error al obtener repuestos de cotización:", error);
      return []; // Retornar vacío en lugar de lanzar error
    }

    const cotizacionData = data?.repuestos_cotizacion;
    
    // Si es el nuevo formato (objeto con repuestos y totales)
    if (cotizacionData && typeof cotizacionData === 'object' && 'repuestos' in cotizacionData) {
      return cotizacionData.repuestos || [];
    }
    
    // Si es el formato antiguo (array directo)
    return cotizacionData || [];
  } catch (err) {
    console.error("❌ Error inesperado al obtener repuestos de cotización:", err);
    return []; // Retornar vacío para evitar que el componente se rompa
  }
}
