# 💬 Sistema de Notificaciones por WhatsApp

Este documento explica cómo usar el sistema de notificaciones por WhatsApp en TeamService Costa.

## 🎯 Características

El sistema permite enviar notificaciones a clientes vía WhatsApp Web en los siguientes casos:

1. **Orden Creada**: Notificación con ID de orden y link de rastreo
2. **Cambio de Fase**: Notificación cuando la orden avanza (Diagnóstico, Cotización, Reparación, etc.)
3. **Cotización Lista**: Mensaje especial con link directo a la cotización y total
4. **Entrega Lista**: Notificación cuando el equipo está listo para ser recogido
5. **Seguimiento General**: Mensajes personalizados para casos específicos

## 🔧 Funcionamiento

El sistema **NO envía mensajes automáticamente**. En su lugar:

1. ✅ Prepara el mensaje predefinido
2. ✅ Abre WhatsApp Web con el número del cliente
3. ✅ El usuario revisa el mensaje
4. ✅ El usuario presiona "Enviar" manualmente

Esto garantiza control total sobre cada comunicación.

## 📁 Estructura de Archivos

```
src/
├── lib/
│   └── whatsapp/
│       ├── whatsappService.ts              # Funciones core y plantillas
│       └── whatsappNotificationHelper.ts   # Helpers para notificaciones
├── hooks/
│   └── useWhatsApp.ts                      # Hook React para WhatsApp
└── components/
    └── WhatsAppButton.tsx                  # Componentes de botones
```

## 🚀 Uso en Componentes

### 1. Botón Básico

```tsx
import WhatsAppButton from '@/components/WhatsAppButton';

<WhatsAppButton
  telefono="573001234567"
  mensaje="Hola, tu orden está lista"
  variant="primary"
  size="md"
/>
```

### 2. Botón de Notificación de Fase

```tsx
import { WhatsAppNotificacionButton } from '@/components/WhatsAppButton';

<WhatsAppNotificacionButton
  telefono={cliente.telefono}
  mensaje={mensajeGenerado}
  faseActual="Reparación"
/>
```

### 3. Botón de Cotización

```tsx
import { WhatsAppCotizacionButton } from '@/components/WhatsAppButton';

<WhatsAppCotizacionButton
  telefono={cliente.telefono}
  mensaje={mensajeCotizacion}
/>
```

### 4. Botón Solo Ícono

```tsx
import { WhatsAppIconButton } from '@/components/WhatsAppButton';

<WhatsAppIconButton
  telefono={cliente.telefono}
  mensaje="Mensaje rápido"
  size="sm"
/>
```

## 🎨 Plantillas de Mensajes

### Orden Creada

```typescript
import { getMensajeOrdenCreada } from '@/lib/whatsapp/whatsappService';

const mensaje = getMensajeOrdenCreada({
  clienteNombre: 'Juan Pérez',
  ordenId: 'ORD-123456',
  trackingUrl: 'https://gleeful-mochi-2bc33c.netlify.app/',
  equipoDescripcion: 'KÄRCHER K5 - Hidrolavadora'
});
```

### Cambio de Fase

```typescript
import { getMensajeCambioFase } from '@/lib/whatsapp/whatsappService';

const mensaje = getMensajeCambioFase({
  clienteNombre: 'Juan Pérez',
  ordenId: 'ORD-123456',
  faseActual: 'Reparación',
  trackingUrl: 'https://gleeful-mochi-2bc33c.netlify.app/'
});
```

### Cotización Lista

```typescript
import { getMensajeCotizacion } from '@/lib/whatsapp/whatsappService';

const mensaje = getMensajeCotizacion({
  clienteNombre: 'Juan Pérez',
  ordenId: 'ORD-123456',
  cotizacionUrl: 'https://ejemplo.com/cotizacion/123',
  total: 250000
});
```

### Equipo Listo para Entrega

```typescript
import { getMensajeListoEntrega } from '@/lib/whatsapp/whatsappService';

const mensaje = getMensajeListoEntrega({
  clienteNombre: 'Juan Pérez',
  ordenId: 'ORD-123456',
  direccion: 'Team Service Costa - Montería'
});
```

## 🎣 Usando el Hook useWhatsApp

```typescript
import { useWhatsApp } from '@/hooks/useWhatsApp';

function MiComponente() {
  const { enviarMensaje, copiarMensaje, obtenerURL } = useWhatsApp();

  const handleNotificar = () => {
    enviarMensaje('573001234567', 'Tu orden está lista');
  };

  const handleCopiar = async () => {
    const exito = await copiarMensaje('Mensaje a copiar');
    if (exito) {
      alert('¡Mensaje copiado!');
    }
  };

  return (
    <>
      <button onClick={handleNotificar}>Notificar</button>
      <button onClick={handleCopiar}>Copiar</button>
    </>
  );
}
```

## 🔄 Notificaciones Automáticas

Para abrir WhatsApp automáticamente después de ciertas acciones:

### En la Creación de Orden

```typescript
import { notificarOrdenCreadaWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';

// Después de crear la orden
await crearOrden(data);
await notificarOrdenCreadaWhatsApp(ordenId);
```

### En Cambio de Fase

```typescript
import { notificarCambioFaseWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';

// Después de cambiar fase
await avanzarACotizacion(ordenId);
await notificarCambioFaseWhatsApp(ordenId, 'Cotización');
```

### Al Enviar Cotización

