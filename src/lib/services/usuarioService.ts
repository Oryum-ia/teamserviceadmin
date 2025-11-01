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
    // 1. Crear usuario en Supabase Auth usando el email proporcionado
    console.log('🔑 Creando cuenta de autenticación...', { email: data.email });
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          email: data.email,
          nombre: data.nombre,
          rol: data.rol,
        },
      },
    });

    if (authError) {
      console.error("❌ Error al crear cuenta de autenticación:", authError);
      throw new Error(`Error de autenticación: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No se pudo crear la cuenta de autenticación');
    }

    console.log('✅ Cuenta de autenticación creada:', authData.user.id);

    // 2. Insertar usuario en la tabla usuarios con gen_random_uuid() para el ID
    const { data: usuario, error: dbError } = await supabase
      .from("usuarios")
      .insert([
        {
          // No especificamos el ID, la base de datos usará gen_random_uuid()
          email: data.email,
          nombre: data.nombre,
          rol: data.rol,
          sede: data.sede || null,
          activo: true,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("❌ Error al insertar usuario en tabla:", dbError);
      
      // Si falla la inserción en la tabla, intentar eliminar el usuario de auth
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('🗑️ Usuario de auth eliminado por fallo en base de datos');
      } catch (cleanupError) {
        console.error('⚠️ No se pudo limpiar usuario de auth:', cleanupError);
      }
      
      throw dbError;
    }

    console.log("✅ Usuario creado exitosamente en tabla y auth");
    return usuario as Usuario;
  } catch (error) {
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
