import { supabase } from "@/lib/supabaseClient";
import {
  getMensajeOrdenCreada,
  getMensajeCambioFase,
  getMensajeCotizacion,
  getMensajeBodega,
  getMensajeChatarrizado,
  getMensajeCotizacionRechazada,
  openWhatsApp,
  generateWhatsAppURL,
} from "./whatsappService";

/**
 * Helper para abrir WhatsApp con notificaciones automáticas
 * Este módulo se ejecuta en el navegador para abrir WhatsApp Web
 */

const TRACKING_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_TRACKING_URL || "https://tscosta.com.co/"
    : "https://tscosta.com.co/";

/**
 * Notificar orden creada por WhatsApp
 * Para evitar bloqueos de popup, abrimos primero una ventana y luego navegamos a WhatsApp cuando tengamos los datos.
 */
export async function notificarOrdenCreadaWhatsApp(ordenId: string, preOpened?: Window | null): Promise<void> {
  // Usar una ventana pre-abierta si viene desde el evento del usuario; si no, abrir aquí
  const popup = preOpened ?? (typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null);
  try {
    // Obtener datos de la orden y cliente
    const { data: orden, error: ordenError } = await supabase
      .from("ordenes")
      .select(
        `
        *,
        cliente:clientes(*),
        equipo:equipos(
          *,
          modelo:modelos(
            *,
            marca:marcas(*)
          )
        )
      `
      )
      .eq("id", ordenId)
      .single();

    if (ordenError || !orden) {
      console.error("❌ Error al obtener orden:", ordenError);
      if (popup) popup.close();
      return;
    }

    // Validar que el cliente tenga teléfono
    if (!orden.cliente?.telefono && !orden.cliente?.celular) {
      console.warn("⚠️ Cliente sin teléfono, no se puede enviar notificación");
      if (popup) popup.close();
      return;
    }

    const telefono = orden.cliente.celular || orden.cliente.telefono;

    // Obtener nombre del cliente
    const clienteNombre =
      orden.cliente.es_juridica
        ? orden.cliente.razon_social || orden.cliente.nombre_comercial || 'Cliente'
        : orden.cliente.nombre_contacto || orden.cliente.nombre_comercial || orden.cliente.razon_social || 'Cliente';

    // Construir descripción del equipo
    let equipoDescripcion = "";
    if (orden.equipo) {
      const marca = orden.equipo.modelo?.marca?.nombre || "";
      const modelo = orden.equipo.modelo?.equipo || "";
      const tipo = orden.equipo.tipo_equipo || "";
      equipoDescripcion = `${marca} ${modelo} - ${tipo}`.trim();
    }

    // Generar mensaje y URL
    const mensaje = getMensajeOrdenCreada({
      clienteNombre,
      ordenId: orden.codigo,
      trackingUrl: TRACKING_URL,
      equipoDescripcion,
      productoId: orden.equipo?.id,
    });
    const url = generateWhatsAppURL(telefono, mensaje);

    // Navegar el popup a WhatsApp o abrir si no se pudo pre-abrir
    if (popup) {
      popup.location.href = url;
    } else {
      openWhatsApp(telefono, mensaje);
    }

    console.log("✅ WhatsApp abierto para notificación de orden creada");
  } catch (error) {
    console.error("❌ Error en notificarOrdenCreadaWhatsApp:", error);
    if (popup) popup.close();
  }
}

/**
 * Notificar cambio de fase por WhatsApp
 */
