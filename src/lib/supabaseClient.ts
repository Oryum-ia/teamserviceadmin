// lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const MISSING_ENV_ERROR =
  'Missing environment variables for Supabase. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'

const MISSING_ADMIN_ENV_ERROR =
  'Missing environment variables for Supabase Admin. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'

// Singleton para evitar crear múltiples instancias
let supabaseInstance: SupabaseClient | null = null
let supabaseAdminInstance: SupabaseClient | null = null

/**
 * Cliente Supabase para operaciones normales (con anon key).
 * Evalúa las envs en runtime para evitar que el build falle.
 * Devuelve null si faltan las variables de entorno.
 */
export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(MISSING_ENV_ERROR)
    return null
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  })

  return supabaseInstance
}

/**
 * Cliente Supabase con permisos de administrador (service role key).
 * SOLO usar en rutas API del servidor, NUNCA en el cliente.
 * Devuelve null si faltan las variables de entorno.
 */
export const getSupabaseAdmin = () => {
  if (supabaseAdminInstance) return supabaseAdminInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(MISSING_ADMIN_ENV_ERROR)
    return null
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return supabaseAdminInstance
}

/**
 * Exports legacy para compatibilidad con código existente.
 * Estos son proxies que delegan a getSupabase()/getSupabaseAdmin() en runtime.
 * Si faltan envs, las operaciones fallarán en runtime (no en build time).
 */

// Cliente lazy que se inicializa solo cuando se usa
let _supabaseLazy: SupabaseClient | null = null
let _supabaseAdminLazy: SupabaseClient | null = null

const getSupabaseLazy = (): SupabaseClient => {
  if (_supabaseLazy) return _supabaseLazy
  
  const client = getSupabase()
  if (!client) {
    throw new Error('Supabase client not available. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  _supabaseLazy = client
  return client
}

const getSupabaseAdminLazy = (): SupabaseClient => {
  if (_supabaseAdminLazy) return _supabaseAdminLazy
  
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error('Supabase Admin client not available. Missing SUPABASE_SERVICE_ROLE_KEY.')
  }
  _supabaseAdminLazy = client
  return client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseLazy()
    const value = (client as unknown as Record<string, unknown>)[prop as string]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseAdminLazy()
    const value = (client as unknown as Record<string, unknown>)[prop as string]
    return typeof value === 'function' ? value.bind(client) : value
  }
})
