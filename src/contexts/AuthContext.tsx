'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type UserRole = 'administrador' | 'tecnico'

interface User {
  id: string
  email: string
  nombre: string
  rol: UserRole
  activo: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  isAdmin: boolean
  isTecnico: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Credenciales simuladas
const MOCK_USERS = {
  'admin@teamservice.com': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@teamservice.com',
      nombre: 'Administrador',
      rol: 'administrador' as UserRole,
      activo: true
    }
  },
  'tecnico@teamservice.com': {
    password: 'tecnico123',
    user: {
      id: '2',
      email: 'tecnico@teamservice.com',
      nombre: 'Técnico',
      rol: 'tecnico' as UserRole,
      activo: true
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Cargar usuario desde localStorage al inicializar
  useEffect(() => {
    // SSR protection
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const savedUser = window.localStorage.getItem('teamservice_user')
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          setUser({ ...userData, activo: userData.activo ?? true })
        } catch (error) {
          console.error('Error parsing saved user:', error)
          window.localStorage.removeItem('teamservice_user')
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
    }
    setLoading(false)
  }, [])

  // Sincronizar con Supabase Auth y escuchar cambios de sesión
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Importar supabase dinámicamente para evitar problemas SSR
    import('@/lib/supabaseClient').then(({ supabase }) => {
      // Verificar sesión de Supabase al iniciar
      const checkSupabaseSession = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ Error al verificar sesión de Supabase:', error);
            return;
          }

          if (session?.user) {
            console.log('✅ Sesión de Supabase válida encontrada');
            // Si hay sesión en Supabase pero no en AuthContext, sincronizar
            if (!user) {
              const { data: userData } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (userData) {
                const syncedUser = {
                  id: userData.id,
                  email: userData.email,
                  nombre: userData.nombres || userData.email,
                  rol: userData.rol,
                  activo: userData.activo
                };
                setUser(syncedUser);
                window.localStorage.setItem('teamservice_user', JSON.stringify(syncedUser));
                console.log('🔄 Usuario sincronizado desde Supabase');
              }
            }
          } else {
            // Si no hay sesión en Supabase pero sí en AuthContext, limpiar
            if (user) {
              console.log('⚠️ No hay sesión en Supabase, limpiando AuthContext');
              setUser(null);
              window.localStorage.removeItem('teamservice_user');
            }
          }
        } catch (error) {
          console.error('❌ Error al verificar sesión:', error);
        }
      };

      checkSupabaseSession();

      // Listener para cambios de sesión de Supabase
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔐 Supabase auth event:', event);
          
          if (event === 'SIGNED_OUT') {
            console.log('🚪 Sesión cerrada, limpiando estado');
            setUser(null);
            window.localStorage.removeItem('teamservice_user');
            router.push('/');
          }
          
          if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('✅ Token refrescado, sesión válida');
          }

          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ Usuario inició sesión en Supabase');
            // Sincronizar con AuthContext
            const { data: userData } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (userData) {
              const syncedUser = {
                id: userData.id,
                email: userData.email,
                nombre: userData.nombres || userData.email,
                rol: userData.rol,
                activo: userData.activo
              };
              setUser(syncedUser);
              window.localStorage.setItem('teamservice_user', JSON.stringify(syncedUser));
            }
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    });
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    
    // Simular delay de autenticación
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockUser = MOCK_USERS[email as keyof typeof MOCK_USERS]
    
    if (!mockUser || mockUser.password !== password) {
      setLoading(false)
      throw new Error('Credenciales incorrectas')
    }

    if (!mockUser.user.activo) {
      setLoading(false)
      throw new Error('El usuario está inactivo. Contacte al administrador.')
    }

    // Guardar usuario en localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('teamservice_user', JSON.stringify(mockUser.user))
    }
    setUser(mockUser.user)
    
    // Redireccionar según el rol
    if (mockUser.user.rol === 'administrador') {
      router.push('/paneladmin')
    } else if (mockUser.user.rol === 'tecnico') {
      router.push('/tecnico/diagnostico')
    }
    
    setLoading(false)
  }

  const signOut = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('teamservice_user')
    }
    setUser(null)
    router.push('/')
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin: user?.rol === 'administrador',
    isTecnico: user?.rol === 'tecnico',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

// Hook para proteger rutas
export function useRequireAuth(requiredRole?: UserRole) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/')
        return
      }
      
      if (requiredRole && user.rol !== requiredRole) {
        // Redirigir según el rol del usuario
        if (user.rol === 'administrador') {
          router.push('/paneladmin')
        } else if (user.rol === 'tecnico') {
          router.push('/tecnico/diagnostico')
        }
        return
      }
    }
  }, [user, loading, requiredRole, router])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    hasRequiredRole: !requiredRole || user?.rol === requiredRole,
  }
}