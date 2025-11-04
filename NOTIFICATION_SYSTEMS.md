# 📢 Sistemas de Notificación - Team Service Costa

Este documento describe los dos sistemas de notificación implementados: **Email** y **WhatsApp**.

## 📧 Sistema de Correo Electrónico

### ✅ Implementado

- ✅ Servicio de envío con Nodemailer + Gmail
- ✅ Plantillas HTML profesionales y responsive
- ✅ Notificaciones automáticas por correo
- ✅ API endpoint para envío manual
- ✅ Integración con ordenService

### 📬 Tipos de Correos

1. **Orden Creada** - Confirmación con ID y link de rastreo
2. **Cambio de Fase** - Notificación en cada cambio de estado
3. **Respuesta a PQR** - Respuestas a peticiones, quejas y reclamos

### 🔧 Configuración Requerida

```env
EMAIL_USER=fede.saus26@gmail.com
EMAIL_PASS=tu_app_password_de_gmail
EMAIL_FROM=TeamService Costa <fede.saus26@gmail.com>
NEXT_PUBLIC_TRACKING_URL=https://gleeful-mochi-2bc33c.netlify.app/
```

### 📖 Documentación

Ver: `EMAIL_SETUP.md` para detalles completos

---

## 💬 Sistema de WhatsApp

### ✅ Implementado

- ✅ Generación de URLs para WhatsApp Web
- ✅ Plantillas de mensajes con emojis
- ✅ Componentes React reutilizables
- ✅ Hook personalizado `useWhatsApp`
- ✅ Helpers para notificaciones automáticas
- ✅ Panel de notificaciones completo

### 📱 Tipos de Mensajes

1. **Orden Creada** - Confirmación inicial
2. **Cambio de Fase** - Notificación de progreso
3. **Cotización Lista** - Mensaje especial con total y link
4. **Equipo Listo** - Notificación de entrega
5. **Seguimiento General** - Mensajes personalizados
6. **Respuesta PQR** - Respuestas a solicitudes

### 🎨 Componentes Disponibles

```tsx
// Botón básico
<WhatsAppButton telefono="573001234567" mensaje="Hola" />

// Botón de notificación
<WhatsAppNotificacionButton 
  telefono="573001234567" 
  mensaje={mensaje}
  faseActual="Reparación"
/>

// Botón de cotización
<WhatsAppCotizacionButton 
  telefono="573001234567" 
  mensaje={mensajeCotizacion}
/>

// Panel completo
<WhatsAppNotificationPanel 
  orden={orden}
  mostrarCotizacion={true}
/>
```

### 🔧 No Requiere Configuración

El sistema de WhatsApp funciona solo con el `NEXT_PUBLIC_TRACKING_URL` que ya está configurado.

### 📖 Documentación

Ver: `WHATSAPP_SETUP.md` para detalles completos

---

## 🔄 Flujo de Notificaciones

### Cuando se crea una orden:

1. ✅ **Email** - Se envía automáticamente
2. ⚠️ **WhatsApp** - Se puede abrir manualmente desde el componente

### Cuando cambia de fase:

1. ✅ **Email** - Se envía automáticamente
2. ⚠️ **WhatsApp** - Se puede abrir manualmente con botón

### Cuando se envía cotización:

1. 📧 **Email** - Usar API endpoint manualmente
2. 💬 **WhatsApp** - Usar botón especial de cotización

---

## 📁 Estructura de Archivos

```
src/
├── lib/
│   ├── email/
│   │   ├── templates.ts                  # Plantillas HTML de correos
│   │   └── emailService.ts               # Servicio Nodemailer
│   ├── whatsapp/
│   │   ├── whatsappService.ts            # Core de WhatsApp
│   │   └── whatsappNotificationHelper.ts # Helpers de notificación
│   └── services/
│       ├── ordenService.ts               # Integrado con emails
│       └── emailNotificationService.ts   # Lógica de emails
├── hooks/
│   └── useWhatsApp.ts                    # Hook de WhatsApp
├── components/
│   ├── WhatsAppButton.tsx                # Botones de WhatsApp
│   └── WhatsAppNotificationPanel.tsx     # Panel completo
└── app/
    └── api/
        └── email/
            └── send/
                └── route.ts              # API de correos
```

