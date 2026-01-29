# Fix: Error 404 en Ruta /login

## Problema
Al intentar acceder o ser redirigido a `/login`, la aplicación mostraba un error 404 "This page could not be found".

```
GET https://admin.tscosta.com.co/login 404 (Not Found)
```

## Causa Raíz
El código tenía múltiples referencias a la ruta `/login` en redirecciones, pero esa ruta nunca fue creada en la estructura de Next.js. La página de login siempre estuvo en la raíz `/` (src/app/page.tsx).

### Archivos con Referencias Incorrectas
- `src/contexts/AuthContext.tsx` - 3 referencias a `/login`
- `src/components/SessionMonitor.tsx` - 1 referencia a `/login`
- `src/components/paneladmin/OrdenesNuevo.tsx` - 1 referencia a `/login`
- `middleware.ts` - `/login` en la lista de rutas públicas

## Solución
Cambiar todas las referencias de `/login` a `/` (la raíz donde está el LoginForm).

### Cambios Implementados

#### 1. AuthContext.tsx
```typescript
// ANTES
router.push('/login');

// DESPUÉS
router.push('/');
```

#### 2. SessionMonitor.tsx
```typescript
// ANTES
router.push('/login');

// DESPUÉS
router.push('/');
```

#### 3. OrdenesNuevo.tsx
```typescript
// ANTES
router.push('/login');

// DESPUÉS
router.push('/');
```

#### 4. middleware.ts
```typescript
// ANTES
const publicRoutes = ['/', '/login'];

// DESPUÉS
const publicRoutes = ['/'];
```

## Estructura de Rutas Correcta

```
/                    → Login (src/app/page.tsx)
/paneladmin          → Panel de administración
/paneladmin/ordenes  → Gestión de órdenes
/tecnico             → Panel de técnico
/tecnico/diagnostico → Diagnóstico de órdenes
```

## Archivos Modificados
- ✅ `src/contexts/AuthContext.tsx`
- ✅ `src/components/SessionMonitor.tsx`
- ✅ `src/components/paneladmin/OrdenesNuevo.tsx`
- ✅ `middleware.ts`

## Resultado
Ahora todas las redirecciones al login funcionan correctamente, llevando al usuario a la raíz `/` donde está el formulario de login.

## Fecha
29 de enero de 2026
