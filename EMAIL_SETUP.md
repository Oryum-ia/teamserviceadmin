# 📧 Sistema de Notificaciones por Correo Electrónico

Este documento explica cómo configurar y usar el sistema de notificaciones por correo electrónico en TeamService Costa.

## 🎯 Características

El sistema envía correos automáticos en los siguientes casos:

1. **Confirmación de Orden Creada**: Se envía al cliente cuando se crea una nueva orden
2. **Cambio de Fase**: Se notifica al cliente cada vez que la orden avanza a una nueva fase:
   - Recepción → Diagnóstico
   - Diagnóstico → Cotización
   - Cotización → Reparación
   - Reparación → Finalizada
3. **Respuesta a PQR**: Se envía cuando se responde una Petición, Queja o Reclamo

## 🔧 Configuración Inicial

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# Email Configuration
EMAIL_USER=fede.saus26@gmail.com
EMAIL_PASS=tu_app_password_de_gmail
EMAIL_FROM=TeamService Costa <fede.saus26@gmail.com>

# Tracking URL
NEXT_PUBLIC_TRACKING_URL=https://gleeful-mochi-2bc33c.netlify.app/
```

### 2. Obtener App Password de Gmail

Para usar Gmail con Nodemailer, necesitas una **App Password** (Contraseña de Aplicación):

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Navega a **Seguridad** → **Verificación en dos pasos** (debes tenerla activada)
3. Busca **Contraseñas de aplicaciones** (al final de la página)
4. Selecciona "Correo" y el dispositivo que prefieras
5. Google generará una contraseña de 16 caracteres
6. Copia esa contraseña y úsala en `EMAIL_PASS`

⚠️ **Importante**: NO uses tu contraseña normal de Gmail, usa la App Password generada.

### 3. Instalar Dependencias

Las dependencias ya están instaladas:

```bash
npm install nodemailer @types/nodemailer
```

## 📁 Estructura de Archivos

```
src/
├── lib/
│   ├── email/
│   │   ├── templates.ts          # Plantillas HTML de correos
│   │   └── emailService.ts       # Servicio de envío con Nodemailer
│   └── services/
│       ├── ordenService.ts       # Integración con notificaciones
│       └── emailNotificationService.ts  # Lógica de notificaciones
└── app/
    └── api/
        └── email/
            └── send/
                └── route.ts      # API endpoint para correos
```

## 🚀 Uso

### Envío Automático

El sistema envía correos automáticamente cuando:

- Se crea una orden: `crearOrden()`
- Se avanza a cotización: `avanzarACotizacion()`
- Se avanza a reparación: `avanzarAReparacion()`
- Se finaliza una orden: `finalizarOrden()`

No necesitas hacer nada adicional, las notificaciones se envían automáticamente.

### Envío Manual via API

También puedes enviar correos manualmente llamando al endpoint:

#### Cambio de Fase

```typescript
await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tipo: 'cambio_fase',
    clienteEmail: 'cliente@email.com',
    clienteNombre: 'Juan Pérez',
    ordenId: 'ORD-123456',
    faseActual: 'Reparación'
  })
});
```

#### Confirmación de Orden

```typescript
await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tipo: 'confirmacion_orden',
    clienteEmail: 'cliente@email.com',
    clienteNombre: 'Juan Pérez',
    ordenId: 'ORD-123456',
    fechaCreacion: '15 de noviembre de 2025',
    equipoDescripcion: 'KÄRCHER K5 - Hidrolavadora'
  })
});
```

#### Respuesta a PQR

```typescript
await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tipo: 'respuesta_pqr',
    clienteEmail: 'cliente@email.com',
    clienteNombre: 'Juan Pérez',
    pqrId: 'PQR-123',
    tipoPQR: 'Queja',
    respuesta: 'Hemos revisado tu caso...',
    fechaRespuesta: '15 de noviembre de 2025'
  })
});
```

## 🎨 Plantillas de Correo

Las plantillas HTML incluyen:

- ✅ Diseño responsive para móviles
- 🎨 Colores corporativos con degradados
- 🔗 Link de rastreo de orden
- 📍 Información de contacto
- 🏢 Logo y branding de Team Service Costa

## 🧪 Pruebas

Para probar el sistema:

1. Asegúrate de tener un cliente con email en la base de datos
2. Crea una orden para ese cliente
3. Verifica que recibas el correo de confirmación
4. Avanza la orden a diferentes fases y verifica los correos

## ⚠️ Troubleshooting

### No se envían correos

1. Verifica que las variables de entorno estén configuradas correctamente
2. Comprueba que estés usando una App Password de Gmail, no tu contraseña normal
3. Revisa los logs de la consola del servidor para errores
4. Verifica que el cliente tenga un email válido en la base de datos

### Error de autenticación

```
Error: Invalid login: 535 Authentication failed
```

**Solución**: Genera una nueva App Password en tu cuenta de Google.

### Correos van a spam

**Solución**: 
- Usa un dominio personalizado en lugar de Gmail
- Configura SPF y DKIM records
- Considera usar un servicio de email transaccional (SendGrid, AWS SES)

## 🔒 Seguridad

- ⚠️ NUNCA subas tu `.env.local` al repositorio
- ⚠️ NO compartas tu App Password
- ✅ Usa variables de entorno para credenciales
- ✅ El `.env.local` está incluido en `.gitignore`

## 📈 Mejoras Futuras

Posibles mejoras al sistema:

1. Usar un servicio de email transaccional (SendGrid, AWS SES, Mailgun)
2. Añadir sistema de cola para envíos masivos
3. Implementar plantillas personalizables desde el admin
4. Añadir tracking de apertura de correos
5. Soporte para adjuntos (cotizaciones PDF, fotos)

## 📞 Soporte

Si tienes problemas con el sistema de correos:

1. Revisa este documento completo
2. Verifica la configuración de variables de entorno
3. Consulta los logs del servidor
4. Contacta al equipo de desarrollo

---

**Team Service Costa S.A.S.** | Centro Autorizado KÄRCHER
