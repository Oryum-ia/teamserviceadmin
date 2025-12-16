/**
 * Plantillas de correo para notificaciones del sistema
 */

// Estilos comunes para todas las plantillas
const baseStyles = `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 20px auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }
  .content {
    padding: 30px;
    color: #333333;
  }
  .status-badge {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
    margin: 10px 0;
  }
  .info-box {
    background-color: #f8f9fa;
    border-left: 4px solid #667eea;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .info-box p {
    margin: 5px 0;
  }
  .info-box strong {
    color: #667eea;
  }
  .btn {
    display: inline-block;
    padding: 12px 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 5px;
    font-weight: 600;
    margin: 20px 0;
  }
  .footer {
    background-color: #f8f9fa;
    padding: 20px;
    text-align: center;
    color: #666666;
    font-size: 14px;
  }
  .footer a {
    color: #667eea;
    text-decoration: none;
  }
`;

/**
 * Plantilla para notificar cambio de fase en una orden
 */
export function templateCambioFase(data: {
  clienteNombre: string;
  ordenId: string;
  faseActual: string;
  descripcionFase: string;
  trackingUrl: string;
  productoId?: string;
}): string {
  const { clienteNombre, ordenId, faseActual, descripcionFase, trackingUrl, productoId } = data;

  // Colores según la fase
  const faseColors: Record<string, string> = {
    'Recepción': '#6c757d',
    'Diagnóstico': '#0dcaf0',
    'Cotización': '#ffc107',
    'Reparación': '#0d6efd',
    'Entrega': '#198754',
    'Finalizada': '#28a745',
  };

  const color = faseColors[faseActual] || '#667eea';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Actualización de Orden - Team Service Costa</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Actualización de Orden</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clienteNombre}</strong>,</p>
      
      <p>Te informamos que tu orden ha cambiado de estado:</p>
      
      <div class="info-box">
        <p><strong>ID de Orden:</strong> ${ordenId}</p>
        <p><strong>Nueva Fase:</strong> <span class="status-badge" style="background-color: ${color}; color: white;">${faseActual}</span></p>
      </div>
      
      <p>${descripcionFase}</p>
      
      <p>Puedes rastrear el estado de tu orden en tiempo real haciendo clic en el siguiente botón:</p>
      
      <div style="text-align: center;">
        <a href="${trackingUrl}estado-producto?codigo=${ordenId}" class="btn">
          🔍 Rastrear mi Orden
        </a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Si tienes alguna pregunta, no dudes en contactarnos.
      </p>
    </div>
    <div class="footer">
      <p><strong>Team Service Costa S.A.S.</strong></p>
      <p>Centro Autorizado KÄRCHER</p>
      <p>Montería, Cartagena y Apartadó</p>
      <p><a href="process.env.NEXT_PUBLIC_TRACKING_URL">Visita nuestro sitio web</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Plantilla para confirmar la creación de una orden
 */
export function templateConfirmacionOrden(data: {
  clienteNombre: string;
  ordenId: string;
  fechaCreacion: string;
  trackingUrl: string;
  equipoDescripcion?: string;
  productoId?: string;
}): string {
  const { clienteNombre, ordenId, fechaCreacion, trackingUrl, equipoDescripcion } = data;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orden Creada - Team Service Costa</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Orden Creada Exitosamente</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clienteNombre}</strong>,</p>
      
      <p>¡Gracias por confiar en nosotros! Tu orden de servicio ha sido creada exitosamente.</p>
      
      <div class="info-box">
        <p><strong>ID de Orden:</strong> ${ordenId}</p>
        <p><strong>Fecha de Creación:</strong> ${fechaCreacion}</p>
        ${equipoDescripcion ? `<p><strong>Equipo:</strong> ${equipoDescripcion}</p>` : ''}
        <p><strong>Estado Actual:</strong> <span class="status-badge" style="background-color: #6c757d; color: white;">Recepción</span></p>
      </div>
      
      <p>
        <strong>¿Cómo rastrear tu orden?</strong><br>
        Puedes consultar el estado de tu orden en cualquier momento ingresando el ID de la orden en nuestro sitio web.
      </p>
      
      <div style="text-align: center;">
        <a href="${trackingUrl}estado-producto?codigo=${ordenId}" class="btn">
          🔍 Rastrear mi Orden
        </a>
      </div>
      
      <p style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <strong>💡 Consejo:</strong> Guarda este correo con tu ID de orden para futuras consultas.
      </p>
      
      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        Te mantendremos informado de cada cambio en el estado de tu orden.
      </p>
    </div>
    <div class="footer">
      <p><strong>Team Service Costa S.A.S.</strong></p>
      <p>Centro Autorizado KÄRCHER</p>
      <p>📍 Montería, Cartagena y Apartadó</p>
      <p><a href=${process.env.NEXT_PUBLIC_TRACKING_URL}>Visita nuestro sitio web</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Plantilla para respuesta a PQR (Peticiones, Quejas y Reclamos)
 */