---

## 🚀 Uso Rápido

### Enviar Email (Automático)

```typescript
// Ya está integrado en ordenService
await crearOrden(data); // Envía email automáticamente
await avanzarACotizacion(ordenId); // Envía email automáticamente
```

### Enviar WhatsApp (Manual)

```tsx
import WhatsAppNotificationPanel from '@/components/WhatsAppNotificationPanel';

// En tu componente
<WhatsAppNotificationPanel 
  orden={orden}
  mostrarCotizacion={true}
/>
```

### Usar Hook de WhatsApp

```typescript
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { getMensajeCambioFase } from '@/lib/whatsapp/whatsappService';

const { enviarMensaje } = useWhatsApp();

const mensaje = getMensajeCambioFase({
  clienteNombre: 'Juan Pérez',
  ordenId: 'ORD-123',
  faseActual: 'Reparación',
  trackingUrl: process.env.NEXT_PUBLIC_TRACKING_URL
});

enviarMensaje(telefono, mensaje);
```

---

## 📊 Comparación de Sistemas

| Característica | Email | WhatsApp |
|----------------|-------|----------|
| **Envío Automático** | ✅ Sí | ❌ No (control manual) |
| **Requiere Config** | ✅ Sí (Gmail) | ❌ No |
| **Plantillas HTML** | ✅ Sí | ❌ Texto con emojis |
| **Tracking Aperturas** | ❌ No | ❌ No |
| **Validación Cliente** | Email requerido | Teléfono requerido |
| **Costo** | Gratis (Gmail) | Gratis (WhatsApp) |
| **Control Usuario** | ❌ Envía directo | ✅ Usuario revisa antes |

---

## 🎯 Recomendaciones de Uso

### Usar Email cuando:

- ✅ Necesites envío automático sin intervención
- ✅ Quieras mantener registro formal
- ✅ El cliente prefiera email
- ✅ Necesites adjuntar documentos (futura mejora)

### Usar WhatsApp cuando:

- ✅ Quieras asegurar que el usuario revise el mensaje
- ✅ Necesites comunicación más directa e inmediata
- ✅ El cliente prefiera WhatsApp
- ✅ Quieras enviar cotizaciones con contexto

### Usar Ambos cuando:

- ✅ Cambios críticos de fase (Cotización, Entrega)
- ✅ Órdenes de alto valor
- ✅ Clientes VIP
- ✅ Primera orden del cliente

---

## 🔮 Mejoras Futuras

### Email
- [ ] Servicio de email transaccional (SendGrid, AWS SES)
- [ ] Tracking de aperturas
- [ ] Adjuntos PDF de cotizaciones
- [ ] Plantillas personalizables desde admin

### WhatsApp
- [ ] Envío automático via API de WhatsApp Business
- [ ] Programación de mensajes
- [ ] Respuestas automáticas
- [ ] Integración con chatbot

---

## 📞 Soporte

Para problemas con los sistemas de notificación:

1. **Email**: Revisa `EMAIL_SETUP.md`
2. **WhatsApp**: Revisa `WHATSAPP_SETUP.md`
3. Verifica que el cliente tenga email/teléfono registrado
4. Consulta los logs del servidor/navegador
5. Contacta al equipo de desarrollo

---

## 🎉 Resumen

Tienes dos sistemas complementarios de notificación:

- 📧 **Email**: Automático, formal, con plantillas HTML
- 💬 **WhatsApp**: Manual, directo, con control del usuario

Ambos comparten el mismo objetivo: mantener al cliente informado del estado de su orden.

---

**Team Service Costa S.A.S.** | Centro Autorizado KÄRCHER
