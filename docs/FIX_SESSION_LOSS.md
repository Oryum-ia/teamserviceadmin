# Fix: Pérdida de Sesión de Usuario

## Problema
Los usuarios experimentan pérdida de sesión aleatoria, requiriendo volver a iniciar sesión. El error aparece como "Error al cargar las órdenes: Revise la consola" y muestra que no hay usuario autenticado.

## Requerimiento
**La sesión NO debe expirar NUNCA mientras el usuario esté activo en la aplicación.** Solo debe cerrarse cuando el usuario explícitamente cierre sesión.

## Estrategia de Sesión Indefinida

### Cómo Funciona

1. **Refresco Automático Periódico**
   - El token se refresca automáticamente cada 15 minutos
   - Esto ocurre en segundo plano sin interrumpir al usuario
   - Mantiene la sesión activa indefinidamente

2. **Refresco en Actividad del Usuario**
   - Cuando el usuario interactúa (click, tecla, scroll, touch)
   - Se reinicia el temporizador de refresco
   - Asegura que usuarios activos nunca pierdan la sesión

3. **Refresco al Volver a la Pestaña**
   - Cuando el usuario vuelve a la pestaña después de estar en otra
   - Se refresca inmediatamente la sesión
   - Previene expiraciones durante inactividad temporal

4. **Refresco Adicional en supabaseClient**
   - Refresco cada 30 minutos a nivel de cliente
   - Capa adicional de seguridad
   - Funciona incluso si el SessionMonitor falla

### Configuración de Supabase

```typescript
{
  auth: {
    persistSession: true,        // Guardar sesión en localStorage
    autoRefreshToken: true,       // Supabase refresca automáticamente
    detectSessionInUrl: true,     // Detectar sesión en URL
    flowType: 'pkce',            // Flujo seguro de autenticación
  }
}
```

### Múltiples Capas de Protección

```
┌─────────────────────────────────────────────────────────────┐
│                    SESIÓN INDEFINIDA                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Capa 1: Supabase autoRefreshToken (Nativo)        │    │
│  │ • Refresca automáticamente antes de expirar       │    │
│  │ • Configurado en createClient()                    │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Capa 2: SessionMonitor - Refresco cada 15 min     │    │
│  │ • setInterval(() => refreshSession(), 15min)       │    │
│  │ • Garantiza refresco periódico                     │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Capa 3: supabaseClient - Refresco cada 30 min     │    │
│  │ • setInterval(() => refreshSession(), 30min)       │    │
│  │ • Respaldo adicional de seguridad                  │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Capa 4: Refresco en Actividad del Usuario         │    │
│  │ • mousedown, keydown, scroll, touchstart           │    │
│  │ • Reinicia temporizador al detectar actividad      │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Capa 5: Refresco al Volver a la Pestaña           │    │
│  │ • document.visibilitychange                        │    │
│  │ • Refresca inmediatamente al volver                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  RESULTADO: Sesión activa mientras el navegador esté abierto│
└─────────────────────────────────────────────────────────────┘
```

1. **Supabase autoRefreshToken**: Refresca automáticamente antes de expirar
2. **SessionMonitor cada 15 min**: Refresco periódico garantizado
3. **supabaseClient cada 30 min**: Refresco adicional de respaldo
4. **Refresco en actividad**: Refresco cuando el usuario interactúa
5. **Refresco en visibilidad**: Refresco al volver a la pestaña

### Resultado
Con esta configuración, **la sesión se mantiene activa indefinidamente** mientras:
- El navegador esté abierto
- La pestaña no se cierre
- El usuario no cierre sesión explícitamente

**La sesión solo expira si:**
- El usuario cierra sesión manualmente
- El usuario cierra el navegador (y no tiene "persistSession")
- Hay un error de red prolongado (> 30 minutos sin conexión)

## Diagnóstico

### Causas Identificadas

1. **Doble Sistema de Autenticación**
   - `AuthContext.tsx` usa localStorage con usuarios mock
   - Supabase tiene su propio sistema de autenticación con tokens JWT
   - No hay sincronización entre ambos sistemas

2. **Configuración de Sesión en supabaseClient.ts**
   ```typescript
   auth: {
     persistSession: true,
     autoRefreshToken: true,
   }
   ```
   - La sesión se persiste en localStorage de Supabase
   - Pero el AuthContext no verifica la sesión de Supabase

