import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

// Constantes de validación
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CreateUserPayload {
  email: string;
  password: string;
  nombre: string;
  rol: 'tecnico' | 'admin' | 'super-admin';
  sede?: string;
}

// Validación pura de datos de usuario
const validateUserData = (data: unknown): { valid: true; payload: CreateUserPayload } | { valid: false; error: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Datos inválidos' };
  }

  const payload = data as Record<string, unknown>;

  // Validar nombre
  if (!payload.nombre || typeof payload.nombre !== 'string' || payload.nombre.trim().length === 0) {
    return { valid: false, error: 'El nombre es requerido' };
  }

  // Validar email
  if (!payload.email || typeof payload.email !== 'string') {
    return { valid: false, error: 'El email es requerido' };
  }

  if (!EMAIL_REGEX.test(payload.email)) {
    return { valid: false, error: 'El formato del email no es válido' };
  }

  // Validar password
  if (!payload.password || typeof payload.password !== 'string') {
    return { valid: false, error: 'La contraseña es requerida' };
  }

  if (payload.password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` };
  }

  // Validar rol
  const validRoles = ['tecnico', 'admin', 'super-admin'];
  if (!payload.rol || !validRoles.includes(payload.rol as string)) {
    return { valid: false, error: 'El rol no es válido' };
  }

  return {
    valid: true,
    payload: {
      email: payload.email.toLowerCase().trim(),
      password: payload.password,
      nombre: payload.nombre.trim(),
      rol: payload.rol as CreateUserPayload['rol'],
      sede: typeof payload.sede === 'string' && payload.sede.trim() ? payload.sede.trim() : undefined,
    },
  };
};

/**
 * POST /api/usuarios
 * Crea un usuario con transacción atómica (Auth + Database)
 * Si falla cualquier paso, hace rollback automático
 */
export async function POST(request: NextRequest) {
  console.log('📝 API: Creando nuevo usuario...');

  try {
    // Verificar cliente admin
    if (!supabaseAdmin) {
      console.error('❌ Cliente admin no disponible');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta. Falta SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      );
    }

    // Verificar autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No autorizado - Falta token' },
        { status: 401 }
      );
    }

    // Parsear y validar datos
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'El cuerpo de la petición no es JSON válido' },
        { status: 400 }
      );
    }

    const validation = validateUserData(body);
    if (!validation.valid) {
      console.error('❌ Validación fallida:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { email, password, nombre, rol, sede } = validation.payload;
    let authUserId: string | null = null;

    try {
      // Paso 1: Crear usuario en Supabase Auth
      console.log('🔑 Creando usuario en Auth...', { email });
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmar email automáticamente
        user_metadata: {
          nombre,
          rol,
        },
      });

      if (authError) {
        console.error('❌ Error al crear en Auth:', authError.message);
        
        if (authError.message?.includes('already') || authError.message?.includes('registered')) {
          return NextResponse.json(
            { error: 'Este email ya está registrado' },
            { status: 409 }
          );
        }
        
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: 'No se pudo crear la cuenta de autenticación' },
          { status: 500 }
        );
      }

      authUserId = authData.user.id;
      console.log('✅ Usuario creado en Auth:', authUserId);

      // Paso 2: Insertar en tabla usuarios
      console.log('📝 Insertando en tabla usuarios...');
      
      const { data: usuarioData, error: dbError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          id: authUserId,
          email,
          nombre,
          rol,
          sede: sede || null,
          activo: true,
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Error al insertar en tabla usuarios:', dbError);
        
        // ROLLBACK: Eliminar usuario de Auth
        console.log('🔄 Ejecutando rollback - eliminando usuario de Auth...');
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        console.log('✅ Rollback completado');
        
        return NextResponse.json(
          { error: `Error al crear usuario en base de datos: ${dbError.message}` },
          { status: 500 }
        );
      }

      console.log('✅ Usuario creado exitosamente:', usuarioData);

      return NextResponse.json(
        {
          success: true,
          message: 'Usuario creado exitosamente',
          usuario: usuarioData,
        },
        { status: 201 }
      );

    } catch (innerError: unknown) {
      // Si hay error inesperado y ya creamos el usuario en Auth, hacer rollback
      if (authUserId) {
        console.log('🔄 Error inesperado - ejecutando rollback...');
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
          console.log('✅ Rollback completado');
        } catch (rollbackError) {
          console.error('❌ Error en rollback:', rollbackError);
        }
      }
      throw innerError;
    }

  } catch (error: unknown) {
    console.error('❌ Error al crear usuario:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido al crear usuario';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
