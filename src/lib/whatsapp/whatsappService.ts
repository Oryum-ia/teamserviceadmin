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
  
  return `🔧 Team Service Costa

Hola ${clienteNombre},
tu orden de servicio fue creada exitosamente.
Aquí tienes toda la información para hacerle seguimiento a tu equipo:

🆔 Orden: ${ordenId}
${equipoDescripcion ? `🛠 Equipo: ${equipoDescripcion}\n` : ''}📍 Estado actual: Recepción

📲 Rastrea el progreso en tiempo real:
${trackingUrl}

Guarda este mensaje, ya que tu ID de orden será necesario para futuras consultas.

Te notificaremos automáticamente cada vez que tu equipo cambie de estado.

Team Service Costa S.A.S.
Centro de Servicio Autorizado Kärcher & Distribuidor Makita`;
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
    'Recepción': 'Tu equipo ha sido recibido en nuestras instalaciones.',
    'Diagnóstico': 'Nuestros técnicos están realizando el diagnóstico de tu equipo.',
    'Cotización': 'Hemos completado el diagnóstico. En breve recibirás la cotización.',
    'Reparación': '¡Tu equipo está siendo atendido por nuestros técnicos!',
    'Entrega': '¡Tu equipo está listo! Acércate a nuestras instalaciones para recogerlo.',
    'Finalizada': 'Orden finalizada. ¡Gracias por confiar en nosotros!',
  };

  const descripcion = descripciones[faseActual] || 'El estado de tu orden ha sido actualizado.';

  return `🔧 Actualización de Orden – Team Service Costa

Hola ${clienteNombre},
tu orden ${ordenId} ha cambiado de estado.

🛠 Nueva fase: ${faseActual}
${descripcion}

📲 Rastrea el progreso aquí:
${trackingUrl}estado-producto?codigo=${ordenId}

Si tienes alguna pregunta, estamos disponibles para ayudarte.

Team Service Costa S.A.S.
Centro Autorizado Kärcher & Distribuidor Makita`;
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
  const { clienteNombre, ordenId, cotizacionUrl } = data;
  
  return `Hola ${clienteNombre},
hemos finalizado el diagnóstico de tu equipo y la cotización ya está disponible.

🆔 ID de Orden: ${ordenId}
📄 Ver cotización y aprobar/rechazar:
${cotizacionUrl}

Por favor ingresa al enlace para revisar la cotización y seleccionar si deseas aprobarla o rechazarla directamente desde la página web.
Tu decisión actualizará el estado de tu orden automáticamente.

Team Service Costa S.A.S.
Centro Autorizado Kärcher & Distribuidor Makita`;
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

/**
 * Mensaje de producto enviado a bodega
 */
export function getMensajeBodega(data: {
  clienteNombre: string;
  ordenId: string;
  fecha: string;
  trackingUrl: string;
}): string {
  const { clienteNombre, ordenId, fecha, trackingUrl } = data;
  
  return `📦 *Producto Enviado a Bodega*

Hola ${clienteNombre},

Te informamos que tu equipo de la orden *${ordenId}* ha sido transferido a nuestra bodega.

📅 *Fecha de transferencia:* ${fecha}

El equipo permanecerá en custodia hasta que decidas retirarlo o continuar con el proceso.

🔍 *Rastrea tu orden aquí:*
${trackingUrl}estado-producto?codigo=${ordenId}

Si tienes alguna pregunta, no dudes en contactarnos.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ 🇩🇪`;
}

/**
 * Mensaje de producto chatarrizado
 */
export function getMensajeChatarrizado(data: {
  clienteNombre: string;
  ordenId: string;
  fecha: string;
  trackingUrl: string;
}): string {
  const { clienteNombre, ordenId, fecha, trackingUrl } = data;
  
  return `🗑️ *Producto Chatarrizado*

Hola ${clienteNombre},

Te informamos que tu equipo de la orden *${ordenId}* ha sido dado de baja (chatarrizado) según lo acordado.

📅 *Fecha de chatarrizado:* ${fecha}

Este proceso es irreversible. El equipo ha sido dispuesto de manera adecuada.

🔍 *Consulta el historial aquí:*
${trackingUrl}estado-producto?codigo=${ordenId}

Si tienes alguna pregunta, no dudes en contactarnos.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ 🇩🇪`;
}

/**
 * Mensaje de cotización rechazada
 * Se envía cuando el cliente rechaza la cotización
 */
export function getMensajeCotizacionRechazada(data: {
  clienteNombre: string;
  ordenId: string;
  valorRevision: number;
  trackingUrl: string;
}): string {
  const { clienteNombre, ordenId, valorRevision, trackingUrl } = data;
  
  // Formatear el valor de revisión a moneda colombiana
  const valorFormateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(valorRevision);
  
  return `❌ *Cotización Rechazada*

Hola ${clienteNombre},

Te informamos que la cotización de tu orden *${ordenId}* ha sido registrada como *rechazada*.

💰 *Costo de Revisión:* ${valorFormateado}
Este valor corresponde al diagnóstico técnico realizado a tu equipo.

📦 *Entrega del equipo:*
Tu equipo está disponible para ser recogido en nuestras instalaciones.
Por favor, acércate para realizar el pago del valor de revisión y retirar tu equipo.

🔍 *Consulta tu orden aquí:*
${trackingUrl}estado-producto?codigo=${ordenId}

📍 *Nuestras sedes:*
• Montería
• Cartagena  
• Apartadó

🕐 *Horario de atención:*
Lunes a Viernes: 8:00 AM - 6:00 PM
Sábados: 8:00 AM - 12:00 PM

Por favor, trae tu documento de identidad para el retiro.

Si tienes alguna pregunta, no dudes en contactarnos.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ 🇩🇪`;
}