```typescript
import { notificarCotizacionWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';

// Después de guardar cotización
await actualizarCotizacion(ordenId, cotizacion);
await notificarCotizacionWhatsApp(ordenId, urlCotizacion, total);
```

## 📱 Formato de Números de Teléfono

El sistema acepta números en diferentes formatos y los normaliza automáticamente:

- ✅ `573001234567` (formato correcto)
- ✅ `+57 300 123 4567`
- ✅ `(300) 123-4567`
- ✅ `300 123 4567`

Todos se convierten a: `573001234567`

## 🎨 Estilos de Botones

### Variantes

- `primary`: Botón verde (WhatsApp brand)
- `secondary`: Botón gris
- `outline`: Borde verde, fondo transparente
- `icon`: Solo ícono circular

### Tamaños

- `sm`: Pequeño (32px)
- `md`: Mediano (40px) - predeterminado
- `lg`: Grande (48px)

## 🌟 Características Avanzadas

### Copiar Mensaje

Todos los botones incluyen un botón secundario para copiar el mensaje al portapapeles:

```tsx
<WhatsAppButton
  telefono="573001234567"
  mensaje="Mensaje"
  mostrarCopiar={true} // por defecto
/>
```

### Obtener URL sin Abrir

```typescript
import { generateWhatsAppURL } from '@/lib/whatsapp/whatsappService';

const url = generateWhatsAppURL('573001234567', 'Hola');
// https://wa.me/573001234567?text=Hola
```

## 💡 Ejemplos de Uso Real

### En Vista de Detalle de Orden

```tsx
import { useState, useEffect } from 'react';
import { WhatsAppNotificacionButton } from '@/components/WhatsAppButton';
import { getMensajeCambioFase } from '@/lib/whatsapp/whatsappService';

function DetalleOrden({ orden }) {
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const msg = getMensajeCambioFase({
      clienteNombre: orden.cliente.nombre,
      ordenId: orden.codigo,
      faseActual: orden.estado_actual,
      trackingUrl: process.env.NEXT_PUBLIC_TRACKING_URL
    });
    setMensaje(msg);
  }, [orden]);

  if (!orden.cliente.telefono) {
    return <p>Cliente sin teléfono registrado</p>;
  }

  return (
    <WhatsAppNotificacionButton
      telefono={orden.cliente.telefono}
      mensaje={mensaje}
      faseActual={orden.estado_actual}
    />
  );
}
```

### En Formulario de Cotización

```tsx
import { WhatsAppCotizacionButton } from '@/components/WhatsAppButton';
import { getMensajeCotizacion } from '@/lib/whatsapp/whatsappService';

function CotizacionForm({ orden, cotizacion }) {
  const mensaje = getMensajeCotizacion({
    clienteNombre: orden.cliente.nombre,
    ordenId: orden.codigo,
    cotizacionUrl: `${process.env.NEXT_PUBLIC_TRACKING_URL}?orden=${orden.codigo}`,
    total: cotizacion.total
  });

  return (
    <div>
      <h3>Cotización Lista</h3>
      {/* ... otros campos ... */}
      
      <WhatsAppCotizacionButton
        telefono={orden.cliente.telefono}
        mensaje={mensaje}
        className="mt-4"
      />
    </div>
  );
}
```

## ⚠️ Consideraciones

### Navegador

- ✅ Funciona en todos los navegadores modernos
- ✅ Abre WhatsApp Web en una nueva pestaña
- ⚠️ El usuario debe tener WhatsApp configurado

### Privacidad

- ✅ NO envía mensajes automáticamente
- ✅ El usuario tiene control total
- ✅ Puede modificar el mensaje antes de enviar

### Teléfono del Cliente

- ⚠️ Asegúrate de que el cliente tenga teléfono registrado
- ⚠️ Valida el campo antes de mostrar el botón
- ⚠️ Usa `celular` como prioridad sobre `telefono`

## 🔧 Personalización

### Crear Mensaje Personalizado

```typescript
const mensajePersonalizado = `
🔧 *Team Service Costa*

Hola ${cliente.nombre},

${textoPersonalizado}

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ 🇩🇪
`;

<WhatsAppButton
  telefono={cliente.telefono}
  mensaje={mensajePersonalizado}
/>
```

### Crear Variante de Botón

```tsx
export function MiBotonWhatsApp({ telefono, mensaje }) {
  return (
    <WhatsAppButton
      telefono={telefono}
      mensaje={mensaje}
      variant="primary"
      size="lg"
      className="my-custom-class"
    >
      🚀 Mi Texto Personalizado
    </WhatsAppButton>
  );
}
```

## 📊 Mejores Prácticas

1. **Validar teléfono antes de mostrar botón**
   ```tsx
   {cliente.telefono && (
     <WhatsAppButton telefono={cliente.telefono} mensaje={mensaje} />
   )}
   ```

2. **Usar emojis para mejor experiencia**
   - Los mensajes ya incluyen emojis relevantes
   - Mantén consistencia con el branding

3. **Incluir siempre link de rastreo**
   - Facilita que el cliente consulte su orden
   - Usa `NEXT_PUBLIC_TRACKING_URL`

4. **Preferir `celular` sobre `telefono`**
   ```typescript
   const telefono = cliente.celular || cliente.telefono;
   ```

## 📞 Soporte

Si tienes problemas con el sistema de WhatsApp:

1. Verifica que el cliente tenga teléfono registrado
2. Revisa el formato del número
3. Consulta la consola del navegador para errores
4. Contacta al equipo de desarrollo

---

**Team Service Costa S.A.S.** | Centro Autorizado KÄRCHER