3. **Protección SSR Excesiva**
   - El proxy en `supabaseClient.ts` retorna null durante SSR
   - Esto puede causar que las llamadas fallen silenciosamente

4. **Falta de Manejo de Expiración de Token**
   - No hay listeners para eventos de sesión de Supabase
   - No se detecta cuando el token expira o se invalida

## Solución

### Opción 1: Integrar Supabase Auth con AuthContext (Recomendado)

Modificar `AuthContext.tsx` para usar Supabase Auth en lugar de localStorage mock:

```typescript
// En AuthContext.tsx
useEffect(() => {
  // Verificar sesión de Supabase al iniciar
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Cargar datos del usuario desde la tabla usuarios
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          nombre: userData.nombres || userData.email,
          rol: userData.rol,
          activo: userData.activo
        });
      }
    }
    setLoading(false);
  };

  checkSession();

  // Escuchar cambios en la sesión
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (!session) {
          setUser(null);
          router.push('/login');
        }
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Recargar datos del usuario
        const { data: userData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            nombre: userData.nombres || userData.email,
            rol: userData.rol,
            activo: userData.activo
          });
        }
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Opción 2: Agregar Verificación de Sesión en Servicios

Agregar un helper que verifique la sesión antes de cada llamada:

```typescript
// En lib/services/sessionHelper.ts
export async function verificarSesion() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    // Intentar refrescar la sesión
    const { data: { session: newSession }, error: refreshError } = 
      await supabase.auth.refreshSession();
    
    if (refreshError || !newSession) {
      throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
    }
    
    return newSession;
  }
  
  return session;
}
```

### Opción 3: Configurar Refresh Token Automático

Mejorar la configuración del cliente Supabase:

```typescript
// En supabaseClient.ts
supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'teamservice-supabase-auth',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})
```

## Implementación Recomendada

### Paso 1: Actualizar supabaseClient.ts

```typescript
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
      flowType: 'pkce', // Más seguro
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  })

  // Agregar listener global para errores de autenticación
  if (typeof window !== 'undefined') {
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refrescado automáticamente');
      }
      if (event === 'SIGNED_OUT') {
        console.log('🚪 Usuario cerró sesión');
        // Limpiar localStorage del AuthContext
        window.localStorage.removeItem('teamservice_user');
      }
    });
  }

  return supabaseInstance
}
```

### Paso 2: Actualizar AuthContext.tsx

Agregar sincronización con Supabase Auth:

```typescript
useEffect(() => {
  // Verificar sesión de Supabase
  const syncWithSupabase = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
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
        }
      }
    } else {
      // Si no hay sesión en Supabase, limpiar AuthContext
      if (user) {
        setUser(null);
        window.localStorage.removeItem('teamservice_user');
      }
    }
  };

  syncWithSupabase();

  // Listener para cambios de sesión
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('🔐 Supabase auth event:', event);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        window.localStorage.removeItem('teamservice_user');
        router.push('/login');
      }
      
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('✅ Token refrescado, sesión válida');
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Paso 3: Agregar Manejo de Errores en ordenService.ts

```typescript
export async function obtenerOrdenesPaginadas({
  page = 1,
  pageSize = 20,
  filters = {} as any
}) {
  // Verificar sesión antes de hacer la consulta
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error('❌ No hay sesión válida:', sessionError);
    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
  }

  console.log('🔍 [ordenService] obtenerOrdenesPaginadas llamado con:', { page, pageSize, filters });
  
  // ... resto del código
}
```

## Testing

1. **Verificar persistencia de sesión:**
   - Iniciar sesión
   - Recargar la página
   - Verificar que no pida login nuevamente

2. **Verificar refresh automático:**
   - Dejar la aplicación abierta por más de 1 hora
   - Realizar una acción (cargar órdenes)
   - Verificar que no pida login

3. **Verificar sincronización:**
   - Abrir la app en dos pestañas
   - Cerrar sesión en una
   - Verificar que la otra también cierre sesión

## Notas Adicionales

- Los tokens JWT de Supabase expiran por defecto en 1 hora
- El `autoRefreshToken` debería refrescarlos automáticamente
- Si el problema persiste, verificar las políticas RLS en Supabase
- Considerar implementar un "heartbeat" que verifique la sesión cada 5 minutos

## Referencias

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Auth Patterns](https://nextjs.org/docs/authentication)
