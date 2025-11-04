import { useCallback } from 'react';
import { openWhatsApp, generateWhatsAppURL } from '@/lib/whatsapp/whatsappService';

/**
 * Hook personalizado para facilitar el uso de WhatsApp
 * Proporciona funciones para abrir WhatsApp con mensajes predefinidos
 */
export function useWhatsApp() {
  /**
   * Enviar mensaje por WhatsApp
   */
  const enviarMensaje = useCallback((telefono: string, mensaje: string) => {
    if (!telefono) {
      console.error('❌ Número de teléfono requerido');
      return;
    }

    if (!mensaje) {
      console.error('❌ Mensaje requerido');
      return;
    }

    openWhatsApp(telefono, mensaje);
  }, []);

  /**
   * Obtener URL de WhatsApp sin abrir
   */
  const obtenerURL = useCallback((telefono: string, mensaje: string): string => {
    return generateWhatsAppURL(telefono, mensaje);
  }, []);

  /**
   * Copiar mensaje al portapapeles
   */
  const copiarMensaje = useCallback(async (mensaje: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(mensaje);
      return true;
    } catch (error) {
      console.error('❌ Error al copiar mensaje:', error);
      return false;
    }
  }, []);

  return {
    enviarMensaje,
    obtenerURL,
    copiarMensaje,
  };
}
