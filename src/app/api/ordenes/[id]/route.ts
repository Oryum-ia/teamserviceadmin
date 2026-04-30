import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

const CLIENT_RESPONSE_MUTABLE_FIELDS = new Set([
  'aprobado_cliente',
  'fecha_aprobacion',
  'terminos_aceptados',
  'fecha_aceptacion_terminos',
  'firma_cliente',
  'fecha_firma_cliente',
  'firma_entrega',
  'fecha_firma_entrega',
  'calificacion',
  'comentarios_cliente',
  'estado_actual',
  'ultima_actualizacion',
  'updated_at',
]);

const CLIENT_RESPONSE_SIGNAL_FIELDS = new Set([
  'aprobado_cliente',
  'terminos_aceptados',
  'fecha_aceptacion_terminos',
  'firma_cliente',
  'fecha_firma_cliente',
  'firma_entrega',
  'fecha_firma_entrega',
  'calificacion',
  'comentarios_cliente',
]);

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error desconocido';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeClientResponseUpdates(updates: Record<string, unknown>) {
  const isClientResponseUpdate = Object.keys(updates).some((field) =>
    CLIENT_RESPONSE_SIGNAL_FIELDS.has(field)
  );

  if (!isClientResponseUpdate) {
    return updates;
  }

  return Object.fromEntries(
    Object.entries(updates).filter(([field]) => CLIENT_RESPONSE_MUTABLE_FIELDS.has(field))
  );
}

/**
 * GET - Obtener una orden por ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('🔍 [API] Obteniendo orden:', id);

    const { data: orden, error } = await supabaseAdmin
      .from('ordenes')
      .select(`
        *,
        cliente:clientes(*),
        equipo:equipos(
          *,
          modelo:modelos(
            *,
            marca:marcas(*)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [API] Error al obtener orden:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return NextResponse.json(orden);

  } catch (error: unknown) {
    console.error('❌ [API] Error interno:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PATCH - Actualizar una orden por ID (Bypass RLS)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();

    if (!isRecord(updates)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const safeUpdates = sanitizeClientResponseUpdates(updates);

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'No hay campos permitidos para actualizar' }, { status: 400 });
    }

    console.log('📝 [API] Actualizando orden:', id, 'con campos:', Object.keys(safeUpdates));

    // Actualizar usando credenciales de admin (Service Role) para bypass RLS
    const { data: orden, error } = await supabaseAdmin
      .from('ordenes')
      .update(safeUpdates)
      .eq('id', id)
      .select(`
        *,
        cliente:clientes(*),
        equipo:equipos(
          *,
          modelo:modelos(
            *,
            marca:marcas(*)
          )
        )
      `)
      .single();

    if (error) {
      console.error('❌ [API] Error al actualizar orden:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada o no se pudo actualizar' }, { status: 404 });
    }

    console.log('✅ [API] Orden actualizada exitosamente:', orden.id);
    return NextResponse.json(orden);

  } catch (error: unknown) {
    console.error('❌ [API] Error interno:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: getErrorMessage(error) }, { status: 500 });
  }
}

/**
 * DELETE - Eliminar una orden por ID (Solo super-admin)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('🗑️ [API] Eliminando orden:', id);

    // Eliminar usando credenciales de admin
    const { error } = await supabaseAdmin
      .from('ordenes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [API] Error al eliminar orden:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ [API] Orden eliminada exitosamente:', id);
    return NextResponse.json({ success: true, message: 'Orden eliminada' });

  } catch (error: unknown) {
    console.error('❌ [API] Error interno:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
