
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  console.log(`🔍 Buscando orden por ID ${id}...`);

  const { data, error } = await supabaseAdmin
    .from('ordenes')
    .select('id, codigo, fotos_recepcion, fotos_diagnostico')
    .eq('id', id)
    .single();

  return NextResponse.json({ 
    busqueda: id,
    encontrada: !!data,
    datos: data, 
    error: error ? error.message : null 
  });
}
