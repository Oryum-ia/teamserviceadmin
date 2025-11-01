import { supabase } from "@/lib/supabaseClient";

/**
 * Cambiar contraseña del usuario autenticado
 * Usa Supabase Auth para cambiar la contraseña
 */
export async function cambiarMiContraseña(nuevaContraseña: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: nuevaContraseña,
    });

    if (error) {
      console.error("❌ Error al cambiar contraseña:", error);
      throw error;
    }

    console.log("✅ Contraseña actualizada exitosamente");
    return data;
  } catch (error) {
    console.error("❌ Error al cambiar contraseña:", error);
    throw error;
  }
}

/**
 * Cambiar contraseña de otro usuario (solo para super-admin)
 * NOTA: Esto requiere configuración especial en Supabase
 * Alternativa: usar Admin API o Edge Functions
 */
export async function cambiarContraseñaUsuario(
  userId: string,
  nuevaContraseña: string
) {
  try {
    // Esta función requiere permisos de admin en Supabase
    // Usamos la API de administrador para cambiar la contraseña en auth.users
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: nuevaContraseña }
    );

    if (error) {
      console.error("❌ Error al cambiar contraseña del usuario:", error);
      throw error;
    }

    if (!data.user) {
      throw new Error("No se pudo actualizar la contraseña del usuario");
    }

    console.log("✅ Contraseña del usuario actualizada en auth.users");
    return data.user;
  } catch (error) {
    console.error("❌ Error al cambiar contraseña del usuario:", error);
    throw error;
  }
}

/**
 * Obtener datos del usuario autenticado actual
 */
export async function obtenerUsuarioAutenticado() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("❌ Error al obtener usuario autenticado:", error);
      throw error;
    }

    if (!user) {
      throw new Error("No hay usuario autenticado");
    }

    // Buscar datos adicionales del usuario en la tabla usuarios
    const { data: usuarioData, error: dbError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (dbError) {
      console.error("❌ Error al obtener datos del usuario:", dbError);
      throw dbError;
    }

    return {
      ...user,
      ...usuarioData,
    };
  } catch (error) {
    console.error("❌ Error al obtener usuario autenticado:", error);
    throw error;
  }
}
