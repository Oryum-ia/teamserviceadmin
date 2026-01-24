
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ordenId = params.id;
    const body = await request.json();
    const { tipo, fotos } = body; // tipo: 'recepcion', 'diagnostico', 'reparacion', 'entrega'

    if (!ordenId || !tipo || !Array.isArray(fotos)) {
      return NextResponse.json({ error: 'Datos inválidos: se requiere ordenId, tipo y array de fotos' }, { status: 400 });
    }

    // Mapear tipo a columna DB
    const columnasPermitidas: Record<string, string> = {
      'recepcion': 'fotos_recepcion',
      'diagnostico': 'fotos_diagnostico',
      'reparacion': 'fotos_reparacion',
      'entrega': 'fotos_entrega'
    };

    const campoDB = columnasPermitidas[tipo];

    if (!campoDB) {
      return NextResponse.json({ error: 'Tipo de foto inválido' }, { status: 400 });
    }

    console.log(`📝 [API Fotos] Actualizando ${campoDB} para orden ${ordenId} (Bypass RLS)`);

    const { error } = await supabaseAdmin
      .from('ordenes')
      .update({
        [campoDB]: fotos,
        updated_at: new Date().toISOString()
      })
      .eq('id', ordenId);

    if (error) {
      console.error(`❌ [API Fotos] Error al actualizar BD:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Fotos actualizadas correctamente' });

  } catch (error: any) {
    console.error('❌ [API Fotos] Error interno:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
