/**
 * Servicio de WhatsApp para envío de mensajes
 * Genera URLs para abrir WhatsApp Web con mensajes predefinidos
 */

// Unicode escape codes para emojis - evita problemas de encoding
const EMOJI = {
  WRENCH: '\u{1F527}',        // 🔧
  HAMMER_WRENCH: '\u{1F6E0}', // 🛠
  ID: '\u{1F194}',            // 🆔
  LOCATION: '\u{1F4CD}',      // 📍
  MOBILE: '\u{1F4F2}',        // 📲
  PACKAGE: '\u{1F4E6}',       // 📦
  MEMO: '\u{1F4DD}',          // 📝
  SPARKLES: '\u{2728}',       // ✨
  CHECK_MARK: '\u{2705}',     // ✅
  CROSS_MARK: '\u{274C}',     // ❌
  CLOCK: '\u{1F551}',         // 🕑
  CALENDAR: '\u{1F4C5}',      // 📅
  MAGNIFYING: '\u{1F50D}',    // 🔍
  MEGAPHONE: '\u{1F4E2}',     // 📢
  ENVELOPE: '\u{1F4E9}',      // 📩
  WARNING: '\u{26A0}',        // ⚠️
  SIREN: '\u{1F6A8}',         // 🚨
  LIGHT_BULB: '\u{1F4A1}',    // 💡
  MONEY_BAG: '\u{1F4B0}',     // 💰
  HOURGLASS: '\u{231B}',      // ⌛
  WASTEBASKET: '\u{1F5D1}',   // 🗑️
  DOCUMENT: '\u{1F4C4}',      // 📄
  GERMANY_FLAG: '\u{1F1E9}\u{1F1EA}', // 🇩🇪
};

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
  const { clienteNombre, ordenId, trackingUrl, equipoDescripcion } = data;

  return `${EMOJI.WRENCH} Team Service Costa

Hola ${clienteNombre},
tu orden de servicio fue creada exitosamente.
Aquí tienes toda la información para hacerle seguimiento a tu equipo:

${EMOJI.ID} Orden: ${ordenId}
${equipoDescripcion ? `${EMOJI.HAMMER_WRENCH} Equipo: ${equipoDescripcion}\n` : ''}${EMOJI.LOCATION} Estado actual: Recepción

${EMOJI.MOBILE} Rastrea el progreso en tiempo real:
${trackingUrl}estado-producto?codigo=${ordenId}

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

  return `${EMOJI.WRENCH} Actualización de Orden – Team Service Costa

Hola ${clienteNombre},
tu orden ${ordenId} ha cambiado de estado.

${EMOJI.HAMMER_WRENCH} Nueva fase: ${faseActual}
${descripcion}

${EMOJI.MOBILE} Rastrea el progreso aquí:
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

  return `${EMOJI.SPARKLES} Hola ${clienteNombre},
hemos finalizado el diagnóstico de tu equipo y la cotización ya está disponible.

${EMOJI.ID} ID de Orden: ${ordenId}
${EMOJI.DOCUMENT} Ver cotización y aprobar/rechazar:
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

  return `${EMOJI.HOURGLASS} *Aprobación Pendiente*

Hola ${clienteNombre},

Tu orden *${ordenId}* requiere tu aprobación para continuar con la reparación.

Por favor, revisa la cotización y confirma si deseas proceder.

${EMOJI.MAGNIFYING} *Ver detalles:*
${trackingUrl}estado-producto?codigo=${ordenId}

Respóndenos por este medio o acércate a nuestras instalaciones.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ ${EMOJI.GERMANY_FLAG}`;
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

  return `${EMOJI.CHECK_MARK} *¡Tu Equipo está Listo!*

Hola ${clienteNombre},

¡Excelentes noticias! Tu equipo ha sido reparado y está listo para ser entregado.

${EMOJI.MEMO} *ID de Orden:* ${ordenId}

${EMOJI.LOCATION} *Recógelo en:*
${direccion || 'Team Service Costa - Montería, Cartagena o Apartadó'}

