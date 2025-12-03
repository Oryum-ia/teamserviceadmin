// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js'

const MISSING_ENV_ERROR =
  'Missing environment variables for Supabase Admin. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'

/**
 * Crea un cliente Supabase con permisos de administrador.
 * SOLO usar en rutas API del servidor, NUNCA en el cliente.
 *
 * Devuelve null si las variables de entorno no están definidas. Esto evita
 * que el build de Next falle en entornos donde las envs aún no están
 * configuradas (por ejemplo, durante el docker build en Dokploy).
 */
export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(MISSING_ENV_ERROR)
    return null
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
