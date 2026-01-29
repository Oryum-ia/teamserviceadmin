import { supabase } from "@/lib/supabaseClient";

/**
 * Verificar que existe una sesión válida de Supabase
 * Intenta refrescar el token si está expirado
 * @throws Error si no hay sesión válida
 */
export async function verificarSesion() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error al obtener sesión:', error);
      throw new Error('Error al verificar la sesión. Por favor, recargue la página.');
    }

    if (!session) {
      console.warn('⚠️ No hay sesión activa, intentando refrescar...');
      
      // Intentar refrescar la sesión
      const { data: { session: newSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError || !newSession) {
        console.error('❌ No se pudo refrescar la sesión:', refreshError);
        throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      }
      
      console.log('✅ Sesión refrescada exitosamente');
      return newSession;
    }
    
    // Verificar si el token está próximo a expirar (menos de 5 minutos)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < 300) { // Menos de 5 minutos
        console.log('⏰ Token próximo a expirar, refrescando...');
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        if (!refreshError && refreshedSession) {
          console.log('✅ Token refrescado preventivamente');
          return refreshedSession;
        }
      }
    }
    
    return session;
  } catch (error) {
    console.error('❌ Error en verificación de sesión:', error);
    throw error;
  }
}

/**
 * Obtener el usuario actual de la sesión
 * @returns Usuario actual o null si no hay sesión
 */
export async function obtenerUsuarioActual() {
  try {
    const session = await verificarSesion();
    return session.user;
  } catch (error) {
    console.error('❌ Error al obtener usuario actual:', error);
    return null;
  }
}

/**
 * Verificar si hay una sesión válida sin lanzar error
 * @returns true si hay sesión válida, false en caso contrario
 */
export async function tieneSesionValida(): Promise<boolean> {
  try {
    await verificarSesion();
    return true;
  } catch (error) {
    return false;
  }
}
