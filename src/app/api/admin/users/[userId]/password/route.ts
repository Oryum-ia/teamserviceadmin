import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * API Route para cambiar contraseña de un usuario
 * POST /api/admin/users/[userId]/password
 * Solo accesible por administradores
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { password } = body;

    // Validaciones
    if (!userId) {
      return NextResponse.json(
        { error: 'El ID de usuario es requerido' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'La contraseña es requerida' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Actualizar contraseña usando Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (error) {
      console.error('❌ Error al actualizar contraseña:', error);
      return NextResponse.json(
        { error: error.message || 'Error al actualizar la contraseña' },
        { status: 500 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'No se pudo actualizar la contraseña del usuario' },
        { status: 500 }
      );
    }

    console.log('✅ Contraseña actualizada exitosamente para usuario:', userId);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Contraseña actualizada exitosamente',
        user: data.user 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error en API de cambio de contraseña:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    );
  }
}
