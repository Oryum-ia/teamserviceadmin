import { supabase } from "@/lib/supabaseClient";

/**
 * Servicio auxiliar para notificaciones de correo automáticas
 * Integra el sistema de correos con las órdenes
 */

/**
 * Enviar notificación de cambio de fase
 * Llama al endpoint API de correos
 */
export async function notificarCambioFase(
  ordenId: string,
  nuevaFase: string
): Promise<boolean> {
  try {
    // Obtener datos de la orden y cliente
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .eq('id', ordenId)
      .single();

    if (ordenError || !orden) {
      console.error('❌ Error al obtener orden:', ordenError);
      return false;
    }

    // Validar que el cliente tenga email
    const clienteEmail = orden.cliente?.correo_electronico || orden.cliente?.email;
    
    // Log de depuración para verificar datos del cliente
    console.log('📧 Datos del cliente para notificación:', {
      email: clienteEmail,
      es_juridica: orden.cliente?.es_juridica,
      razon_social: orden.cliente?.razon_social,
      nombre_comercial: orden.cliente?.nombre_comercial,
      nombre_contacto: orden.cliente?.nombre_contacto
    });
    
    if (!clienteEmail) {
      console.warn('⚠️ Cliente sin email, no se puede enviar notificación');
      return false;
    }

    // Obtener nombre del cliente
    const clienteNombre =
      orden.cliente.es_juridica
        ? orden.cliente.razon_social || orden.cliente.nombre_comercial || 'Cliente'
        : orden.cliente.nombre_contacto || orden.cliente.nombre_comercial || orden.cliente.razon_social || 'Cliente';
    
    console.log('📧 Enviando correo a:', clienteEmail, 'para:', clienteNombre);

    // Llamar al endpoint de correos
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: 'cambio_fase',
        clienteEmail,
        clienteNombre,
        ordenId: orden.codigo,
        faseActual: nuevaFase,
        productoId: orden.equipo?.id,
      }),
    });

    if (!response.ok) {
      console.error('❌ Error al enviar correo:', await response.text());
      return false;
    }

    console.log('✅ Notificación de cambio de fase enviada');
    return true;
  } catch (error) {
    console.error('❌ Error en notificarCambioFase:', error);
    return false;
  }
}

/**
 * Enviar notificación de orden creada
 */
export async function notificarOrdenCreada(ordenId: string): Promise<boolean> {
  try {
    // Obtener datos de la orden y cliente
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select(`
        *,
        cliente:clientes(*),
        equipo:equipos(
          *,
          modelo:modelos(
            *,
            marca:marcas(*)
          )
        )
      `)
      .eq('id', ordenId)
      .single();

    if (ordenError || !orden) {
      console.error('❌ Error al obtener orden:', ordenError);
      return false;
    }

    // Validar que el cliente tenga email
    const clienteEmail = orden.cliente?.correo_electronico || orden.cliente?.email;
    
    // Log de depuración para verificar datos del cliente
    console.log('📧 Datos del cliente para notificación:', {
      email: clienteEmail,
      es_juridica: orden.cliente?.es_juridica,
      razon_social: orden.cliente?.razon_social,
      nombre_comercial: orden.cliente?.nombre_comercial,
      nombre_contacto: orden.cliente?.nombre_contacto
    });
    
    if (!clienteEmail) {
      console.warn('⚠️ Cliente sin email, no se puede enviar notificación');
      return false;
    }

    // Obtener nombre del cliente
    const clienteNombre =
      orden.cliente.es_juridica
        ? orden.cliente.razon_social || orden.cliente.nombre_comercial || 'Cliente'
        : orden.cliente.nombre_contacto || orden.cliente.nombre_comercial || orden.cliente.razon_social || 'Cliente';
    
    console.log('📧 Enviando correo a:', clienteEmail, 'para:', clienteNombre);

    // Construir descripción del equipo
    let equipoDescripcion = '';
    if (orden.equipo) {
      const marca = orden.equipo.modelo?.marca?.nombre || '';
      const modelo = orden.equipo.modelo?.equipo || '';
      const tipo = orden.equipo.tipo_equipo || '';
      equipoDescripcion = `${marca} ${modelo} - ${tipo}`.trim();
    } else if (orden.comentarios_recepcion) {
      // Extraer info de comentarios si no hay equipo registrado
      const tipoMatch = orden.comentarios_recepcion.match(/Tipo:\s*(.+)/);
      const modeloMatch = orden.comentarios_recepcion.match(/Modelo:\s*(.+)/);
      if (tipoMatch && modeloMatch) {
        equipoDescripcion = `${modeloMatch[1]} - ${tipoMatch[1]}`.trim();
      }
    }

    // Formatear fecha
    const fechaCreacion = new Date(orden.fecha_creacion).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Llamar al endpoint de correos
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: 'confirmacion_orden',
        clienteEmail,
        clienteNombre,
        ordenId: orden.codigo,
        fechaCreacion,
        equipoDescripcion,
        productoId: orden.equipo?.id,
      }),
    });

    if (!response.ok) {
      console.error('❌ Error al enviar correo:', await response.text());
      return false;
    }

    console.log('✅ Notificación de orden creada enviada');
    return true;
  } catch (error) {
    console.error('❌ Error en notificarOrdenCreada:', error);
    return false;
  }
}

/**
 * Enviar notificación de cotización rechazada
 */
export async function notificarCotizacionRechazada(ordenId: string): Promise<boolean> {
  try {
    // Obtener datos de la orden y cliente
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select(`
        *,
        cliente:clientes(*)
      `)
      .eq('id', ordenId)
      .single();

    if (ordenError || !orden) {
      console.error('❌ Error al obtener orden:', ordenError);
      return false;
    }

    // Validar que el cliente tenga email
    const clienteEmail = orden.cliente?.correo_electronico || orden.cliente?.email;
    
    if (!clienteEmail) {
      console.warn('⚠️ Cliente sin email, no se puede enviar notificación de cotización rechazada');
      return false;
    }

    // Obtener nombre del cliente
    const clienteNombre =
      orden.cliente.es_juridica
        ? orden.cliente.razon_social || orden.cliente.nombre_comercial || 'Cliente'
        : orden.cliente.nombre_contacto || orden.cliente.nombre_comercial || orden.cliente.razon_social || 'Cliente';
    
    // Obtener valor de revisión
    const valorRevision = orden.valor_revision || 0;
    
    console.log('📧 Enviando correo de cotización rechazada a:', clienteEmail, 'para:', clienteNombre);

    // Llamar al endpoint de correos
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: 'cotizacion_rechazada',
        clienteEmail,
        clienteNombre,
        ordenId: orden.codigo,
        valorRevision,
      }),
    });

    if (!response.ok) {
      console.error('❌ Error al enviar correo:', await response.text());
      return false;
    }

    console.log('✅ Notificación de cotización rechazada enviada');
    return true;
  } catch (error) {
    console.error('❌ Error en notificarCotizacionRechazada:', error);
    return false;
  }
}
