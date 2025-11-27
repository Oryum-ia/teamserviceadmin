/**
 * Servicio de WhatsApp para envío de mensajes
 * Genera URLs para abrir WhatsApp Web con mensajes predefinidos
 */

/**
 * Formatear número de teléfono para WhatsApp
 * Elimina caracteres especiales y espacios, y agrega código de país si no lo tiene
 */
export function formatPhoneNumber(phone: string): string {
  // Eliminar espacios, guiones, paréntesis y el símbolo +
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Si ya tiene +, solo removerlo y continuar
  cleaned = cleaned.replace(/\+/g, '');
  
  // Si el número no empieza con 57 (código de Colombia), agregarlo
  if (!cleaned.startsWith('57')) {
    cleaned = '57' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generar URL de WhatsApp Web
 */
export function generateWhatsAppURL(phone: string, message: string): string {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Abrir WhatsApp en una nueva ventana
 */
export function openWhatsApp(phone: string, message: string): void {
  const url = generateWhatsAppURL(phone, message);
  window.open(url, '_blank');
}

/**
 * Plantillas de mensajes para WhatsApp
 */

/**
 * Mensaje de orden creada
 */
export function getMensajeOrdenCreada(data: {
  clienteNombre: string;
  ordenId: string;
  trackingUrl: string;
  equipoDescripcion?: string;
  productoId?: string;
}): string {
  const { clienteNombre, ordenId, trackingUrl, equipoDescripcion, productoId } = data;
  
  return `🔧 *Team Service Costa*

Hola ${clienteNombre}, 

✅ Tu orden de servicio ha sido creada exitosamente.

📋 *ID de Orden:* ${ordenId}
${equipoDescripcion ? `🛠️ *Equipo:* ${equipoDescripcion}\n` : ''}
📍 *Estado Actual:* Recepción

🔍 *Rastrea tu orden aquí:*
${trackingUrl}estado-producto?codigo=${ordenId}

💡 Guarda este mensaje con el ID de tu orden para futuras consultas.

Te mantendremos informado de cada cambio en el estado de tu equipo.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ 🇩🇪`;
}

/**
 * Mensaje de cambio de fase
 */
export function getMensajeCambioFase(data: {
  clienteNombre: string;
  ordenId: string;
  faseActual: string;
  trackingUrl: string;
  productoId?: string;
}): string {
  const { clienteNombre, ordenId, faseActual, trackingUrl } = data;
  
  const descripciones: Record<string, string> = {
    'Recepción': '📥 Tu equipo ha sido recibido en nuestras instalaciones.',
    'Diagnóstico': '🔍 Nuestros técnicos están realizando el diagnóstico de tu equipo.',
    'Cotización': '💰 Hemos completado el diagnóstico. En breve recibirás la cotización.',
    'Reparación': '🔧 ¡Tu equipo está siendo reparado por nuestros técnicos!',
    'Entrega': '✅ ¡Tu equipo está listo! Acércate a nuestras instalaciones para recogerlo.',
    'Finalizada': '🎉 Orden finalizada. ¡Gracias por confiar en nosotros!',
  };

  const emojiFase: Record<string, string> = {
    'Recepción': '📥',
    'Diagnóstico': '🔍',
    'Cotización': '💰',
    'Reparación': '🔧',
    'Entrega': '✅',
    'Finalizada': '🎉',
  };

  const emoji = emojiFase[faseActual] || '🔔';
  const descripcion = descripciones[faseActual] || 'El estado de tu orden ha sido actualizado.';

  return `${emoji} *Actualización de Orden*

Hola ${clienteNombre},

Tu orden *${ordenId}* ha cambiado de estado:

📋 *Nueva Fase:* ${faseActual}

${descripcion}

🔍 *Rastrea tu orden aquí:*
${trackingUrl}estado-producto?codigo=${ordenId}

Si tienes alguna pregunta, no dudes en contactarnos.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ 🇩🇪`;
}

/**
 * Mensaje con cotización lista
 */
export function getMensajeCotizacion(data: {
  clienteNombre: string;
  ordenId: string;
  cotizacionUrl: string;
  total?: number;
}): string {
  const { clienteNombre, ordenId, cotizacionUrl, total } = data;
  
  return `💰 *Cotización Lista*

Hola ${clienteNombre},

Hemos completado el diagnóstico de tu equipo y la cotización está lista.

📋 *ID de Orden:* ${ordenId}
${total ? `💵 *Total:* $${total.toLocaleString('es-CO')}\n` : ''}
📄 *Ver cotización completa:*
${cotizacionUrl}

Para continuar con la reparación, necesitamos tu aprobación.

¿Deseas aprobar la cotización? Respóndenos por este medio o acércate a nuestras instalaciones.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ 🇩🇪`;
}

/**
 * Mensaje de aprobación requerida
 */
export function getMensajeAprobacionRequerida(data: {
  clienteNombre: string;
  ordenId: string;
  trackingUrl: string;
  productoId?: string;
}): string {
  const { clienteNombre, ordenId, trackingUrl } = data;
  
  return `⏳ *Aprobación Pendiente*

Hola ${clienteNombre},

Tu orden *${ordenId}* requiere tu aprobación para continuar con la reparación.

Por favor, revisa la cotización y confirma si deseas proceder.

🔍 *Ver detalles:*
${trackingUrl}estado-producto?codigo=${ordenId}

Respóndenos por este medio o acércate a nuestras instalaciones.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ 🇩🇪`;
}

/**
 * Mensaje de equipo listo para entrega
 */
export function getMensajeListoEntrega(data: {
  clienteNombre: string;
  ordenId: string;
  direccion?: string;
}): string {
  const { clienteNombre, ordenId, direccion } = data;
  
  return `✅ *¡Tu Equipo está Listo!*

Hola ${clienteNombre},

¡Excelentes noticias! Tu equipo ha sido reparado y está listo para ser entregado.

📋 *ID de Orden:* ${ordenId}

📍 *Recógelo en:*
${direccion || 'Team Service Costa - Montería, Cartagena o Apartadó'}

🕐 *Horario de atención:*
Lunes a Viernes: 8:00 AM - 6:00 PM
Sábados: 8:00 AM - 12:00 PM

Por favor, trae este mensaje y tu documento de identidad.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ 🇩🇪`;
}

/**
 * Mensaje de seguimiento general
 */
export function getMensajeSeguimiento(data: {
  clienteNombre: string;
  ordenId: string;
  mensaje: string;
  trackingUrl: string;
  productoId?: string;
}): string {
  const { clienteNombre, ordenId, mensaje, trackingUrl } = data;
  
  return `📢 *Team Service Costa*

Hola ${clienteNombre},

${mensaje}

📋 *Orden:* ${ordenId}

🔍 *Más información:*
${trackingUrl}estado-producto?codigo=${ordenId}

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ 🇩🇪`;
}

/**
 * Mensaje de respuesta a PQR
 */
export function getMensajePQR(data: {
  clienteNombre: string;
  pqrId: string;
  tipoPQR: string;
  respuesta: string;
}): string {
  const { clienteNombre, pqrId, tipoPQR, respuesta } = data;
  
  const emojis: Record<string, string> = {
    'Petición': '📩',
    'Queja': '⚠️',
    'Reclamo': '🚨',
    'Sugerencia': '💡',
  };

  const emoji = emojis[tipoPQR] || '📩';
  
  return `${emoji} *Respuesta a tu ${tipoPQR}*

Hola ${clienteNombre},

Hemos revisado tu solicitud *${pqrId}* y queremos compartir nuestra respuesta:

📝 *Respuesta:*
${respuesta}

En Team Service Costa, tu satisfacción es nuestra prioridad.

Si tienes alguna pregunta adicional, no dudes en contactarnos.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ 🇩🇪`;
}
