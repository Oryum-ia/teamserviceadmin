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
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'teamservice-supabase-auth',
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-application-name': 'teamservice-costa',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  })

  // Agregar listener global para mantener sesión activa
  if (typeof window !== 'undefined') {
    supabaseInstance.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refrescado automáticamente');
      }
      if (event === 'SIGNED_OUT') {
        console.log('🚪 Usuario cerró sesión');
        // Limpiar localStorage del AuthContext
        window.localStorage.removeItem('teamservice_user');
      }
      if (event === 'USER_UPDATED') {
        console.log('👤 Usuario actualizado');
      }
      
      // Si hay sesión, asegurar que se mantenga activa
      if (session && event === 'SIGNED_IN') {
        console.log('✅ Sesión iniciada, configurando mantenimiento automático');
      }
    });

    // Refrescar token cada 30 minutos para mantener sesión activa indefinidamente
    const client = supabaseInstance;
    setInterval(async () => {
      const { data: { session }, error } = await client.auth.getSession();
      if (session && !error) {
        console.log('🔄 Refrescando token para mantener sesión activa...');
        await client.auth.refreshSession();
      }
    }, 30 * 60 * 1000); // 30 minutos
  }

  return supabaseInstance
}

/**
 * Cliente Supabase con permisos de administrador (service role key).
 * SOLO usar en rutas API del servidor, NUNCA en el cliente.
 * Devuelve null si faltan las variables de entorno.
 */
export const getSupabaseAdmin = () => {
  if (supabaseAdminInstance) return supabaseAdminInstance

  // Evitar error en cliente donde no existe process.env.SUPABASE_SERVICE_ROLE_KEY
  if (typeof window !== 'undefined') {
    return null;
  }

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

const getSupabaseLazy = (): SupabaseClient | null => {
  if (_supabaseLazy) return _supabaseLazy
  
  // Durante SSR, si no hay window, retornar null en lugar de lanzar error
  if (typeof window === 'undefined') {
    console.warn('⚠️ Supabase client accessed during SSR. Returning null.')
    return null
  }
  
  const client = getSupabase()
  if (!client) {
    throw new Error('Supabase client not available. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  _supabaseLazy = client
  return client
}

const getSupabaseAdminLazy = (): SupabaseClient | null => {
  if (_supabaseAdminLazy) return _supabaseAdminLazy
  
  const client = getSupabaseAdmin()
  if (!client) {
    // Si estamos en el cliente, retornar null en lugar de lanzar error
    if (typeof window !== 'undefined') {
      return null
    }
    throw new Error('Supabase Admin client not available. Missing SUPABASE_SERVICE_ROLE_KEY.')
  }
  _supabaseAdminLazy = client
  return client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    // Durante SSR, retornar un objeto proxy recursivo para propiedades anidadas
    if (typeof window === 'undefined') {
      console.warn(`⚠️ Supabase.${String(prop)} accessed during SSR.`)
      
      // Para propiedades como 'auth', 'from', etc., retornar un proxy recursivo
      return new Proxy({}, {
        get(_, nestedProp) {
          console.warn(`⚠️ Supabase.${String(prop)}.${String(nestedProp)} called during SSR.`)
          // Retornar una función que devuelve un error manejable
          return () => Promise.resolve({ 
            data: null, 
            error: new Error(`Supabase.${String(prop)}.${String(nestedProp)} not available during SSR`) 
          })
        }
      })
    }
    
    const client = getSupabaseLazy()
    if (!client) {
      // Retornar proxy recursivo también cuando el cliente no está inicializado
      return new Proxy({}, {
        get(_, nestedProp) {
          return () => Promise.resolve({ 
            data: null, 
            error: new Error(`Supabase client not initialized`) 
          })
        }
      })
    }
    
    const value = (client as unknown as Record<string, unknown>)[prop as string]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseAdminLazy()
    if (!client) {
      return new Proxy({}, {
        get(_, nestedProp) {
          return () => Promise.resolve({ 
            data: null, 
            error: new Error(`Supabase Admin client not initialized`) 
          })
        }
      })
    }
    
    const value = (client as unknown as Record<string, unknown>)[prop as string]
    return typeof value === 'function' ? value.bind(client) : value
  }
})
