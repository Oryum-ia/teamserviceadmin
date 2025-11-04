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
    console.log("🔄 Intentando cambiar contraseña para usuario:", userId);
    
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: nuevaContraseña }),
    });

    console.log("📡 Respuesta de la API:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    const result = await response.json().catch((err) => {
      console.error("❌ Error al parsear respuesta JSON:", err);
      return null;
    });

    console.log("📦 Resultado parseado:", result);

    if (!response.ok) {
      const message = result?.message || result?.error || `Error ${response.status}: No se pudo actualizar la contraseña del usuario`;
      console.error("❌ Error en la respuesta:", message);
      throw new Error(message);
    }

    console.log("✅ Contraseña actualizada exitosamente");
    return result?.user ?? null;
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
