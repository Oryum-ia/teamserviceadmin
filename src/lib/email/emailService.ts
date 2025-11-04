import nodemailer from 'nodemailer';
import { templateCambioFase, templateConfirmacionOrden, templateRespuestaPQR, getDescripcionFase } from './templates';

/**
 * Servicio de envío de correos electrónicos
 * Utiliza Nodemailer con Gmail
 */

// Configurar el transportador de correo
let transporter: nodemailer.Transporter | null = null;

/**
 * Inicializar el transportador de correo
 */
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.error('❌ ERROR: Variables de entorno EMAIL_USER y EMAIL_PASS no configuradas');
    throw new Error('Configuración de correo incompleta. Verifica las variables de entorno.');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass, // Usar App Password de Gmail
    },
  });

  return transporter;
}

/**
 * Función auxiliar para enviar correo
 */
async function enviarCorreo(
  destinatario: string,
  asunto: string,
  html: string
): Promise<boolean> {
  try {
    const transport = getTransporter();
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const info = await transport.sendMail({
      from: emailFrom,
      to: destinatario,
      subject: asunto,
      html: html,
    });

    console.log('✅ Correo enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    return false;
  }
}

/**
 * Enviar correo de cambio de fase
 */
export async function enviarCorreoCambioFase(data: {
  clienteEmail: string;
  clienteNombre: string;
  ordenId: string;
  faseActual: string;
}): Promise<boolean> {
  const trackingUrl = process.env.NEXT_PUBLIC_TRACKING_URL || 'https://gleeful-mochi-2bc33c.netlify.app/';
  const descripcionFase = getDescripcionFase(data.faseActual);

  const html = templateCambioFase({
    clienteNombre: data.clienteNombre,
    ordenId: data.ordenId,
    faseActual: data.faseActual,
    descripcionFase,
    trackingUrl,
  });

  return enviarCorreo(
    data.clienteEmail,
    `🔔 Actualización de Orden ${data.ordenId} - ${data.faseActual}`,
    html
  );
}

/**
 * Enviar correo de confirmación de orden creada
 */
export async function enviarCorreoConfirmacionOrden(data: {
  clienteEmail: string;
  clienteNombre: string;
  ordenId: string;
  fechaCreacion: string;
  equipoDescripcion?: string;
}): Promise<boolean> {
  const trackingUrl = process.env.NEXT_PUBLIC_TRACKING_URL || 'https://gleeful-mochi-2bc33c.netlify.app/';

  const html = templateConfirmacionOrden({
    clienteNombre: data.clienteNombre,
    ordenId: data.ordenId,
    fechaCreacion: data.fechaCreacion,
    trackingUrl,
    equipoDescripcion: data.equipoDescripcion,
  });

  return enviarCorreo(
    data.clienteEmail,
    `✅ Orden ${data.ordenId} Creada Exitosamente - Team Service Costa`,
    html
  );
}

/**
 * Enviar correo de respuesta a PQR
 */
export async function enviarCorreoRespuestaPQR(data: {
  clienteEmail: string;
  clienteNombre: string;
  pqrId: string;
  tipoPQR: string;
  respuesta: string;
  fechaRespuesta: string;
}): Promise<boolean> {
  const html = templateRespuestaPQR({
    clienteNombre: data.clienteNombre,
    pqrId: data.pqrId,
    tipoPQR: data.tipoPQR,
    respuesta: data.respuesta,
    fechaRespuesta: data.fechaRespuesta,
  });

  return enviarCorreo(
    data.clienteEmail,
    `📩 Respuesta a tu ${data.tipoPQR} - Team Service Costa`,
    html
  );
}

/**
 * Verificar configuración del servicio de correo
 */
export async function verificarConfiguracionCorreo(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✅ Servidor de correo configurado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error en configuración de correo:', error);
    return false;
  }
}
