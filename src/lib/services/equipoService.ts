import { supabase } from "@/lib/supabaseClient";

/**
 * Obtener todos los equipos con sus relaciones
 */
export async function obtenerTodosLosEquipos() {
  const { data, error } = await supabase
    .from("equipos")
    .select(`
      *,
      modelo:modelos(*),
      cliente:clientes(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener equipos:", error);
    throw error;
  }

  return data;
}

/**
 * Obtener un equipo por ID con su última orden
 */
export async function obtenerEquipoPorId(id: string) {
  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .select(`
      *,
      modelo:modelos(*),
      cliente:clientes(*)
    `)
    .eq("id", id)
    .single();

  if (equipoError) {
    console.error("❌ Error al obtener equipo:", equipoError);
    throw equipoError;
  }

  // Obtener la última orden de este equipo
  const { data: ultimaOrden, error: ordenError } = await supabase
    .from("ordenes")
    .select("*")
    .eq("equipo_id", id)
    .order("fecha_creacion", { ascending: false })
    .limit(1)
    .single();

  return {
    equipo,
    ultimaOrden: ordenError ? null : ultimaOrden
  };
}

/**
 * Buscar equipos por término (cliente o equipo)
 */
export async function buscarEquipos(termino: string) {
  const term = (termino || '').toLowerCase().trim();
  if (!term) return await obtenerTodosLosEquipos();
  const equipos = await obtenerTodosLosEquipos();
  return (equipos || []).filter((e: any) => {
    const parts = [
      e?.serie_pieza,
      e?.modelo?.equipo,
      e?.modelo?.marca,
      e?.cliente?.identificacion,
      e?.cliente?.razon_social,
      e?.cliente?.nombre_comercial,
    ]
      .filter(Boolean)
      .map((s: string) => s.toLowerCase());
    return parts.some((p: string) => p.includes(term));
  });
}

/**
 * Crear un nuevo equipo
 */
export async function crearEquipo(data: {
  modelo_id?: string;
  cliente_id?: string;
  serie_pieza?: string;
  fecha_compra?: string;
  descripcion?: string;
  soporte_garantia?: string;
  archivo_soporte?: string;
  estado?: string;
  comentarios?: string;
}) {
  // Limpiar datos: convertir strings vacíos a null para foreign keys
  const equipoData = {
    ...data,
    modelo_id: data.modelo_id && data.modelo_id.trim() !== '' ? data.modelo_id : null,
    cliente_id: data.cliente_id && data.cliente_id.trim() !== '' ? data.cliente_id : null,
    fecha_compra: data.fecha_compra && data.fecha_compra.trim() !== '' ? data.fecha_compra : null,
    estado: data.estado || 'Habilitado'
  };

  const { data: equipo, error } = await supabase
    .from("equipos")
    .insert([equipoData])
    .select(`
      *,
      modelo:modelos(*),
      cliente:clientes(*)
    `)
    .single();

  if (error) {
    console.error("❌ Error al crear equipo:", error);
    throw error;
  }

  console.log("✅ Equipo creado:", equipo);
  return equipo;
}

/**
 * Actualizar un equipo
 */
export async function actualizarEquipo(id: string, data: any) {
  const { data: equipo, error } = await supabase
    .from("equipos")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al actualizar equipo:", error);
    throw error;
  }

  console.log("✅ Equipo actualizado");
  return equipo;
}

/**
 * Desactivar (eliminar lógico) equipo
 */
export async function desactivarEquipo(id: string) {
  const { data, error } = await supabase
    .from("equipos")
    .update({ estado: 'Deshabilitado' })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al desactivar equipo:", error);
    throw error;
  }

  console.log("✅ Equipo desactivado");
  return data;
}