export function templateRespuestaPQR(data: {
  clienteNombre: string;
  pqrId: string;
  tipoPQR: string;
  respuesta: string;
  fechaRespuesta: string;
}): string {
  const { clienteNombre, pqrId, tipoPQR, respuesta, fechaRespuesta } = data;

  const tipoColors: Record<string, string> = {
    'Petición': '#0dcaf0',
    'Queja': '#ffc107',
    'Reclamo': '#dc3545',
    'Sugerencia': '#20c997',
  };

  const color = tipoColors[tipoPQR] || '#667eea';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Respuesta a tu ${tipoPQR} - Team Service Costa</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📩 Respuesta a tu ${tipoPQR}</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clienteNombre}</strong>,</p>
      
      <p>Hemos revisado tu solicitud y queremos compartir nuestra respuesta:</p>
      
      <div class="info-box">
        <p><strong>ID de ${tipoPQR}:</strong> ${pqrId}</p>
        <p><strong>Tipo:</strong> <span class="status-badge" style="background-color: ${color}; color: white;">${tipoPQR}</span></p>
        <p><strong>Fecha de Respuesta:</strong> ${fechaRespuesta}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #667eea;">📝 Nuestra Respuesta</h3>
        <p style="line-height: 1.6; white-space: pre-wrap;">${respuesta}</p>
      </div>
      
      <p>
        En Team Service Costa, tu satisfacción es nuestra prioridad. Si tienes alguna pregunta adicional 
        o deseas ampliar la información, no dudes en contactarnos.
      </p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_TRACKING_URL}" class="btn">
          🌐 Visitar Nuestro Sitio Web
        </a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
        Agradecemos tu confianza en nuestros servicios.
      </p>
    </div>
    <div class="footer">
      <p><strong>Team Service Costa S.A.S.</strong></p>
      <p>Centro Autorizado KÄRCHER</p>
      <p>📍 Montería, Cartagena y Apartadó</p>
      <p>📞 Contacto: <a href="mailto:fede.saus26@gmail.com">fede.saus26@gmail.com</a></p>
      <p><a href=${process.env.NEXT_PUBLIC_TRACKING_URL}>Visita nuestro sitio web</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Plantilla para recordatorio de mantenimiento
 */
export function templateRecordatorioMantenimiento(data: {
  clienteNombre: string;
  ordenId: string;
  equipoDescripcion: string;
  fechaMantenimiento: string;
  trackingUrl: string;
  productoId?: string;
}): string {
  const { clienteNombre, ordenId, equipoDescripcion, fechaMantenimiento, trackingUrl } = data;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Mantenimiento - Team Service Costa</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
      <h1>🔔 Recordatorio de Mantenimiento</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clienteNombre}</strong>,</p>
      
      <p>Te recordamos que <strong>mañana ${fechaMantenimiento}</strong> es la fecha programada para el mantenimiento de tu equipo.</p>
      
      <div class="info-box" style="border-left-color: #f5576c;">
        <p><strong>Orden de Referencia:</strong> ${ordenId}</p>
        <p><strong>Equipo:</strong> ${equipoDescripcion}</p>
        <p><strong>Fecha de Mantenimiento:</strong> <span class="status-badge" style="background-color: #f5576c; color: white;">${fechaMantenimiento}</span></p>
      </div>
      
      <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #856404;">⚙️ ¿Por qué es importante el mantenimiento preventivo?</h3>
        <ul style="line-height: 1.8; color: #856404;">
          <li>Prolonga la vida útil de tu equipo</li>
          <li>Previene averías costosas</li>
          <li>Garantiza el máximo rendimiento</li>
          <li>Mantiene la garantía del fabricante</li>
        </ul>
      </div>
      
      <p>
        <strong>¿Qué debes hacer?</strong><br>
        Puedes contactarnos para agendar una cita o traer tu equipo directamente a nuestras instalaciones.
      </p>
      
      <div style="text-align: center;">
        <a href="${trackingUrl}estado-producto?codigo=${ordenId}" class="btn" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          📅 Agendar Mantenimiento
        </a>
      </div>

      <div style="margin-top: 30px; padding: 15px; background-color: #d1ecf1; border-left: 4px solid #0dcaf0; border-radius: 4px;">
        <p style="margin: 0; color: #055160;">
          <strong>💡 Tip:</strong> Si tienes alguna pregunta sobre el mantenimiento o necesitas reprogramar la fecha, 
          contáctanos por WhatsApp, correo o teléfono.
        </p>
      </div>
      
      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        En Team Service Costa, nos aseguramos de que tu equipo funcione siempre al 100%.
      </p>
    </div>
    <div class="footer">
      <p><strong>Team Service Costa S.A.S.</strong></p>
      <p>Centro Autorizado KÄRCHER</p>
      <p>📍 Montería, Cartagena y Apartadó</p>
      <p>📞 WhatsApp: <a href="https://wa.me/573000000000">+57 300 000 0000</a></p>
      <p>📧 Email: <a href="mailto:fede.saus26@gmail.com">fede.saus26@gmail.com</a></p>
      <p><a href=${process.env.NEXT_PUBLIC_TRACKING_URL}>Visita nuestro sitio web</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Obtener descripción de la fase para el correo
 */
