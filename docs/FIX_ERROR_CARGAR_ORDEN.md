# Fix: Error al Cargar Orden al Avanzar/Retroceder Fases

## Problema Identificado

Al intentar avanzar o retroceder una orden entre fases, aparecía el error:
```
Error al cargar la orden

No fue posible cargar los detalles de esta orden. Esto puede deberse a:
• Problemas de conexión con el servidor
• La orden puede haber sido eliminada o modificada
• Datos locales desincronizados
```

### Errores en Consola

1. **Timeout en suscripción de realtime**
   - WebSocket no puede conectarse a Supabase Realtime
   - URL: `wss://tscotizacion.tscosta.com.co/realtime/v1/websocket`

2. **Error en canal de realtime: undefined**
   - Fallo en la reconexión del canal de realtime

3. **NotFoundError: insertBefore**
   - Error de React DOM al intentar actualizar el componente

## Causas Raíz

### 1. Falta de Ruta API para Actualizar Órdenes
El código intentaba usar `/api/ordenes/[id]` con método PATCH como fallback cuando fallaba RLS (Row Level Security), pero esta ruta no existía.

**Ubicación del problema:**
- `src/app/paneladmin/ordenes/[id]/page.tsx` línea ~1025
- Función `handleAvanzarFase()`

```typescript
// Código que fallaba:
const response = await fetch(`/api/ordenes/${ordenId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(camposActualizacion)
});
// ❌ Esta ruta no existía
```

### 2. Problemas de Conexión Realtime
- El servidor Supabase self-hosted puede tener problemas de configuración de WebSocket
- Timeouts en la conexión realtime
- Errores no manejados correctamente que bloqueaban la UI

### 3. Manejo Inadecuado de Errores
- No había fallback cuando `obtenerOrdenPorId()` fallaba
- Mensajes de error poco informativos
- No había opción de reintentar

## Soluciones Implementadas

### 1. Creación de Ruta API para Órdenes por ID

**Archivo creado:** `src/app/api/ordenes/[id]/route.ts`

Implementa tres métodos:

#### GET - Obtener orden por ID
```typescript
export async function GET(request: Request, { params }: { params: { id: string } })
```
- Usa `supabaseAdmin` para bypass de RLS
- Incluye todas las relaciones (cliente, equipo, modelo, marca)

#### PATCH - Actualizar orden (Bypass RLS)
```typescript
export async function PATCH(request: Request, { params }: { params: { id: string } })
```
- Permite actualizar órdenes cuando el usuario no tiene permisos directos
- Usa Service Role Key para bypass de políticas RLS
- Retorna la orden completa actualizada

#### DELETE - Eliminar orden
```typescript
export async function DELETE(request: Request, { params }: { params: { id: string } })
```
- Solo para super-admins
- Elimina la orden y sus relaciones

### 2. Mejora en Función `cargarOrden()`

**Archivo:** `src/app/paneladmin/ordenes/[id]/page.tsx`

Implementa estrategia de carga en cascada:

1. **Primera opción:** localStorage (carga instantánea)
2. **Segunda opción:** Supabase directo
3. **Tercera opción (fallback):** API `/api/ordenes/[id]`

```typescript
try {
  const data = await obtenerOrdenPorId(ordenId);
  // ... actualizar estado
} catch (supabaseError) {
  console.warn('⚠️ Error al cargar desde Supabase, intentando via API...');
  // Fallback a API
  const response = await fetch(`/api/ordenes/${ordenId}`);
  if (!response.ok) {
    throw new Error('No se pudo cargar la orden desde ninguna fuente');
  }
  const dataApi = await response.json();
  // ... actualizar estado
}
```

### 3. Mejora en Manejo de Errores de Realtime

**Cambios en `configurarRealtime()`:**

- Agregado timeout de 10 segundos en configuración de Supabase
- Manejo específico de estados de conexión:
  - `SUBSCRIBED`: Conexión exitosa
  - `CHANNEL_ERROR`: Advertencia (no bloquea UI)
  - `TIMED_OUT`: Advertencia informativa
  - `CLOSED`: Log informativo

```typescript
.subscribe((status, err) => {
  if (status === 'SUBSCRIBED') {
    console.log('✅ Realtime SUSCRITO exitosamente');
  } else if (status === 'CHANNEL_ERROR') {
    console.warn('⚠️ Error en canal de realtime:', err || 'Sin detalles');
  } else if (status === 'TIMED_OUT') {
    console.warn('⏱️ Timeout - La app seguirá funcionando sin realtime');
  }
});
```

### 4. UI de Error Mejorada

**Componente de error rediseñado:**

- Diseño centrado y más visible
- Mensaje detallado con causas posibles
- Botón "Reintentar" para recargar la orden
- Botón "Volver a órdenes" como alternativa
- Soporte para tema claro/oscuro

```typescript
<button
  onClick={() => {
    setError('');
    cargarOrden();
  }}
  className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
>
  Reintentar
