# Sistema de Notificaciones para Diagnóstico y Reparación Completados

## 📋 Descripción

Este sistema notifica automáticamente a los administradores cuando un técnico completa un diagnóstico o una reparación.

## 🚀 Instalación

### 1. Aplicar Migración SQL en Supabase

Ejecuta el archivo `migrations/20251209_notificaciones_diagnostico_reparacion.sql` en tu proyecto de Supabase:

1. Ve a Supabase Dashboard → SQL Editor
2. Copia y pega el contenido del archivo de migración
3. Ejecuta el script

Esto creará:
- ✅ Tabla `notificaciones`
- ✅ Función `crear_notificacion()`
- ✅ Función `notificar_diagnostico_completado()`
- ✅ Función `notificar_reparacion_completada()`
- ✅ Triggers automáticos en la tabla `ordenes`
- ✅ Políticas RLS para seguridad

### 2. Actualizar NotificationContext.tsx

Agrega los nuevos tipos de notificaciones en el `parseNotificationData`:

```typescript
case 'diagnostico_completado':
  return {
    diagnosticoInfo: {
      ordenId: datosAdicionales.orden_id || '',
      ordenCodigo: datosAdicionales.orden_codigo || '',
      tecnicoId: datosAdicionales.tecnico_id || '',
      tecnicoNombre: datosAdicionales.tecnico_nombre || '',
      fechaCompletado: datosAdicionales.fecha_completado || '',
    },
  };
case 'reparacion_completada':
  return {
    reparacionInfo: {
      ordenId: datosAdicionales.orden_id || '',
      ordenCodigo: datosAdicionales.orden_codigo || '',
      tecnicoId: datosAdicionales.tecnico_id || '',
      tecnicoNombre: datosAdicionales.tecnico_nombre || '',
      fechaCompletado: datosAdicionales.fecha_completado || '',
    },
  };
```

Y actualiza el `mapSupabaseNotification` para soportar el nuevo esquema:

```typescript
const mapSupabaseNotification = useCallback((record: any): Notification => ({
  id: record.id,
  type: record.tipo,
  title: record.titulo,
  message: record.mensaje,
  timestamp: new Date(record.created_at),
  isRead: record.leida,
  referenciaId: record.referencia_id || record.orden_id?.toString(),
  referenciaTipo: record.referencia_tipo || (record.orden_id ? 'orden' : undefined),
  data: parseNotificationData(record.tipo, record.datos_adicionales || record.metadata),
}), [parseNotificationData]);
```

### 3. Actualizar tipos de TypeScript

Agrega los nuevos tipos en `src/types/notifications.ts`:

```typescript
export interface DiagnosticoInfo {
  ordenId: string;
  ordenCodigo: string;
  tecnicoId: string;
  tecnicoNombre: string;
  fechaCompletado: string;
}

export interface ReparacionInfo {
  ordenId: string;
  ordenCodigo: string;
  tecnicoId: string;
  tecnicoNombre: string;
  fechaCompletado: string;
}

// Actualizar NotificationData
export interface NotificationData {
  diagnosticoInfo?: DiagnosticoInfo;
  reparacionInfo?: ReparacionInfo;
  // ... otros tipos existentes
}
```

## 🔔 Cómo Funciona

### Flujo Automático

1. **Técnico completa diagnóstico**:
   - Se actualiza `fecha_fin_diagnostico` en la tabla `ordenes`
   - El trigger `trigger_notificar_diagnostico_completado` se activa
   - Se crea una notificación para todos los admins y super-admins activos

2. **Técnico completa reparación**:
   - Se actualiza `fecha_fin_reparacion` en la tabla `ordenes`
   - El trigger `trigger_notificar_reparacion_completada` se activa
   - Se crea una notificación para todos los admins y super-admins activos

3. **Notificación en tiempo real**:
   - El `NotificationContext` escucha cambios en la tabla `notificaciones`
   - Las notificaciones aparecen automáticamente en el `NotificationBell`
   - Los administradores ven un badge con el conteo de notificaciones no leídas

### Ejemplo de Notificación

