import { supabase } from "@/lib/supabaseClient";
import { Usuario, UserRole } from "@/types/database.types";

/**
 * Crear un nuevo usuario en el sistema
 * NOTA: Esta función requiere permisos de administrador en Supabase
 */
export async function crearUsuario(data: {
  email: string;
  password: string;
  nombre: string;
  rol: UserRole;
  sede?: string;
}) {
  try {
    console.log('🔑 Creando cuenta de usuario...', { email: data.email });

    // Guardar la sesión actual del admin
    const { data: { session: adminSession } } = await supabase.auth.getSession();

    // Crear el nuevo usuario usando signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: undefined, // No enviar email de confirmación
        data: {
          nombre: data.nombre,
          rol: data.rol,
        }
      }
    });

    if (authError) {
      console.error("❌ Error al crear cuenta:", { message: authError.message });

      if (authError.message?.includes("already registered") || authError.message?.includes("already been registered")) {
        throw new Error('Este email ya está registrado');
      }

      throw new Error(authError.message || 'Error desconocido al registrar');
    }

    if (!authData.user) {
      throw new Error('No se pudo crear la cuenta');
    }

    console.log('✅ Cuenta creada exitosamente:', authData.user.id);

    // Cerrar la sesión del nuevo usuario inmediatamente
    await supabase.auth.signOut();

    // Restaurar la sesión del admin
    if (adminSession) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
      console.log('✅ Sesión de admin restaurada');
    }

    // Insertar el usuario en la tabla public.usuarios
    console.log('📝 Insertando usuario en tabla usuarios...', {
      id: authData.user.id,
      email: data.email,
      nombre: data.nombre,
      rol: data.rol,
      sede: data.sede || null,
    });

    const { data: usuarioData, error: dbError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email: data.email,
        password: data.password, // Se guarda para referencia
        nombre: data.nombre,
        rol: data.rol,
        sede: data.sede || null,
        activo: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Error al insertar en tabla usuarios:', dbError);
      // NOTA: El usuario quedó creado en auth pero no en la tabla usuarios
      // Se recomienda limpiarlo manualmente desde el dashboard de Supabase
      console.warn('⚠️ Usuario creado en auth pero no en tabla usuarios. ID:', authData.user.id);
      throw new Error(`Error al crear usuario en base de datos: ${dbError.message}`);
    }

    console.log('✅ Usuario insertado en tabla usuarios:', usuarioData);

    return usuarioData as Usuario;
  } catch (error: any) {
    console.error("❌ Error al crear usuario:", error);
    throw error;
  }
}
/**
 * Obtener todos los usuarios
 */
export async function obtenerTodosLosUsuarios() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener usuarios:", error);
    throw error;
  }

  return data as Usuario[];
}

/**
 * Obtener usuarios por rol
 */
export async function obtenerUsuariosPorRol(rol: UserRole) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("rol", rol)
    .order("nombre");

  if (error) {
    console.error("❌ Error al obtener usuarios por rol:", error);
    throw error;
  }

  return data as Usuario[];
}

/**
 * Obtener usuarios por sede
 */
export async function obtenerUsuariosPorSede(sede: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("sede", sede)
    .order("nombre");

  if (error) {
    console.error("❌ Error al obtener usuarios por sede:", error);
    throw error;
  }

  return data as Usuario[];
}

/**
 * Obtener un usuario por ID
 */
export async function obtenerUsuarioPorId(id: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("❌ Error al obtener usuario:", error);
    throw error;
  }

  return data as Usuario;
}

/**
 * Actualizar datos de un usuario (excepto email y password)
 */
export async function actualizarUsuario(
  id: string,
  data: Partial<Omit<Usuario, "id" | "email" | "created_at" | "password">>
) {
  console.log('🔄 Actualizando usuario:', { id, data });
  
  // Primero verificar que el usuario existe
  const { data: existingUser, error: checkError } = await supabase
    .from("usuarios")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (checkError) {
    console.error("❌ Error al verificar usuario:", checkError);
    throw checkError;
  }

  if (!existingUser) {
    throw new Error(`No se encontró el usuario con id: ${id}`);
  }

  // Ahora actualizar
  const { data: usuario, error } = await supabase
    .from("usuarios")
    .update(data)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("❌ Error al actualizar usuario:", error);
    console.error("❌ Detalles:", { code: error.code, message: error.message, details: error.details });
    throw error;
  }

  if (!usuario) {
    throw new Error('No se pudo actualizar el usuario. Verifica los permisos RLS en Supabase.');
  }

  console.log("✅ Usuario actualizado:", usuario);
  return usuario as Usuario;
}

/**
 * Activar/desactivar usuario
 */
export async function toggleActivoUsuario(id: string, activo: boolean) {
  const { data, error } = await supabase
    .from("usuarios")
    .update({ activo })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error al cambiar estado del usuario:", error);
    throw error;
  }

  console.log(`✅ Usuario ${activo ? "activado" : "desactivado"}`);
  return data as Usuario;
}

/**
 * Buscar usuarios por nombre o email
 */
export async function buscarUsuarios(termino: string) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .or(`nombre.ilike.%${termino}%,email.ilike.%${termino}%`)
    .order("nombre");

  if (error) {
    console.error("❌ Error al buscar usuarios:", error);
    throw error;
  }

  return data as Usuario[];
}

/**
 * Contar usuarios por rol
 */
export async function contarUsuariosPorRol() {
  const { data, error } = await supabase.from("usuarios").select("rol");

  if (error) {
    console.error("❌ Error al contar usuarios:", error);
    throw error;
  }

  const conteo: Record<UserRole, number> = {
    tecnico: 0,
    admin: 0,
    "super-admin": 0,
  };

  data?.forEach((usuario) => {
    conteo[usuario.rol as UserRole]++;
  });

  return conteo;
}

/**
 * Obtener usuarios activos
 */
export async function obtenerUsuariosActivos() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  if (error) {
    console.error("❌ Error al obtener usuarios activos:", error);
    throw error;
  }

  return data as Usuario[];
}

/**
 * Eliminar un usuario del sistema
 * Elimina tanto de la tabla usuarios como de Supabase Auth
 */
export async function eliminarUsuario(id: string) {
  console.log('🗑️ Eliminando usuario:', { id });

  try {
    // Primero eliminar de la tabla usuarios
    const { error: dbError } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("❌ Error al eliminar usuario de la tabla:", dbError);
      throw dbError;
    }

    console.log('✅ Usuario eliminado de la tabla usuarios');

    // NOTA: No podemos eliminar de Supabase Auth sin Service Role Key
    // El usuario quedará en auth pero no en la tabla usuarios
    // Se recomienda limpiarlo manualmente desde el dashboard de Supabase
    console.warn('⚠️ Usuario eliminado de tabla pero permanece en auth. ID:', id);
    console.warn('💡 Para eliminarlo completamente, ve a Authentication > Users en Supabase Dashboard');

    return true;
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    throw error;
  }
}
