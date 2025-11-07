// Supabase Edge Function para procesar notificaciones de mantenimiento
// Deploy: supabase functions deploy procesar-mantenimientos

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Procesando notificaciones de mantenimiento...')

    // 1. Verificar mantenimientos próximos y crear notificaciones
    const { data: ordenesCreadas, error: errorVerificar } = await supabaseClient
      .rpc('verificar_mantenimientos_proximos')

    if (errorVerificar) {
      console.error('❌ Error al verificar:', errorVerificar)
      throw errorVerificar
    }

    const cantidadCreadas = Array.isArray(ordenesCreadas) ? ordenesCreadas.length : 0
    console.log(`✅ ${cantidadCreadas} notificaciones creadas`)

    // 2. Obtener notificaciones pendientes
    const { data: notificaciones, error: errorNotif } = await supabaseClient
      .rpc('obtener_notificaciones_mantenimiento_pendientes')

    if (errorNotif) {
      throw errorNotif
    }

    if (!notificaciones || notificaciones.length === 0) {
      console.log('ℹ️ No hay notificaciones pendientes')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No hay notificaciones pendientes',
          procesadas: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Procesando ${notificaciones.length} notificaciones...`)

    let procesadas = 0
    let errores = 0

    // 3. Enviar emails usando Resend (o el servicio que prefieras)
    for (const notif of notificaciones) {
      try {
        if (!notif.cliente_email) {
          console.warn(`⚠️ Sin email para orden ${notif.orden_codigo}`)
          errores++
          continue
        }

        // Formatear fecha
        const fecha = new Date(notif.fecha_mantenimiento)
        const fechaFormateada = fecha.toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

        // OPCIÓN A: Usar Resend (recomendado)
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        if (resendApiKey) {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Team Service Costa <onboarding@resend.dev>', // Cambiar por tu dominio
              to: [notif.cliente_email],
              subject: `🔔 Recordatorio de Mantenimiento - Orden ${notif.orden_codigo}`,
              html: generarHtmlEmail(notif, fechaFormateada)
            })
          })

          if (!emailResponse.ok) {
            throw new Error(`Error Resend: ${await emailResponse.text()}`)
          }
        } else {
          // OPCIÓN B: Llamar a tu API de emails
          const appUrl = Deno.env.get('APP_URL')
          if (appUrl) {
            const emailResponse = await fetch(`${appUrl}/api/email/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tipo: 'recordatorio_mantenimiento',
                clienteEmail: notif.cliente_email,
                clienteNombre: notif.cliente_nombre,
                ordenId: notif.orden_codigo,
                equipoDescripcion: notif.equipo_descripcion,
                fechaMantenimiento: fechaFormateada,
              })
            })

            if (!emailResponse.ok) {
              throw new Error(`Error API: ${await emailResponse.text()}`)
            }
          }
        }

        // Marcar como enviada
        await supabaseClient.rpc('marcar_notificacion_email_enviado', {
          p_notificacion_id: notif.notificacion_id
        })

        console.log(`✅ Email enviado: ${notif.orden_codigo}`)
        procesadas++

      } catch (error) {
        console.error(`❌ Error procesando ${notif.orden_codigo}:`, error)
        errores++
      }
    }

    return new Response(
      JSON.stringify({
        success: errores === 0,
        timestamp: new Date().toISOString(),
        procesadas,
        errores,
        total: notificaciones.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error general:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Función auxiliar para generar HTML del email
function generarHtmlEmail(notif: any, fechaFormateada: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .info-box { background: #f8f9fa; border-left: 4px solid #f5576c; padding: 15px; margin: 20px 0; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Recordatorio de Mantenimiento</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${notif.cliente_nombre}</strong>,</p>
      <p>Te recordamos que <strong>mañana ${fechaFormateada}</strong> es la fecha programada para el mantenimiento de tu equipo.</p>
      
      <div class="info-box">
        <p><strong>Orden:</strong> ${notif.orden_codigo}</p>
        <p><strong>Equipo:</strong> ${notif.equipo_descripcion}</p>
        <p><strong>Fecha:</strong> ${fechaFormateada}</p>
      </div>
      
      <p><strong>¿Por qué es importante?</strong></p>
      <ul>
        <li>Prolonga la vida útil de tu equipo</li>
        <li>Previene averías costosas</li>
        <li>Garantiza el máximo rendimiento</li>
      </ul>
      
      <p>Contáctanos para agendar una cita.</p>
    </div>
    <div class="footer">
      <p><strong>Team Service Costa S.A.S.</strong></p>
      <p>Centro Autorizado KÄRCHER</p>
      <p>📍 Montería, Cartagena y Apartadó</p>
    </div>
  </div>
</body>
</html>
  `
}