**Diagnóstico Completado:**
```
Título: ✅ Diagnóstico Completado
Mensaje: El técnico Juan Pérez ha completado el diagnóstico de la orden ORD-123456
Metadata: {
  tecnico_id: "uuid-del-tecnico",
  tecnico_nombre: "Juan Pérez",
  orden_codigo: "ORD-123456",
  fecha_completado: "2025-12-09T10:30:00Z"
}
```

**Reparación Completada:**
```
Título: 🔧 Reparación Completada
Mensaje: El técnico María García ha completado la reparación de la orden ORD-123456
Metadata: {
  tecnico_id: "uuid-del-tecnico",
  tecnico_nombre: "María García",
  orden_codigo: "ORD-123456",
  fecha_completado: "2025-12-09T15:45:00Z"
}
```

## 🎨 Personalización

### Cambiar destinatarios de notificaciones

Edita las funciones en la migración SQL para cambiar quién recibe las notificaciones:

```sql
-- Notificar solo a super-admins
WHERE rol = 'super-admin'

-- Notificar a todos los usuarios
WHERE activo = TRUE

-- Notificar a usuarios de una sede específica
WHERE sede = 'Montería' AND rol IN ('admin', 'super-admin')
```

### Agregar más información a las notificaciones

Modifica el `jsonb_build_object` en las funciones SQL:

```sql
jsonb_build_object(
  'tecnico_id', NEW.tecnico_diagnostico,
  'tecnico_nombre', v_tecnico_nombre,
  'orden_codigo', v_orden_codigo,
  'fecha_completado', NEW.fecha_fin_diagnostico,
  'cliente_nombre', v_cliente_nombre,  -- Agregar más datos
  'equipo_tipo', v_equipo_tipo
)
```

## 🧪 Pruebas

### Probar notificación de diagnóstico

```sql
-- Simular completar un diagnóstico
UPDATE ordenes
SET 
  fecha_fin_diagnostico = NOW(),
  tecnico_diagnostico = 'uuid-del-tecnico'
WHERE id = 123;
```

### Probar notificación de reparación

```sql
-- Simular completar una reparación
UPDATE ordenes
SET 
  fecha_fin_reparacion = NOW(),
  tecnico_repara = 'uuid-del-tecnico'
WHERE id = 123;
```

### Verificar notificaciones creadas

```sql
SELECT * FROM notificaciones
ORDER BY created_at DESC
LIMIT 10;
```

## 📊 Monitoreo

### Ver notificaciones por tipo

```sql
SELECT tipo, COUNT(*) as total
FROM notificaciones
GROUP BY tipo
ORDER BY total DESC;
```

### Ver notificaciones no leídas por usuario

```sql
SELECT u.nombre, COUNT(n.id) as no_leidas
FROM usuarios u
LEFT JOIN notificaciones n ON n.usuario_id = u.id AND n.leida = FALSE
WHERE u.rol IN ('admin', 'super-admin')
GROUP BY u.id, u.nombre
ORDER BY no_leidas DESC;
```

## 🔧 Troubleshooting

### Las notificaciones no aparecen

1. Verifica que los triggers estén activos:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%notificar%';
```

2. Verifica que las funciones existan:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE '%notificar%';
```

3. Verifica las políticas RLS:
```sql
SELECT * FROM pg_policies WHERE tablename = 'notificaciones';
```

### Los usuarios no ven las notificaciones

1. Verifica que el usuario esté autenticado
2. Verifica que las políticas RLS permitan el acceso
3. Revisa la consola del navegador para errores de Supabase Realtime

## 📝 Notas Adicionales

- Las notificaciones se crean **solo cuando cambia** `fecha_fin_diagnostico` o `fecha_fin_reparacion` de NULL a un valor
- Los triggers usan `SECURITY DEFINER` para ejecutarse con permisos elevados
- Las políticas RLS garantizan que cada usuario solo vea sus propias notificaciones
- El sistema es completamente automático, no requiere intervención manual

## 🔄 Próximas Mejoras

- [ ] Notificaciones por email cuando se completa una fase
- [ ] Notificaciones push en dispositivos móviles
- [ ] Configuración de preferencias de notificaciones por usuario
- [ ] Resumen diario de notificaciones
- [ ] Notificaciones para otras fases (cotización, entrega)
