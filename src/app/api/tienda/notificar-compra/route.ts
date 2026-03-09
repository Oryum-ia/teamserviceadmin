import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * API Endpoint para notificar una compra de tienda
 * - Crea notificación de tipo 'pedido_nuevo' para la campanita de tienda
 * - Envía correo de confirmación al comprador
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const data = await request.json();

    // Validar datos requeridos
    const requiredFields = ['orderId', 'clienteNombre', 'clienteEmail', 'productos', 'total'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Faltan campos requeridos: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('🛒 Procesando notificación de compra:', data.orderId);

    // 1. Crear notificación de pedido nuevo
    const productosTexto = data.productos.map((p: any) => 
      `${p.name} (x${p.quantity})`
    ).join(', ');

    const totalFormateado = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(data.total);

    const { error: notifError } = await supabaseAdmin
      .from('notificaciones')
      .insert({
        tipo: 'pedido_nuevo',
        titulo: `🛒 Nuevo Pedido - ${data.orderId}`,
        mensaje: `${data.clienteNombre} ha realizado un pedido por ${totalFormateado}. Productos: ${productosTexto}`,
        leida: false,
        referencia_id: data.ordenDbId || null,
        referencia_tipo: 'orden_pago',
        datos_adicionales: {
          order_id: data.orderId,
          cliente_nombre: data.clienteNombre,
          cliente_email: data.clienteEmail,
          cliente_telefono: data.clienteTelefono || '',
          ciudad: data.ciudad || '',
          total: data.total,
          productos: data.productos
        }
      });

    if (notifError) {
      console.error('❌ Error creando notificación:', notifError);
    } else {
      console.log('✅ Notificación de pedido nuevo creada');
    }

    // 2. Enviar correo de confirmación al comprador
    let emailSent = false;
    try {
      emailSent = await enviarCorreoConfirmacionCompra({
        clienteEmail: data.clienteEmail,
        clienteNombre: data.clienteNombre,
        orderId: data.orderId,
        productos: data.productos,
        subtotal: data.subtotal || data.total,
        descuento: data.descuento || 0,
        costoEnvio: data.costoEnvio || 0,
        total: data.total,
        direccion: data.direccion || '',
        ciudad: data.ciudad || '',
        departamento: data.departamento || ''
      });
      
      if (emailSent) {
        console.log('✅ Correo de confirmación enviado al cliente');
      }
    } catch (emailError) {
      console.error('⚠️ Error enviando correo:', emailError);
    }

    return NextResponse.json({
      success: true,
      notificationCreated: !notifError,
      emailSent
    });

  } catch (error) {
    console.error('❌ Error en notificar-compra:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Enviar correo de confirmación de compra al cliente
 */
async function enviarCorreoConfirmacionCompra(data: {
  clienteEmail: string;
  clienteNombre: string;
  orderId: string;
  productos: Array<{ name: string; quantity: number; price: number; image?: string }>;
  subtotal: number;
  descuento: number;
  costoEnvio: number;
  total: number;
  direccion: string;
  ciudad: string;
  departamento: string;
}): Promise<boolean> {
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

  const productosHtml = data.productos.map(p => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${p.name}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">x${p.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(p.price * p.quantity)}</td>
    </tr>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Pedido - Team Service Costa</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">🛒 ¡Pedido Confirmado!</h1>
    </div>
    
    <div style="padding: 30px; color: #333333;">
      <p>Hola <strong>${data.clienteNombre}</strong>,</p>
      
      <p>¡Gracias por tu compra! Tu pedido ha sido recibido y está siendo procesado.</p>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 5px 0;"><strong>Número de Pedido:</strong> ${data.orderId}</p>
        <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      
      <h3 style="color: #667eea; margin-top: 30px;">📦 Productos</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px; text-align: left;"></th>
            <th style="padding: 12px; text-align: left;">Producto</th>
            <th style="padding: 12px; text-align: center;">Cantidad</th>
            <th style="padding: 12px; text-align: right;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${productosHtml}
        </tbody>
      </table>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 5px 0;">Subtotal:</td>
            <td style="text-align: right; padding: 5px 0;">${formatCurrency(data.subtotal)}</td>
          </tr>
          ${data.descuento > 0 ? `
          <tr style="color: #16a34a;">
            <td style="padding: 5px 0;">Descuento:</td>
            <td style="text-align: right; padding: 5px 0;">-${formatCurrency(data.descuento)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 5px 0;">Envío:</td>
            <td style="text-align: right; padding: 5px 0;">${data.costoEnvio > 0 ? formatCurrency(data.costoEnvio) : 'Gratis'}</td>
          </tr>
          <tr style="font-size: 18px; font-weight: bold; border-top: 2px solid #667eea;">
            <td style="padding: 15px 0 5px;">Total:</td>
            <td style="text-align: right; padding: 15px 0 5px;">${formatCurrency(data.total)}</td>
          </tr>
        </table>
      </div>
      
      ${data.direccion ? `
      <h3 style="color: #667eea; margin-top: 30px;">📍 Dirección de Envío</h3>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
        <p style="margin: 5px 0;">${data.direccion}</p>
        <p style="margin: 5px 0;">${data.ciudad}${data.departamento ? `, ${data.departamento}` : ''}</p>
      </div>
      ` : ''}
      
      <div style="margin-top: 30px; padding: 20px; background-color: #d1ecf1; border-radius: 8px;">
        <h4 style="margin: 0 0 10px; color: #0c5460;">📞 ¿Tienes preguntas?</h4>
        <p style="margin: 0; color: #0c5460;">
          Contáctanos por WhatsApp: <a href="https://wa.me/573205085531" style="color: #667eea;">+57 320 508 5531</a>
        </p>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
        Te notificaremos cuando tu pedido sea enviado.
      </p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666666; font-size: 14px;">
      <p style="margin: 5px 0;"><strong>Team Service Costa S.A.S.</strong></p>
      <p style="margin: 5px 0;">Centro Autorizado KÄRCHER</p>
      <p style="margin: 5px 0;">📍 Montería, Cartagena y Apartadó</p>
      <p style="margin: 5px 0;"><a href="https://tscosta.com.co" style="color: #667eea; text-decoration: none;">Visita nuestro sitio web</a></p>
    </div>
  </div>
</body>
</html>
  `;

  // Usar el servicio de email del admin
  try {
    const nodemailer = await import('nodemailer');
    
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.error('❌ Variables de entorno EMAIL_USER y EMAIL_PASS no configuradas');
      return false;
    }

    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const emailFrom = process.env.EMAIL_FROM || emailUser;

    await transporter.sendMail({
      from: emailFrom,
      to: data.clienteEmail,
      subject: `✅ Pedido Confirmado - ${data.orderId} | Team Service Costa`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    return false;
  }
}
