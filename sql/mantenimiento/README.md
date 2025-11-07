# Sistema de Notificaciones de Mantenimiento Automático

Este sistema envía recordatorios automáticos a los clientes **un día antes** de la fecha programada de mantenimiento de sus equipos.

## 📋 Componentes del Sistema

### 1. Base de Datos (Supabase)
- **Campo nuevo**: `fecha_proximo_mantenimiento` en tabla `ordenes`
- **Funciones SQL**: 
  - `verificar_mantenimientos_proximos()` - Crea notificaciones para mantenimientos de mañana
  - `obtener_notificaciones_mantenimiento_pendientes()` - Lista notificaciones sin enviar
  - `marcar_notificacion_email_enviado()` - Marca notificación como enviada
- **Tabla**: `notificaciones` - Almacena todas las notificaciones del sistema

### 2. Frontend (EntregaForm)
- Campo de fecha para programar próximo mantenimiento
- Guardado automático al perder foco (onBlur)
- Indicador visual de que se enviará recordatorio

### 3. Backend (API Routes)
- **`/api/email/send`** - Endpoint para enviar correos (ya existente, extendido)
- **`/api/mantenimiento/procesar`** - Endpoint para procesar notificaciones diariamente

### 4. Templates de Email
- Plantilla HTML profesional con diseño responsivo
- Información del equipo, fecha y botón de acción
- Tips sobre importancia del mantenimiento preventivo

## 🚀 Instalación y Configuración

### Paso 1: Ejecutar Scripts SQL en Supabase

1. Abre el **SQL Editor** en tu Dashboard de Supabase
2. Ejecuta los scripts en este orden:

```bash
# 1. Crear funciones y agregar columna
sql/mantenimiento/01_crear_funciones_mantenimiento.sql

# 2. Configurar cron job
sql/mantenimiento/02_configurar_cron_job.sql
```

**IMPORTANTE**: Antes de ejecutar el segundo script, habilita la extensión `pg_cron`:
- Ve a **Database > Extensions**
- Busca `pg_cron` y haz clic en **Enable**

### Paso 2: Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# Existentes (deben estar configuradas)
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASS=tu-app-password-de-gmail
EMAIL_FROM=tu-correo@gmail.com
NEXT_PUBLIC_TRACKING_URL=https://tu-sitio.netlify.app/

# Nueva (opcional pero recomendada para seguridad)
CRON_SECRET_TOKEN=genera-un-token-aleatorio-seguro

# URL de tu aplicación (para llamadas internas)
NEXT_PUBLIC_APP_URL=https://tu-sitio-admin.com
```

### Paso 3: Ajustar Horario del Cron Job

El cron job está configurado para ejecutarse a las **8:00 AM hora del servidor (UTC)**.

**Para Colombia (UTC-5):**
- Si quieres que se ejecute a las 8:00 AM hora Colombia, usa: `'0 13 * * *'`
- Si quieres que se ejecute a las 9:00 AM hora Colombia, usa: `'0 14 * * *'`

Edita el script `02_configurar_cron_job.sql` línea 43:

```sql
SELECT cron.schedule(
    'verificar_mantenimientos_diario',
    '0 13 * * *',  -- <-- Cambia este valor
    $$SELECT public.verificar_mantenimientos_proximos();$$
);
```

## 🔄 Métodos de Ejecución

### Opción A: pg_cron en Supabase (Recomendado)

✅ **Ventajas**: Automático, confiable, sin dependencias externas

El job de pg_cron se ejecuta automáticamente cada día. Para verificar:

```sql
-- Ver jobs activos
SELECT * FROM cron.job WHERE jobname = 'verificar_mantenimientos_diario';

-- Ver historial de ejecuciones
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'verificar_mantenimientos_diario')
ORDER BY start_time DESC 
LIMIT 20;
```

**Limitación**: pg_cron solo crea las notificaciones en la BD, pero NO envía los correos automáticamente. Para enviar correos, necesitas la Opción B o C.

### Opción B: Cron Job Externo (Recomendado para envío de emails)

Usa un servicio de cron externo para llamar al endpoint `/api/mantenimiento/procesar` diariamente:

**Servicios gratuitos recomendados:**
1. **cron-job.org** (gratuito, fácil de usar)
2. **EasyCron** (gratuito con limitaciones)
3. **GitHub Actions** (gratuito para repositorios públicos)

**Configuración en cron-job.org:**
1. Regístrate en https://cron-job.org
2. Crea un nuevo cron job:
   - URL: `https://tu-sitio.com/api/mantenimiento/procesar`
   - Método: GET
   - Schedule: `0 8 * * *` (8:00 AM diario)
   - Headers: `Authorization: Bearer tu-token-secreto`

### Opción C: GitHub Actions (Automatización CI/CD)

Crea `.github/workflows/mantenimiento-cron.yml`:

```yaml
name: Procesar Notificaciones de Mantenimiento

on:
  schedule:
    - cron: '0 13 * * *'  # 8:00 AM Colombia (UTC-5)
  workflow_dispatch:  # Permite ejecución manual

jobs:
  procesar-notificaciones:
    runs-on: ubuntu-latest
    steps:
      - name: Llamar endpoint de mantenimiento
        run: |
          curl -X GET "https://tu-sitio.com/api/mantenimiento/procesar" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}"
```