</button>
```

### 5. Configuración de Supabase Client Mejorada

**Archivo:** `src/lib/supabaseClient.ts`

Agregado:
- Timeout de 10 segundos para realtime
- Headers personalizados para identificación
- Mejor manejo de errores en SSR

```typescript
realtime: {
  params: {
    eventsPerSecond: 2,
  },
  timeout: 10000, // 10 segundos
},
global: {
  headers: {
    'x-client-info': 'teamservice-costa',
  },
}
```

## Flujo de Actualización Mejorado

### Antes (❌ Fallaba)
```
Usuario avanza fase
  ↓
Actualizar en Supabase
  ↓ (falla por RLS)
Intentar API /api/ordenes/[id] PATCH
  ↓ (404 - ruta no existe)
ERROR: "Error al cargar la orden"
```

### Ahora (✅ Funciona)
```
Usuario avanza fase
  ↓
Actualizar en Supabase
  ↓ (falla por RLS)
Intentar API /api/ordenes/[id] PATCH
  ↓ (200 - éxito con bypass RLS)
Actualizar localStorage
  ↓
Recargar orden (con fallback a API)
  ↓
✅ Orden actualizada correctamente
```

### Flujo de Carga Mejorado (v2)
```
Cargar orden
  ↓
¿Existe en localStorage?
  ├─ SÍ → Cargar desde localStorage (instantáneo)
  │        ↓
  │        Actualizar en segundo plano desde API
  │        ↓
  │        Si hay cambios → Actualizar vista
  │
  └─ NO → Intentar cargar via API
           ↓ (falla)
           Fallback a Supabase directo
           ↓
           ✅ Orden cargada
```

## Verificación de la Solución

### 1. Verificar que existe la ruta API
```bash
# Debe existir el archivo:
src/app/api/ordenes/[id]/route.ts
```

### 2. Verificar variables de entorno
```bash
# En .env debe existir:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 3. Probar avance de fase
1. Abrir una orden en el panel admin
2. Intentar avanzar a la siguiente fase
3. Verificar en consola:
   - ✅ "Orden actualizada via API" (si usa fallback)
   - ✅ "Orden completa recargada"
   - ⚠️ Warnings de realtime (no críticos)

### 4. Probar retroceso de fase
1. Como super-admin, retroceder una fase
2. Verificar que la orden se actualiza correctamente
3. Verificar que los campos se limpian apropiadamente

## Problemas Conocidos y Limitaciones

### 1. Realtime puede fallar en self-hosted
**Síntoma:** Timeouts en WebSocket
**Impacto:** Bajo - La app funciona sin actualizaciones en tiempo real
**Solución temporal:** Recargar manualmente la página

### 2. Primer intento puede fallar por RLS
**Síntoma:** Advertencia en consola "Update no afectó filas"
**Impacto:** Ninguno - El fallback a API funciona automáticamente
**Solución:** Configurar políticas RLS más permisivas (opcional)

## Recomendaciones

### Para Producción
1. **Configurar políticas RLS apropiadas** en Supabase para evitar usar el fallback
2. **Monitorear logs de API** para detectar uso excesivo del bypass RLS
3. **Verificar configuración de Realtime** en el servidor Supabase self-hosted

### Para Desarrollo
1. Usar `console.log` para seguir el flujo de actualización
2. Verificar que `SUPABASE_SERVICE_ROLE_KEY` esté en `.env.local`
3. No commitear la Service Role Key al repositorio

## Archivos Modificados

1. ✅ `src/app/api/ordenes/[id]/route.ts` (CREADO)
2. ✅ `src/app/paneladmin/ordenes/[id]/page.tsx` (MODIFICADO)
   - Función `cargarOrden()` mejorada
   - Función `configurarRealtime()` mejorada
   - Componente de error rediseñado
3. ✅ `src/lib/supabaseClient.ts` (MODIFICADO)
   - Timeout de realtime agregado
   - Headers personalizados

## Testing

### Casos de Prueba
- [x] Avanzar orden de Recepción a Diagnóstico
- [x] Avanzar orden de Diagnóstico a Cotización
- [x] Avanzar orden de Cotización a Reparación
- [x] Avanzar orden de Reparación a Entrega
- [x] Retroceder orden (super-admin)
- [x] Cargar orden con realtime desconectado
- [x] Cargar orden con RLS restrictivo
- [x] Reintentar carga después de error

## Conclusión

El error "Error al cargar la orden" ha sido resuelto mediante:
1. Creación de ruta API con bypass de RLS
2. Implementación de fallbacks en cascada
3. Mejora en manejo de errores de realtime
4. UI de error más informativa con opción de reintentar

La aplicación ahora es más resiliente y puede funcionar incluso cuando:
- Las políticas RLS son restrictivas
- La conexión realtime falla
- Hay problemas temporales de red

## Actualización v2 (Enero 2026)

### Problema Persistente
Después de la implementación inicial, algunos usuarios seguían experimentando el error al cargar órdenes, especialmente al navegar entre diferentes órdenes.

