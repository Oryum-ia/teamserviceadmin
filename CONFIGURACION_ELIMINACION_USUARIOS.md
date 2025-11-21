# Configuración para Eliminación de Usuarios

## Problema Resuelto
Anteriormente, al eliminar un usuario desde la tabla de usuarios, solo se eliminaba el registro de la base de datos pero **NO** se eliminaba de la autenticación de Supabase. Esto causaba que el usuario pudiera seguir iniciando sesión.

## Solución Implementada
Ahora la eliminación de usuarios funciona mediante una **API Route** (server-side) que:
1. Elimina el usuario de **Supabase Auth** (autenticación)
2. Elimina el usuario de la **Tabla `usuarios`** (base de datos)

### Arquitectura de la Solución

```
Cliente (Browser)
  ↓
usuarioService.eliminarUsuario(id)
  ↓
fetch('/api/usuarios/[id]', DELETE)
  ↓
API Route (Server-Side)
  ↓
supabaseAdmin.auth.admin.deleteUser(id)  ← Usa Service Role Key
  ↓
supabase.from('usuarios').delete()
```

⚠️ **Por qué usar API Route**: La `SUPABASE_SERVICE_ROLE_KEY` solo está disponible en el servidor (sin prefijo `NEXT_PUBLIC_`), por lo que no puede usarse directamente en el cliente.

## Configuración Requerida

### 1. Obtener la Service Role Key de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Settings** > **API**
3. En la sección **Project API keys**, copia la **`service_role`** key (NO la anon key)
   - ⚠️ **IMPORTANTE**: Esta key tiene permisos de administrador. Nunca la expongas en el frontend.

### 2. Configurar Variables de Entorno

En tu archivo `.env` (o `.env.local`) en la raíz del proyecto, asegúrate de tener:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

⚠️ **Nota de Seguridad**: 
- La `SUPABASE_SERVICE_ROLE_KEY` NO debe tener el prefijo `NEXT_PUBLIC_` 
- Esto asegura que solo esté disponible en el servidor y nunca se exponga al cliente

### 3. Reiniciar el Servidor de Desarrollo

Si el servidor ya estaba corriendo cuando agregaste la variable, reinícialo:

```bash
npm run dev
```

## Verificación

Para verificar que la configuración funciona correctamente:

1. Intenta eliminar un usuario desde la tabla de usuarios
2. Verifica en la consola del navegador que aparezcan los logs:
   - `✅ Usuario eliminado de Supabase Auth`
   - `✅ Usuario eliminado completamente del sistema`
3. Verifica en el Dashboard de Supabase > Authentication > Users que el usuario ya no aparece

## Archivos Creados/Modificados

- ✅ `src/app/api/usuarios/[id]/route.ts` - **NUEVO**: API Route para eliminar usuarios (server-side)
- ✅ `src/lib/supabaseClient.ts` - Agregado cliente admin con Service Role Key
- ✅ `src/lib/services/usuarioService.ts` - Actualizada función `eliminarUsuario()` para llamar a la API route

## Flujo de Eliminación

```
Usuario hace clic en "Eliminar" 
  ↓
Confirmación del modal
  ↓
usuarioService.eliminarUsuario(id) - Cliente
  ↓
fetch('/api/usuarios/[id]', DELETE) - HTTP Request
  ↓
API Route (Server-Side)
  ↓
1. supabaseAdmin.auth.admin.deleteUser(id) - Elimina de Auth
  ↓
2. supabase.from('usuarios').delete() - Elimina de tabla
  ↓
Usuario completamente eliminado ✅
```

## Troubleshooting

### Error: "Cliente admin no disponible"
- **Causa**: La variable `SUPABASE_SERVICE_ROLE_KEY` no está configurada
- **Solución**: Verifica que hayas agregado la key en `.env.local` y reiniciado el servidor

### Error: "Error al eliminar de autenticación"
- **Causa**: La Service Role Key es incorrecta o no tiene permisos
- **Solución**: Verifica que copiaste la key correcta desde el Dashboard de Supabase

### El usuario sigue apareciendo en Auth
- **Causa**: La eliminación de Auth falló pero la de la tabla sí
- **Solución**: Elimina manualmente desde el Dashboard de Supabase > Authentication > Users
