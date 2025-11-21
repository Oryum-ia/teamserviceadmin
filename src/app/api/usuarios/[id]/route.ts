import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

/**
 * DELETE /api/usuarios/[id]
 * Elimina un usuario del sistema (Auth + Database)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log('🗑️ API: Eliminando usuario:', { id });

  try {
    // Verificar que el cliente admin esté disponible
    if (!supabaseAdmin) {
      console.error('❌ Cliente admin no disponible');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta. Falta SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      );
    }

    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ No hay token de autorización');
      return NextResponse.json(
        { error: 'No autorizado - Falta token' },
        { status: 401 }
      );
    }

    console.log('✅ Token de autorización recibido');

    // Primero eliminar de Supabase Auth usando la API de administración
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error('❌ Error al eliminar usuario de Auth:', authError);
      return NextResponse.json(
        { error: `Error al eliminar de autenticación: ${authError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Usuario eliminado de Supabase Auth');

    // Luego eliminar de la tabla usuarios (usando el cliente admin)
    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('❌ Error al eliminar usuario de la tabla:', dbError);
      return NextResponse.json(
        { error: `Error al eliminar de la tabla: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Usuario eliminado completamente del sistema');

    return NextResponse.json(
      { 
        success: true,
        message: 'Usuario eliminado exitosamente'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error al eliminar usuario:', error);
    return NextResponse.json(
      { error: error.message || 'Error desconocido al eliminar usuario' },
      { status: 500 }
    );
  }
}