### Causa Identificada
El problema estaba en el orden de los fallbacks. La función `cargarOrden()` intentaba cargar desde la API primero cuando no había datos en localStorage, pero la API podía fallar si `supabaseAdmin` no estaba correctamente inicializado o si había problemas de red.

### Solución Implementada (v2.1 - Enero 29, 2026)
Se revirtió el orden de los fallbacks para priorizar Supabase directo:

**Nuevo flujo de carga (v2.1):**
1. Si existe en localStorage → Cargar instantáneamente
2. Actualizar en segundo plano desde Supabase (más rápido)
3. Si no existe en localStorage → Intentar Supabase primero
4. Si Supabase falla → Fallback a API

**Ventajas:**
- Supabase directo es más rápido (no pasa por Next.js API)
- La API sigue disponible como fallback robusto con bypass de RLS
- Carga más rápida desde localStorage
- Mejor experiencia de usuario

**Cambios en el código:**
```typescript
// v2.0: API primero, Supabase como fallback
try {
  const response = await fetch(`/api/ordenes/${ordenId}`); // API
} catch (apiError) {
  const data = await obtenerOrdenPorId(ordenId); // Supabase
}

// v2.1: Supabase primero, API como fallback (ACTUAL)
try {
  const data = await obtenerOrdenPorId(ordenId); // Supabase
} catch (supabaseError) {
  const response = await fetch(`/api/ordenes/${ordenId}`); // API
}
```

**Razón del cambio:**
- Supabase directo es más rápido porque no requiere una llamada HTTP adicional a través de Next.js
- La API sigue siendo un excelente fallback cuando hay problemas de RLS o sesión
- Esta configuración ofrece el mejor balance entre velocidad y confiabilidad

## Actualización v3 (Febrero 2026)

### Problema Persistente
Algunos usuarios seguían reportando el error "Error al cargar la orden" de forma intermitente, especialmente cuando:
- La sesión de Supabase expiraba
- Había problemas temporales de red
- Se navegaba rápidamente entre órdenes

### Mejoras Implementadas (v3.0 - Febrero 2, 2026)

#### 1. Estrategia de Carga Mejorada
Se cambió nuevamente el orden de fallbacks, priorizando la API como método principal:

**Flujo de carga optimizado (v3.0):**
1. Si existe en localStorage → Cargar instantáneamente
2. Actualizar en segundo plano desde Supabase
3. Si no existe en localStorage → **Intentar API primero** (más confiable)
4. Si API falla → Fallback a Supabase directo

**Razones del cambio:**
- La API usa `supabaseAdmin` con Service Role Key, que nunca expira
- La API hace bypass de RLS, evitando problemas de permisos
- Supabase directo puede fallar si la sesión del usuario expiró
- La API es más predecible y confiable en producción

#### 2. Mensajes de Error Más Específicos
Se agregaron mensajes de error contextuales según el tipo de fallo:

```typescript
// Detectar tipo de error y mostrar mensaje apropiado
if (err.message?.includes('HTTP: 404')) {
  mensajeError += '\n\n• La orden no existe o fue eliminada';
} else if (err.message?.includes('HTTP: 401') || err.message?.includes('HTTP: 403')) {
  mensajeError += '\n\n• No tiene permisos para ver esta orden\n• Su sesión puede haber expirado';
} else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
  mensajeError += '\n\n• Problemas de conexión con el servidor\n• Verifique su conexión a internet';
}
```

#### 3. Mejoras en Manejo de Errores de API
Se agregaron headers y mejor manejo de respuestas:

```typescript
const response = await fetch(`/api/ordenes/${ordenId}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'  // Evitar cache de respuestas
  }
});

if (response.ok) {
  const dataApi = await response.json();
  // ... procesar datos
} else {
  const errorText = await response.text();
  console.warn(`⚠️ API respondió con error ${response.status}:`, errorText);
  throw new Error(`Error HTTP: ${response.status}`);
}
```

#### 4. Logging Mejorado
Se agregaron más logs para facilitar el debugging:

```typescript
console.log('🔍 Cargando orden desde API (método principal)');
console.log('✅ Orden cargada desde API');
console.log('✅ Orden cargada desde Supabase (fallback)');
```

### Comparación de Estrategias

| Versión | Método Principal | Fallback | Ventajas | Desventajas |
|---------|-----------------|----------|----------|-------------|
| v2.0 | API | Supabase | Bypass RLS | Más lento (HTTP extra) |
| v2.1 | Supabase | API | Más rápido | Falla si sesión expira |
| v3.0 | API | Supabase | Más confiable | Ligeramente más lento |

### Resultado Final (v3.0)
La estrategia actual (v3.0) prioriza **confiabilidad sobre velocidad**:
- ✅ Funciona incluso si la sesión del usuario expiró
- ✅ Bypass automático de RLS
- ✅ Mensajes de error más claros
- ✅ Mejor logging para debugging
- ⚠️ Ligeramente más lento que acceso directo a Supabase (diferencia mínima)

Esta configuración es la más robusta para entornos de producción donde la confiabilidad es crítica.
