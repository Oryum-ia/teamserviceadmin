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
    const savedUser = localStorage.getItem('teamservice_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser({ ...userData, activo: userData.activo ?? true })
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('teamservice_user')
      }
    }
    setLoading(false)
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
    localStorage.setItem('teamservice_user', JSON.stringify(mockUser.user))
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
    localStorage.removeItem('teamservice_user')
    setUser(null)
    router.push('/login')
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
        router.push('/login')
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