export async function notificarCambioFaseWhatsApp(
  ordenId: string,
  nuevaFase: string
): Promise<void> {
  try {
    // Obtener datos de la orden y cliente
    const { data: orden, error: ordenError } = await supabase
      .from("ordenes")
      .select(
        `
        *,
        *,
        cliente:clientes(*),
        equipo:equipos(id)
      `
      )
      .eq("id", ordenId)
      .single();

    if (ordenError || !orden) {
      console.error("❌ Error al obtener orden:", ordenError);
      return;
    }

    // Validar que el cliente tenga teléfono
    if (!orden.cliente?.telefono && !orden.cliente?.celular) {
      console.warn("⚠️ Cliente sin teléfono, no se puede enviar notificación");
      return;
    }

    const telefono = orden.cliente.celular || orden.cliente.telefono;

    // Obtener nombre del cliente
    const clienteNombre =
      orden.cliente.es_juridica
        ? orden.cliente.razon_social || orden.cliente.nombre_comercial || 'Cliente'
        : orden.cliente.nombre_contacto || orden.cliente.nombre_comercial || orden.cliente.razon_social || 'Cliente';

    // Generar mensaje
    const mensaje = getMensajeCambioFase({
      clienteNombre,
      ordenId: orden.codigo,
      faseActual: nuevaFase,
      trackingUrl: TRACKING_URL,
      productoId: orden.equipo?.id,
    });

    // Abrir WhatsApp
    openWhatsApp(telefono, mensaje);

    console.log("✅ WhatsApp abierto para notificación de cambio de fase");
  } catch (error) {
    console.error("❌ Error en notificarCambioFaseWhatsApp:", error);
  }
}

/**
 * Notificar cotización lista por WhatsApp
 */
export async function notificarCotizacionWhatsApp(
  ordenId: string,
  cotizacionUrl?: string,
  total?: number
): Promise<void> {
  try {
    // Obtener datos de la orden y cliente
    const { data: orden, error: ordenError } = await supabase
      .from("ordenes")
      .select(
        `
        *,
        *,
        cliente:clientes(*),
        equipo:equipos(id)
      `
      )
      .eq("id", ordenId)
      .single();

    if (ordenError || !orden) {
      console.error("❌ Error al obtener orden:", ordenError);
      return;
    }

    // Validar que el cliente tenga teléfono
    if (!orden.cliente?.telefono && !orden.cliente?.celular) {
      console.warn("⚠️ Cliente sin teléfono, no se puede enviar notificación");
      return;
    }

    const telefono = orden.cliente.celular || orden.cliente.telefono;

    // Obtener nombre del cliente
    const clienteNombre =
      orden.cliente.es_juridica
        ? orden.cliente.razon_social || orden.cliente.nombre_comercial || 'Cliente'
        : orden.cliente.nombre_contacto || orden.cliente.nombre_comercial || orden.cliente.razon_social || 'Cliente';

    // Generar URL de cotización si no se proporciona
    const urlCotizacion = cotizacionUrl || `${TRACKING_URL}estado-producto?codigo=${orden.codigo}`;

    // Generar mensaje
    const mensaje = getMensajeCotizacion({
      clienteNombre,
      ordenId: orden.codigo,
      cotizacionUrl: urlCotizacion,
      total: total || orden.total,
    });

    // Abrir WhatsApp
    openWhatsApp(telefono, mensaje);

    console.log("✅ WhatsApp abierto para notificación de cotización");
  } catch (error) {
    console.error("❌ Error en notificarCotizacionWhatsApp:", error);
  }
}

/**
 * Obtener datos de cliente para WhatsApp
 * Útil para usar en componentes
 */
export async function obtenerDatosClienteWhatsApp(ordenId: string): Promise<{
  telefono: string;
  clienteNombre: string;
  ordenCodigo: string;
} | null> {
  try {
    const { data: orden, error } = await supabase
      .from("ordenes")
      .select(
        `
        codigo,
        cliente:clientes(*)
      `
      )
      .eq("id", ordenId)
      .single();

    if (error || !orden) {
      console.error("❌ Error al obtener orden:", error);
      return null;
    }

    if (!orden.cliente?.telefono && !orden.cliente?.celular) {
      return null;
    }

    const telefono = orden.cliente.celular || orden.cliente.telefono;
    const clienteNombre =
      orden.cliente.es_juridica
        ? orden.cliente.razon_social || orden.cliente.nombre_comercial || 'Cliente'
        : orden.cliente.nombre_contacto || orden.cliente.nombre_comercial || orden.cliente.razon_social || 'Cliente';

    return {
      telefono,
      clienteNombre,
      ordenCodigo: orden.codigo,
    };
  } catch (error) {
    console.error("❌ Error en obtenerDatosClienteWhatsApp:", error);
    return null;
  }
}

/**
 * Notificar envío a bodega por WhatsApp
 */
