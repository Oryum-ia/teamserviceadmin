import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  // Obtener cliente en runtime
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Configuración del servidor incompleta. Faltan variables de entorno.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { codigo } = body;

    if (!codigo || typeof codigo !== 'string') {
      return NextResponse.json(
        { error: 'Código de cupón requerido' },
        { status: 400 }
      );
    }

    // Validar cupón públicamente (sin autenticación)
    // Solo retorna cupones activos y no usados
    const { data, error } = await supabase
      .from('cupones')
      .select('*')
      .eq('codigo', codigo.trim().toUpperCase())
      .eq('activo', true)
      .eq('usado', false)
      .maybeSingle();

    if (error) {
      console.error('❌ Error al validar cupón:', error);
      return NextResponse.json(
        { error: 'Error al validar el cupón' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Cupón no válido o ya usado' 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        cupon: {
          codigo: data.codigo,
          porcentaje_descuento: data.porcentaje_descuento,
          id: data.id
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error en API validate-coupon:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// Permitir CORS para peticiones desde otros dominios
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
