import { supabase } from "@/lib/supabaseClient";
import { Usuario, UserRole } from "@/types/database.types";

/**
 * Crear un nuevo usuario en el sistema
 * Usa API route con transacción atómica y rollback automático
 */
export async function crearUsuario(data: {
  email: string;
  password: string;
  nombre: string;
  rol: UserRole;
  sede?: string;
}): Promise<Usuario> {
  console.log('🔑 Creando cuenta de usuario...', { email: data.email });

  // Obtener token de sesión actual
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No hay sesión activa. Inicia sesión para crear usuarios.');
  }

  const response = await fetch('/api/usuarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ Error al crear usuario:', result.error);
    throw new Error(result.error || 'Error al crear usuario');
  }

  console.log('✅ Usuario creado exitosamente:', result.usuario);
  return result.usuario as Usuario;
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
 * Si se solicitan técnicos, también incluye super-admins (ya que pueden actuar como técnicos)
 */
export async function obtenerUsuariosPorRol(rol: UserRole) {
  // Si se buscan técnicos, incluir también super-admins
  if (rol === 'tecnico') {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .in("rol", ['tecnico', 'super-admin'])
      .order("nombre");

    if (error) {
      console.error("❌ Error al obtener usuarios por rol:", error);
      throw error;
    }

    return data as Usuario[];
  }

  // Para otros roles, comportamiento normal
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
 * Usa una API route para acceder a la Service Role Key de forma segura
 */
export async function eliminarUsuario(id: string) {
  console.log('🗑️ Eliminando usuario:', { id });

  try {
    // Obtener el token de sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No hay sesión activa');
    }

    // Llamar a la API route que tiene acceso al cliente admin
    const response = await fetch(`/api/usuarios/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Error al eliminar usuario:", data.error);
      throw new Error(data.error || 'Error al eliminar usuario');
    }

    console.log('✅ Usuario eliminado completamente del sistema');

    return true;
  } catch (error: any) {
    console.error("❌ Error al eliminar usuario:", error);
    throw new Error(error.message || 'Error al eliminar usuario');
  }
}
