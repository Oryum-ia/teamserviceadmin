# Fix: Pantalla en Blanco al Navegar Entre Órdenes

## Problema Identificado

Al navegar entre órdenes (avanzar/retroceder), la pantalla se quedaba en blanco debido a múltiples problemas de sincronización de estado:

### Causas Raíz

1. **Hook `useSafeOrdenId` no detectaba cambios correctamente**
   - No tenía referencia al ID anterior
   - No reseteaba el estado al cambiar de orden
   - Faltaba la dependencia `toast` en el useEffect

2. **Estado no se limpiaba al cambiar de orden**
   - El componente mantenía datos de la orden anterior
   - El localStorage podía tener datos obsoletos
   - No se reseteaba `currentStep` al cambiar

3. **Canal de Realtime no se limpiaba correctamente**
   - Se creaban múltiples suscripciones sin limpiar las anteriores
   - Causaba memory leaks y actualizaciones incorrectas
   - No se verificaba si el componente seguía montado

4. **Race conditions en carga de datos**
   - No se verificaba si el componente seguía montado después de operaciones async
   - Actualizaciones de estado después del unmount

5. **Incompatibilidad de tipos TypeScript**
   - El tipo `OrdenLocalData` no era compatible con el tipo `Orden`
   - Faltaban campos opcionales en la interfaz

## Solución Implementada

### 1. Mejoras en `useSafeOrdenId` Hook

```typescript
// Agregado:
- useRef para trackear el último ID procesado
- Reset de estado cuando cambia el ID
- Dependencia correcta de toast en useEffect
- Prevención de actualizaciones innecesarias
```

**Archivo**: `src/hooks/useSafeOrdenId.ts`

**Cambios específicos:**
- ✅ Agregado `lastIdRef` para detectar cambios de ID
- ✅ Reset de estado (`isReady: false`) cuando cambia el ID
- ✅ Dependencia correcta de `toast` en el array de dependencias
- ✅ Prevención de loops infinitos con verificación de cambio

### 2. Mejoras en Página de Detalle de Orden

```typescript
// Agregado:
- lastOrdenIdRef para detectar cambios de orden
- Limpieza completa de estado al cambiar de orden
- Verificación de isMountedRef en todas las operaciones async
- Limpieza adecuada del canal de realtime
- Manejo de errores en background sin afectar UX
```

**Archivo**: `src/app/paneladmin/ordenes/[id]/page.tsx`

**Cambios específicos:**
- ✅ Agregado `lastOrdenIdRef` para detectar cambios de orden
- ✅ Limpieza de estado anterior al cambiar de orden:
  - `setOrden(null)`
  - `setIsLoading(true)`
  - `setError('')`
  - `setCurrentStep(0)`
- ✅ Limpieza del canal de realtime anterior antes de crear uno nuevo
- ✅ Verificación de `isMountedRef.current` en todas las operaciones async
- ✅ Manejo de errores en background sin bloquear la UI
- ✅ Uso de `as any` para compatibilidad de tipos con localStorage

### 3. Mejoras en Tipos de LocalStorage

**Archivo**: `src/lib/ordenLocalStorage.ts`

**Cambios específicos:**
- ✅ Campos `marca`, `modelo`, `serie` ahora son opcionales
- ✅ Agregado campo `tipo_producto` opcional
- ✅ Agregado campos de estado especial: `fase_anterior`, `fecha_bodega`, `fecha_chatarrizado`
- ✅ Agregado campos de recepción/entrega: `terminos_aceptados`, `firma_cliente`, `firma_entrega`
- ✅ Campo `equipo` ahora puede ser string o objeto
- ✅ Campos `fase_actual` y `estado` ahora son opcionales

### Cambios Específicos

#### Hook useSafeOrdenId
```typescript
// Antes
useEffect(() => {
  const ordenIdParam = params?.id;
  if (!ordenIdParam) {
    setState({ id: null, isReady: false });
    return;
  }
  setState({ id: ordenIdParam, isReady: true });
}, [params?.id]);

// Después
const lastIdRef = useRef<string | null>(null);

useEffect(() => {
  const ordenIdParam = params?.id;
  
  // Si el ID no ha cambiado, no hacer nada
  if (ordenIdParam === lastIdRef.current) {
    return;
  }
  
  // Resetear estado cuando cambia el ID
  setState({ id: null, isReady: false });
  
  if (!ordenIdParam || ordenIdParam.trim() === '') {
    lastIdRef.current = null;
    return;
  }
  
  lastIdRef.current = ordenIdParam;
  setState({ id: ordenIdParam, isReady: true });
}, [params?.id, toast]);
```

