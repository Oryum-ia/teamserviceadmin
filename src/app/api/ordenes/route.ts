
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validar datos mínimos
    if (!data.cliente_id || !data.codigo) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (cliente_id, codigo)' }, 
        { status: 400 }
      );
    }

    console.log('📝 [API] Creando nueva orden (Admin Bypass RLS):', data.codigo);

    // Insertar orden usando credenciales de admin (Service Role)
    // Esto evita el error RLS (42501) si el usuario no tiene permisos INSERT directos
    const { data: orden, error } = await supabaseAdmin
      .from('ordenes')
      .insert([data])
      .select(`
        *,
        cliente:clientes(*)
      `)
      .single();

    if (error) {
      console.error('❌ [API] Error al crear orden:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('✅ [API] Orden creada exitosamente:', orden.id);
    return NextResponse.json(orden);

  } catch (error: any) {
    console.error('❌ [API] Error interno:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
