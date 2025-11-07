import { supabase } from "@/lib/supabaseClient";

/**
 * Servicio para procesar notificaciones de mantenimiento
 * Este servicio se puede ejecutar desde un endpoint API o desde un worker
 */

interface NotificacionMantenimiento {
  notificacion_id: string;
  orden_codigo: string;
  cliente_email: string;
  cliente_nombre: string;
  fecha_mantenimiento: string;
  equipo_descripcion: string;
}

/**
 * Procesar y enviar notificaciones de mantenimiento pendientes
 * Esta función debe ejecutarse diariamente (se puede llamar desde un cron job o endpoint)
 */
export async function procesarNotificacionesMantenimiento(): Promise<{
  success: boolean;
  procesadas: number;
  errores: number;
  detalles: string[];
}> {
  const detalles: string[] = [];
  let procesadas = 0;
  let errores = 0;

  try {
    // 1. Ejecutar función que crea notificaciones para mantenimientos de mañana
    console.log('🔍 Verificando mantenimientos próximos...');
    
    const { data: ordenesCreadas, error: errorVerificar } = await supabase
      .rpc('verificar_mantenimientos_proximos');

    if (errorVerificar) {
      console.error('❌ Error al verificar mantenimientos:', errorVerificar);
      detalles.push(`Error al verificar: ${errorVerificar.message}`);
    } else {
      const cantidad = Array.isArray(ordenesCreadas) ? ordenesCreadas.length : 0;
      console.log(`✅ ${cantidad} notificaciones creadas`);
      detalles.push(`${cantidad} notificaciones de mantenimiento creadas`);
    }

    // 2. Obtener notificaciones pendientes de envío por email
    const { data: notificaciones, error: errorNotif } = await supabase
      .rpc('obtener_notificaciones_mantenimiento_pendientes');

    if (errorNotif) {
      console.error('❌ Error al obtener notificaciones:', errorNotif);
      detalles.push(`Error al obtener notificaciones: ${errorNotif.message}`);
      return { success: false, procesadas: 0, errores: 1, detalles };
    }

    if (!notificaciones || notificaciones.length === 0) {
      console.log('ℹ️ No hay notificaciones pendientes de envío');
      detalles.push('No hay notificaciones pendientes de envío');
      return { success: true, procesadas: 0, errores: 0, detalles };
    }

    console.log(`📧 Procesando ${notificaciones.length} notificaciones...`);

    // 3. Enviar email por cada notificación
    for (const notif of notificaciones as NotificacionMantenimiento[]) {
      try {
        // Validar que el cliente tenga email
        if (!notif.cliente_email) {
          console.warn(`⚠️ Cliente sin email para orden ${notif.orden_codigo}`);
          detalles.push(`⚠️ Orden ${notif.orden_codigo}: cliente sin email`);
          errores++;
          continue;
        }

        // Formatear fecha para mostrar en formato legible
        const fechaFormateada = new Date(notif.fecha_mantenimiento).toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Llamar al endpoint de correos
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tipo: 'recordatorio_mantenimiento',
            clienteEmail: notif.cliente_email,
            clienteNombre: notif.cliente_nombre,
            ordenId: notif.orden_codigo,
            equipoDescripcion: notif.equipo_descripcion,
            fechaMantenimiento: fechaFormateada,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error al enviar correo para orden ${notif.orden_codigo}:`, errorText);
          detalles.push(`❌ Orden ${notif.orden_codigo}: error al enviar correo`);
          errores++;
          continue;
        }

        // Marcar notificación como enviada
        const { error: errorMarcar } = await supabase
          .rpc('marcar_notificacion_email_enviado', {
            p_notificacion_id: notif.notificacion_id
          });

        if (errorMarcar) {
          console.error(`⚠️ Error al marcar notificación ${notif.notificacion_id}:`, errorMarcar);
          detalles.push(`⚠️ Orden ${notif.orden_codigo}: correo enviado pero no marcado`);
        } else {
          console.log(`✅ Correo enviado y marcado para orden ${notif.orden_codigo}`);
          detalles.push(`✅ Orden ${notif.orden_codigo}: correo enviado a ${notif.cliente_email}`);
          procesadas++;
        }

      } catch (error) {
        console.error(`❌ Error procesando notificación para orden ${notif.orden_codigo}:`, error);
        detalles.push(`❌ Orden ${notif.orden_codigo}: ${error}`);
        errores++;
      }
    }

    console.log(`\n📊 Resumen: ${procesadas} procesadas, ${errores} errores`);
    
    return {
      success: errores === 0,
      procesadas,
      errores,
      detalles
    };

  } catch (error) {
    console.error('❌ Error general en procesarNotificacionesMantenimiento:', error);
    return {
      success: false,
      procesadas,
      errores: errores + 1,
      detalles: [...detalles, `Error general: ${error}`]
    };
  }
}

/**
 * Función para ejecutar manualmente desde la consola o un endpoint de prueba
 */
export async function ejecutarMantenimientoManual() {
  console.log('🚀 Ejecutando procesamiento manual de notificaciones de mantenimiento...\n');
  const resultado = await procesarNotificacionesMantenimiento();
  
  console.log('\n📋 RESULTADO:');
  console.log(`   Success: ${resultado.success}`);
  console.log(`   Procesadas: ${resultado.procesadas}`);
  console.log(`   Errores: ${resultado.errores}`);
  console.log('\n📝 Detalles:');
  resultado.detalles.forEach(d => console.log(`   ${d}`));
  
  return resultado;
}