export async function notificarBodegaWhatsApp(
  ordenId: string,
  fecha: string
): Promise<void> {
  try {
    const { data: orden, error: ordenError } = await supabase
      .from("ordenes")
      .select(
        `
        *,
        cliente:clientes(*)
      `
      )
      .eq("id", ordenId)
      .single();

    if (ordenError || !orden) {
      console.error("❌ Error al obtener orden:", ordenError);
      return;
    }

    if (!orden.cliente?.telefono && !orden.cliente?.celular) {
      console.warn("⚠️ Cliente sin teléfono, no se puede enviar notificación");
      return;
    }

    const telefono = orden.cliente.celular || orden.cliente.telefono;
    const clienteNombre =
      orden.cliente.es_juridica
        ? orden.cliente.razon_social || orden.cliente.nombre_comercial || 'Cliente'
        : orden.cliente.nombre_contacto || orden.cliente.nombre_comercial || orden.cliente.razon_social || 'Cliente';

    const mensaje = getMensajeBodega({
      clienteNombre,
      ordenId: orden.codigo,
      fecha,
      trackingUrl: TRACKING_URL,
    });

    openWhatsApp(telefono, mensaje);
    console.log("✅ WhatsApp abierto para notificación de bodega");
  } catch (error) {
    console.error("❌ Error en notificarBodegaWhatsApp:", error);
  }
}

/**
 * Notificar chatarrizado por WhatsApp
 */
export async function notificarChatarrizadoWhatsApp(
  ordenId: string,
  fecha: string
): Promise<void> {
  try {
    const { data: orden, error: ordenError } = await supabase
      .from("ordenes")
      .select(
        `
        *,
        cliente:clientes(*)
      `
      )
      .eq("id", ordenId)
      .single();

    if (ordenError || !orden) {
      console.error("❌ Error al obtener orden:", ordenError);
      return;
    }

    if (!orden.cliente?.telefono && !orden.cliente?.celular) {
      console.warn("⚠️ Cliente sin teléfono, no se puede enviar notificación");
      return;
    }

    const telefono = orden.cliente.celular || orden.cliente.telefono;
    const clienteNombre =
      orden.cliente.es_juridica
        ? orden.cliente.razon_social || orden.cliente.nombre_comercial || 'Cliente'
        : orden.cliente.nombre_contacto || orden.cliente.nombre_comercial || orden.cliente.razon_social || 'Cliente';

    const mensaje = getMensajeChatarrizado({
      clienteNombre,
      ordenId: orden.codigo,
      fecha,
      trackingUrl: TRACKING_URL,
    });

    openWhatsApp(telefono, mensaje);
    console.log("✅ WhatsApp abierto para notificación de chatarrizado");
  } catch (error) {
    console.error("❌ Error en notificarChatarrizadoWhatsApp:", error);
  }
}

/**
 * Notificar cotización rechazada por WhatsApp
 * Informa al cliente que debe pagar el valor de revisión y recoger el equipo
 */
export async function notificarCotizacionRechazadaWhatsApp(
  ordenId: string
): Promise<void> {
  try {
    const { data: orden, error: ordenError } = await supabase
      .from("ordenes")
      .select(
        `
        *,
        cliente:clientes(*)
      `
      )
      .eq("id", ordenId)
      .single();

    if (ordenError || !orden) {
      console.error("❌ Error al obtener orden:", ordenError);
      return;
    }

    if (!orden.cliente?.telefono && !orden.cliente?.celular) {
      console.warn("⚠️ Cliente sin teléfono, no se puede enviar notificación");
      return;
    }

    const telefono = orden.cliente.celular || orden.cliente.telefono;
    const clienteNombre =
      orden.cliente.es_juridica
        ? orden.cliente.razon_social || orden.cliente.nombre_comercial || 'Cliente'
        : orden.cliente.nombre_contacto || orden.cliente.nombre_comercial || orden.cliente.razon_social || 'Cliente';

    // Obtener el valor de revisión de la orden
    const valorRevision = orden.valor_revision || 0;

    const mensaje = getMensajeCotizacionRechazada({
      clienteNombre,
      ordenId: orden.codigo,
      valorRevision,
      trackingUrl: TRACKING_URL,
    });

    openWhatsApp(telefono, mensaje);
    console.log("✅ WhatsApp abierto para notificación de cotización rechazada");
  } catch (error) {
    console.error("❌ Error en notificarCotizacionRechazadaWhatsApp:", error);
  }
}