## 🧪 Pruebas y Debugging

### Prueba Manual (Sin esperar al cron)

**Desde Supabase SQL Editor:**

```sql
-- Crear notificaciones manualmente
SELECT * FROM public.verificar_mantenimientos_proximos();

-- Ver notificaciones creadas
SELECT * FROM public.obtener_notificaciones_mantenimiento_pendientes();

-- Probar con una orden específica (para testing)
-- Cambiar fecha de mantenimiento a mañana
UPDATE ordenes 
SET fecha_proximo_mantenimiento = CURRENT_DATE + INTERVAL '1 day'
WHERE codigo = 'TS-2024-001';  -- Reemplaza con un código real
```

**Desde el navegador/Postman:**

```bash
# GET request al endpoint
GET https://tu-sitio.com/api/mantenimiento/procesar
Headers:
  Authorization: Bearer tu-token-secreto
```

**Desde la consola del navegador (si estás logueado en el admin):**

```javascript
fetch('/api/mantenimiento/procesar', {
  headers: {
    'Authorization': 'Bearer tu-token-secreto'
  }
}).then(r => r.json()).then(console.log);
```

### Ver logs en tiempo real

**En desarrollo (localhost):**
- Los logs aparecerán en la terminal donde ejecutas `npm run dev`

**En producción (Vercel/Netlify):**
- Vercel: Dashboard > Functions > Logs
- Netlify: Dashboard > Functions > Logs

## 📧 Personalización del Email

Edita `src/lib/email/templates.ts` para personalizar:

1. **Colores y estilos**: Modifica `baseStyles`
2. **Contenido**: Edita la función `templateRecordatorioMantenimiento`
3. **Información de contacto**: Actualiza el footer con tus datos reales

## 📊 Monitoreo

### Verificar que el sistema funciona

1. **Notificaciones creadas**:
```sql
SELECT COUNT(*) as total, DATE(created_at) as fecha
FROM notificaciones 
WHERE referencia_tipo = 'orden_mantenimiento'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

2. **Emails enviados**:
```sql
SELECT 
  datos_adicionales->>'orden_codigo' as orden,
  datos_adicionales->>'cliente_email' as email,
  (datos_adicionales->>'email_enviado')::boolean as enviado,
  created_at
FROM notificaciones 
WHERE referencia_tipo = 'orden_mantenimiento'
ORDER BY created_at DESC
LIMIT 10;
```

3. **Errores en el cron**:
```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed'
ORDER BY start_time DESC;
```

## ⚠️ Solución de Problemas

### El cron job no se ejecuta
- Verifica que `pg_cron` esté habilitado en Extensions
- Revisa que el job esté activo: `SELECT active FROM cron.job WHERE jobname = 'verificar_mantenimientos_diario'`
- Ejecuta manualmente: `SELECT public.verificar_mantenimientos_proximos();`

### Se crean notificaciones pero no se envían emails
- El cron job de Supabase solo crea notificaciones
- Debes configurar un cron externo (Opción B o C) para enviar emails
- O llamar manualmente: `GET /api/mantenimiento/procesar`

### Los emails no llegan
- Verifica variables de entorno: `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- Revisa que uses un App Password de Gmail (no tu contraseña normal)
- Revisa logs del servidor para errores de SMTP
- Verifica que `datos_adicionales->>'email_enviado'` sea `true` en la BD

### Error "No autorizado" al llamar el endpoint
- Verifica que el header `Authorization: Bearer TOKEN` esté correcto
- Asegúrate de que `CRON_SECRET_TOKEN` esté en las variables de entorno
- Para pruebas, puedes comentar temporalmente la validación del token

## 🔐 Seguridad

1. **Protege el endpoint** con un token secreto fuerte
2. **No expongas** el token en el código fuente (usa variables de entorno)
3. **Limita las llamadas** al endpoint (considera rate limiting)
4. **Logs**: No registres información sensible (emails, datos personales)

## 📝 Checklist de Configuración

- [ ] Scripts SQL ejecutados en Supabase
- [ ] Extensión `pg_cron` habilitada
- [ ] Variables de entorno configuradas
- [ ] Horario del cron ajustado a tu zona horaria
- [ ] Cron job externo configurado (para envío de emails)
- [ ] Prueba manual realizada exitosamente
- [ ] Email de prueba recibido
- [ ] Monitoreo configurado

## 🎯 Próximos Pasos (Opcional)

- [ ] Agregar notificaciones por WhatsApp (usando API de WhatsApp Business)
- [ ] Permitir que clientes reagenden desde el email
- [ ] Dashboard de estadísticas de mantenimientos
- [ ] Notificaciones push en la app móvil
- [ ] Recordatorio adicional el día del mantenimiento

## 📞 Soporte

Si tienes problemas, revisa:
1. Logs de Supabase (SQL Editor > Run query)
2. Logs de tu aplicación (consola del servidor)
3. Historial de cron jobs (`cron.job_run_details`)
4. Documentación de pg_cron: https://github.com/citusdata/pg_cron

---

**Desarrollado para Team Service Costa S.A.S.**  
Sistema de gestión de mantenimientos preventivos v1.0
