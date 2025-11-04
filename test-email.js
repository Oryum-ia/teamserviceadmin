/**
 * Script de prueba para verificar configuración de correo
 * Ejecutar: node test-email.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  console.log('🧪 Iniciando prueba de correo electrónico...\n');

  // Verificar variables de entorno
  console.log('📋 Verificando configuración:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ NO CONFIGURADO');
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurado' : '❌ NO CONFIGURADO');
  console.log('   EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NO CONFIGURADO');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ ERROR: Debes configurar EMAIL_USER y EMAIL_PASS en .env.local');
    console.log('\n📝 Ejemplo de configuración:');
    console.log('   EMAIL_USER=fede.saus26@gmail.com');
    console.log('   EMAIL_PASS=tu_app_password_aqui');
    console.log('   EMAIL_FROM=TeamService Costa <fede.saus26@gmail.com>');
    process.exit(1);
  }

  try {
    // Crear transportador
    console.log('🔧 Creando transportador de correo...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verificar conexión
    console.log('🔌 Verificando conexión con servidor Gmail...');
    await transporter.verify();
    console.log('✅ Conexión exitosa con Gmail\n');

    // Enviar correo de prueba
    console.log('📧 Enviando correo de prueba a federendon26@hotmail.com...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'federendon26@hotmail.com',
      subject: '🧪 Prueba de Correo - Team Service Costa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">✅ Prueba Exitosa</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">¡El sistema de correos funciona!</h2>
            <p style="color: #666; line-height: 1.6;">
              Este es un correo de prueba del sistema de notificaciones de <strong>Team Service Costa</strong>.
            </p>
            <p style="color: #666; line-height: 1.6;">
              Si recibes este mensaje, significa que:
            </p>
            <ul style="color: #666;">
              <li>✅ La configuración de Gmail está correcta</li>
              <li>✅ El App Password funciona</li>
              <li>✅ El sistema puede enviar correos</li>
            </ul>
            <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Hora de envío:</strong> ${new Date().toLocaleString('es-CO')}
              </p>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>Team Service Costa S.A.S. | Centro Autorizado KÄRCHER</p>
          </div>
        </div>
      `,
    });

    console.log('✅ ¡Correo enviado exitosamente!');
    console.log('   Message ID:', info.messageId);
    console.log('\n📬 Revisa la bandeja de entrada de federendon26@hotmail.com');
    console.log('   (También revisa la carpeta de spam/correo no deseado)\n');

  } catch (error) {
    console.error('\n❌ ERROR al enviar correo:');
    console.error('   ', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Solución:');
      console.log('   1. Ve a https://myaccount.google.com/security');
      console.log('   2. Activa "Verificación en 2 pasos"');
      console.log('   3. Genera una "Contraseña de aplicación"');
      console.log('   4. Usa esa contraseña en EMAIL_PASS (no tu contraseña normal)');
    }
    
    process.exit(1);
  }
}

// Ejecutar prueba
testEmail();
