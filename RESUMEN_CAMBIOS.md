# Resumen de Cambios - TeamService Costa

## Última Actualización: 29 de Enero de 2026

---

## 🖼️ Fix: Pérdida de Datos al Eliminar Imagen (29 Enero 2026)

### Problema
Al eliminar una imagen de un producto en el modal de creación/edición, se perdían todos los datos del formulario (nombre, descripción, precio, stock, etc.).

### Causa Raíz
Duplicación de estado entre `formData.imagenes` y `imagePreviews` causaba problemas de sincronización. Cuando se eliminaba una imagen, ambos estados se actualizaban, pero podía haber re-renders intermedios que causaban la pérdida de datos.

### Solución
Eliminado el estado duplicado `imagePreviews` y usar solo `formData.imagenes` como fuente única de verdad. Esto previene problemas de sincronización y asegura que todos los datos del formulario se preserven al eliminar imágenes.

### Archivos Modificados
- ✅ `src/components/paneladmin/ProductoTiendaModal.tsx` - Eliminado estado duplicado
- ✅ `docs/FIX_PERDIDA_DATOS_ELIMINAR_IMAGEN.md` - **NUEVO** documentación técnica

### Cambios Implementados
- Eliminado `const [imagePreviews, setImagePreviews]`
- Actualizado `handleEliminarImagen` para usar solo `formData.imagenes`
- Actualizado `handleImageUpload` para actualizar solo `formData.imagenes`
- Actualizado `handleReordenarImagenes` para usar solo `formData.imagenes`
- Actualizado JSX para usar `formData.imagenes` en lugar de `imagePreviews`

---

## 🔐 Fix: Pérdida de Sesión de Usuario (29 Enero 2026)

### Problema
Los usuarios experimentaban pérdida de sesión aleatoria, requiriendo volver a iniciar sesión. El error aparecía como "Error al cargar las órdenes: Revise la consola".

### Requerimiento
**La sesión NO debe expirar NUNCA mientras el usuario esté activo.** Solo debe cerrarse cuando el usuario explícitamente cierre sesión.

### Solución: Sesión Indefinida con Múltiples Capas

#### Estrategia Implementada
1. **Refresco automático cada 15 minutos** (SessionMonitor)
2. **Refresco adicional cada 30 minutos** (supabaseClient)
3. **Refresco en actividad del usuario** (click, tecla, scroll, touch)
4. **Refresco al volver a la pestaña** (visibilitychange)
5. **autoRefreshToken de Supabase** (nativo)

Con estas 5 capas de protección, **la sesión se mantiene activa indefinidamente** mientras el navegador esté abierto.

### Archivos Modificados
- ✅ `src/lib/supabaseClient.ts` - Mejorada configuración de autenticación
- ✅ `src/contexts/AuthContext.tsx` - Agregada sincronización con Supabase Auth
- ✅ `src/lib/services/ordenService.ts` - Agregada verificación de sesión
- ✅ `src/components/SessionMonitor.tsx` - **NUEVO** componente para monitoreo de sesión
- ✅ `src/lib/services/sessionHelper.ts` - **NUEVO** utilidades para manejo de sesión
- ✅ `src/app/layout.tsx` - Integrado SessionMonitor
- ✅ `src/components/paneladmin/OrdenesNuevo.tsx` - Mejorado manejo de errores de sesión
- ✅ `docs/FIX_SESSION_LOSS.md` - **NUEVO** documentación técnica completa

### Cambios Implementados

#### 1. Configuración Mejorada de Supabase Client
```typescript
supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'teamservice-supabase-auth',
    flowType: 'pkce', // Más seguro
  },
  // ...
})
```

#### 2. Sincronización AuthContext con Supabase
- Verificación de sesión de Supabase al iniciar
- Listener para eventos: SIGNED_OUT, TOKEN_REFRESHED, SIGNED_IN
- Sincronización automática entre localStorage y Supabase Auth

#### 3. Monitor de Sesión (SessionMonitor)
- Verifica la sesión cada 5 minutos
- Refresco automático de tokens próximos a expirar (< 10 minutos)
- Verificación al volver a la pestaña (visibilitychange event)

#### 4. Helpers de Sesión
- `verificarSesion()` - Verifica y refresca sesión si es necesario
- `obtenerUsuarioActual()` - Obtiene usuario de la sesión actual
- `tieneSesionValida()` - Verifica sin lanzar error

#### 5. Manejo de Errores Mejorado
- Detección de errores de sesión en componentes
- Redirección automática al login cuando la sesión expira
- Mensajes de error más claros para el usuario

### Beneficios
- ✅ Sesión persistente entre recargas de página
- ✅ Refresco automático de tokens antes de expirar
- ✅ Sincronización entre pestañas
- ✅ Detección temprana de pérdida de sesión
- ✅ Mejor experiencia de usuario con mensajes claros

### Documentación
Ver `docs/FIX_SESSION_LOSS.md` para detalles técnicos completos.

---

## 📦 Campos sub_marca y codigo en producto_tienda (29 Enero 2026)

### Cambios Completados

#### 1. Migración SQL
📁 `migrations/20260129_add_sub_marca_codigo_to_producto_tienda.sql`
- Agrega columna `sub_marca` (TEXT, opcional)
- Agrega columna `codigo` (TEXT, opcional)
- Incluye comentarios de documentación

#### 2. Tipos TypeScript
📁 `src/types/database.types.ts`
```typescript
export interface ProductoTienda {
  // ... campos existentes
  sub_marca?: string; // ✨ NUEVO
  codigo?: string;    // ✨ NUEVO
  // ... más campos
}
```

#### 3. Modal de Producto
📁 `src/components/paneladmin/ProductoTiendaModal.tsx`

**Nuevos campos en el formulario:**
```tsx
{/* Sub-marca y Código */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label>Sub-marca</label>
    <input
      type="text"
      name="sub_marca"
      placeholder="Ej: Pro Series, Home Edition"
    />
  </div>
  
  <div>
    <label>Código</label>
    <input
      type="text"
      name="codigo"
      placeholder="Ej: SKU-12345"
    />
  </div>
</div>
```

**Estado del formulario actualizado:**
- ✅ Agregado `sub_marca` al formData
- ✅ Agregado `codigo` al formData

---

## Historial de Cambios Anteriores

### Otros cambios documentados en:
- `docs/FIX_ERROR_CARGAR_ORDEN.md`
- `docs/FIX_MULTI_USER_SYNC.md`
- `docs/FIX_PANTALLA_BLANCA_NAVEGACION.md`
- `docs/FIX_TIMEZONE_ORDENES.md`
- `docs/FIX_VIDEO_SIZE_LIMIT.md`
- `docs/LOGO_UPDATE.md`
- `docs/MIGRACION_PRODUCTO_TIENDA.md`
- `docs/NOTIFICACIONES_DIAGNOSTICO_REPARACION.md`
- `docs/ORDER_FLOW_AUDIT.md`
