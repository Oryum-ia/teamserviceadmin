
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  // Traer una orden cualquiera para ver las columnas
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .limit(1)
    .single();

  return NextResponse.json({ 
    keys: data ? Object.keys(data) : [],
    sample: data,
    error 
  });
}