export function getDescripcionFase(fase: string): string {
  const descripciones: Record<string, string> = {
    'Recepción': 'Tu equipo ha sido recibido en nuestras instalaciones y está siendo registrado en nuestro sistema.',
    'Diagnóstico': 'Nuestros técnicos certificados están realizando un diagnóstico completo de tu equipo para identificar el problema.',
    'Cotización': 'Hemos completado el diagnóstico. En breve recibirás una cotización detallada para la reparación de tu equipo.',
    'Reparación': '¡Excelente noticia! Tu equipo está siendo reparado por nuestros técnicos especializados.',
    'Entrega': 'Tu equipo está listo para ser entregado. Por favor, acércate a nuestras instalaciones para recogerlo.',
    'Finalizada': '¡Orden finalizada! Gracias por confiar en Team Service Costa. Esperamos verte pronto.',
  };

  return descripciones[fase] || 'El estado de tu orden ha sido actualizado.';
}

/**
 * Plantilla para notificar cotización rechazada
 */
export function templateCotizacionRechazada(data: {
  clienteNombre: string;
  ordenId: string;
  valorRevision: string;
  trackingUrl: string;
}): string {
  const { clienteNombre, ordenId, valorRevision, trackingUrl } = data;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotización Rechazada - Team Service Costa</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);">
      <h1>❌ Cotización Rechazada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clienteNombre}</strong>,</p>
      
      <p>Te informamos que la cotización de tu orden ha sido registrada como <strong>rechazada</strong>.</p>
      
      <div class="info-box" style="border-left-color: #dc3545;">
        <p><strong>ID de Orden:</strong> ${ordenId}</p>
        <p><strong>Estado:</strong> <span class="status-badge" style="background-color: #dc3545; color: white;">Cotización Rechazada</span></p>
      </div>
      
      <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #856404;">💰 Costo de Revisión</h3>
        <p style="font-size: 24px; font-weight: bold; color: #856404; margin: 10px 0;">${valorRevision}</p>
        <p style="color: #856404; margin-bottom: 0;">
          Este valor corresponde al diagnóstico técnico realizado a tu equipo.
        </p>
      </div>
      
      <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0c5460;">📦 Entrega del Equipo</h3>
        <p style="color: #0c5460;">
          Tu equipo está disponible para ser recogido en nuestras instalaciones.<br>
          <strong>Por favor, acércate para realizar el pago del valor de revisión y retirar tu equipo.</strong>
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${trackingUrl}estado-producto?codigo=${ordenId}" class="btn" style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);">
          🔍 Ver Detalles de la Orden
        </a>
      </div>
      
      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <h4 style="margin-top: 0; color: #333;">📍 Nuestras Sedes</h4>
        <ul style="color: #666; line-height: 1.8; margin-bottom: 0;">
          <li>Montería</li>
          <li>Cartagena</li>
          <li>Apartadó</li>
        </ul>
        
        <h4 style="color: #333;">🕐 Horario de Atención</h4>
        <p style="color: #666; margin-bottom: 0;">
          Lunes a Viernes: 8:00 AM - 6:00 PM<br>
          Sábados: 8:00 AM - 12:00 PM
        </p>
      </div>
      
      <p style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; font-size: 14px; color: #666;">
        <strong>💡 Recuerda:</strong> Por favor, trae tu documento de identidad para el retiro del equipo.
      </p>
      
      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        Si tienes alguna pregunta, no dudes en contactarnos.
      </p>
    </div>
    <div class="footer">
      <p><strong>Team Service Costa S.A.S.</strong></p>
      <p>Centro Autorizado KÄRCHER 🇩🇪</p>
      <p>📍 Montería, Cartagena y Apartadó</p>
      <p><a href="${trackingUrl}">Visita nuestro sitio web</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