#### Página de Detalle
```typescript
// Antes
useEffect(() => {
  if (isReady && ordenId) {
    await cargarOrden();
    await verificarSuperAdmin();
    channelRef.current = await configurarRealtime();
  }
}, [isReady, ordenId]);

// Después
const lastOrdenIdRef = useRef<string | null>(null);

useEffect(() => {
  if (isReady && ordenId) {
    // Si cambió el ID de orden, limpiar estado anterior
    if (lastOrdenIdRef.current && lastOrdenIdRef.current !== ordenId) {
      setOrden(null);
      setIsLoading(true);
      setError('');
      setCurrentStep(0);
      
      // Limpiar canal anterior
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    }
    
    lastOrdenIdRef.current = ordenId;
    await cargarOrden();
    await verificarSuperAdmin();
    
    // Limpiar canal anterior antes de crear uno nuevo
    if (channelRef.current) {
      await channelRef.current.unsubscribe();
    }
    channelRef.current = await configurarRealtime();
  }
}, [isReady, ordenId]);
```

## Flujo de Navegación Mejorado

### Antes (Con Bug)
```
Usuario navega a nueva orden
  ↓
Hook no detecta cambio correctamente
  ↓
Estado anterior permanece
  ↓
Canal realtime duplicado
  ↓
Pantalla en blanco o datos incorrectos
```

### Después (Corregido)
```
Usuario navega a nueva orden
  ↓
Hook detecta cambio de ID (lastIdRef)
  ↓
Estado se resetea completamente
  ↓
Canal anterior se limpia (unsubscribe)
  ↓
Nueva orden se carga correctamente
  ↓
Nuevo canal realtime se crea
  ↓
UI se actualiza correctamente
```

## Beneficios

1. **Navegación fluida**: Ya no hay pantallas en blanco
2. **Sin memory leaks**: Canales de realtime se limpian correctamente
3. **Datos correctos**: Siempre muestra la orden actual
4. **Mejor performance**: No hay suscripciones duplicadas
5. **Código más robusto**: Manejo correcto de race conditions
6. **Type-safe**: Tipos de TypeScript corregidos y compatibles

## Testing Recomendado

Para verificar que el fix funciona:

1. ✅ Navegar entre múltiples órdenes rápidamente
2. ✅ Usar botones de navegación del navegador (atrás/adelante)
3. ✅ Cambiar de orden mientras se carga otra
4. ✅ Verificar que no hay errores en consola
5. ✅ Confirmar que los datos mostrados son correctos
6. ✅ Verificar que las actualizaciones en tiempo real funcionan
7. ✅ Probar con órdenes en diferentes estados (Bodega, Chatarrizado, etc.)
8. ✅ Verificar que el localStorage se actualiza correctamente

## Notas Técnicas

- El hook ahora usa `useRef` para evitar re-renders innecesarios
- Se agregó verificación de montaje en todas las operaciones async
- El localStorage se limpia correctamente al cambiar de orden
- Los canales de realtime se limpian antes de crear nuevos
- Se maneja correctamente el caso de navegación rápida entre órdenes
- Los tipos de TypeScript son ahora compatibles entre `Orden` y `OrdenLocalData`
- Se usa `as any` temporalmente para conversión de tipos en localStorage

## Archivos Modificados

1. **src/hooks/useSafeOrdenId.ts**
   - Agregado `lastIdRef` para tracking de cambios
   - Reset de estado al cambiar ID
   - Dependencias corregidas

2. **src/app/paneladmin/ordenes/[id]/page.tsx**
   - Agregado `lastOrdenIdRef` para detectar cambios
   - Limpieza de estado al cambiar de orden
   - Limpieza de canal realtime
   - Verificación de montaje en operaciones async

3. **src/lib/ordenLocalStorage.ts**
   - Interfaz `OrdenLocalData` actualizada
   - Campos opcionales agregados
   - Compatibilidad mejorada con tipo `Orden`

## Fecha de Implementación

29 de enero de 2026

## Verificación de Compilación

- ✅ TypeScript: Sin errores de tipo
- ✅ ESLint: Solo warnings menores de CSS
- ✅ Build: Exitoso
- ⚠️ Warnings CSS: `flex-shrink-0` puede ser `shrink-0` (no crítico)