${EMOJI.CLOCK} *Horario de atención:*
Lunes a Viernes: 8:00 AM - 6:00 PM
Sábados: 8:00 AM - 12:00 PM

Por favor, trae este mensaje y tu documento de identidad.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ ${EMOJI.GERMANY_FLAG}`;
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

  return `${EMOJI.MEGAPHONE} *Team Service Costa*

Hola ${clienteNombre},

${mensaje}

${EMOJI.MEMO} *Orden:* ${ordenId}

${EMOJI.MAGNIFYING} *Más información:*
${trackingUrl}estado-producto?codigo=${ordenId}

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ ${EMOJI.GERMANY_FLAG}`;
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
    'Petición': EMOJI.ENVELOPE,
    'Queja': EMOJI.WARNING,
    'Reclamo': EMOJI.SIREN,
    'Sugerencia': EMOJI.LIGHT_BULB,
  };

  const emoji = emojis[tipoPQR] || EMOJI.ENVELOPE;

  return `${emoji} *Respuesta a tu ${tipoPQR}*

Hola ${clienteNombre},

Hemos revisado tu solicitud *${pqrId}* y queremos compartir nuestra respuesta:

${EMOJI.MEMO} *Respuesta:*
${respuesta}

En Team Service Costa, tu satisfacción es nuestra prioridad.

Si tienes alguna pregunta adicional, no dudes en contactarnos.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ ${EMOJI.GERMANY_FLAG}`;
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

  return `${EMOJI.PACKAGE} *Producto Enviado a Bodega*

Hola ${clienteNombre},

Te informamos que tu equipo de la orden *${ordenId}* ha sido transferido a nuestra bodega.

${EMOJI.CALENDAR} *Fecha de transferencia:* ${fecha}

El equipo permanecerá en custodia hasta que decidas retirarlo o continuar con el proceso.

${EMOJI.MAGNIFYING} *Rastrea tu orden aquí:*
${trackingUrl}estado-producto?codigo=${ordenId}

Si tienes alguna pregunta, no dudes en contactarnos.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ ${EMOJI.GERMANY_FLAG}`;
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

  return `${EMOJI.WASTEBASKET} *Producto Chatarrizado*

Hola ${clienteNombre},

Te informamos que tu equipo de la orden *${ordenId}* ha sido dado de baja (chatarrizado) según lo acordado.

${EMOJI.CALENDAR} *Fecha de chatarrizado:* ${fecha}

Este proceso es irreversible. El equipo ha sido dispuesto de manera adecuada.

${EMOJI.MAGNIFYING} *Consulta el historial aquí:*
${trackingUrl}estado-producto?codigo=${ordenId}

Si tienes alguna pregunta, no dudes en contactarnos.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ ${EMOJI.GERMANY_FLAG}`;
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

  return `${EMOJI.CROSS_MARK} *Cotización Rechazada*

Hola ${clienteNombre},

Te informamos que la cotización de tu orden *${ordenId}* ha sido registrada como *rechazada*.

${EMOJI.MONEY_BAG} *Costo de Revisión:* ${valorFormateado}
Este valor corresponde al diagnóstico técnico realizado a tu equipo.

${EMOJI.PACKAGE} *Entrega del equipo:*
Tu equipo está disponible para ser recogido en nuestras instalaciones.
Por favor, acércate para realizar el pago del valor de revisión y retirar tu equipo.

${EMOJI.MAGNIFYING} *Consulta tu orden aquí:*
${trackingUrl}estado-producto?codigo=${ordenId}

${EMOJI.LOCATION} *Nuestras sedes:*
• Montería
• Cartagena  
• Apartadó

${EMOJI.CLOCK} *Horario de atención:*
Lunes a Viernes: 8:00 AM - 6:00 PM
Sábados: 8:00 AM - 12:00 PM

Por favor, trae tu documento de identidad para el retiro.

Si tienes alguna pregunta, no dudes en contactarnos.

_Team Service Costa S.A.S._
_Centro Autorizado KÄRCHER_ ${EMOJI.GERMANY_FLAG}`;
}
