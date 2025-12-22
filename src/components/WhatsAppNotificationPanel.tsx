'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import WhatsAppButton, { WhatsAppCotizacionButton, WhatsAppNotificacionButton } from './WhatsAppButton';
import { 
  getMensajeOrdenCreada, 
  getMensajeCambioFase, 
  getMensajeCotizacion,
  getMensajeListoEntrega 
} from '@/lib/whatsapp/whatsappService';

interface Cliente {
  telefono?: string;
  celular?: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  tipo_persona?: 'natural' | 'jurídica';
}

interface Orden {
  id: string;
  codigo: string;
  estado_actual: string;
  total?: number;
  cliente?: Cliente;
  equipo?: {
    id: string;
  };
}

interface WhatsAppNotificationPanelProps {
  orden: Orden;
  mostrarCotizacion?: boolean;
  mostrarCambioFase?: boolean;
  cotizacionUrl?: string;
}

/**
 * Panel de notificaciones por WhatsApp
 * Muestra opciones de notificación según el contexto de la orden
 */
export default function WhatsAppNotificationPanel({
  orden,
  mostrarCotizacion = false,
  mostrarCambioFase = true,
  cotizacionUrl,
}: WhatsAppNotificationPanelProps) {
  const [telefono, setTelefono] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState<string>('');

  useEffect(() => {
    if (!orden.cliente) return;

    // Obtener teléfono (prioridad a celular)
    const tel = orden.cliente.celular || orden.cliente.telefono || '';
    setTelefono(tel);

    // Obtener nombre del cliente
    const nombre =
      orden.cliente.tipo_persona === 'jurídica'
        ? orden.cliente.razon_social || 'Cliente'
        : `${orden.cliente.nombres || ''} ${orden.cliente.apellidos || ''}`.trim() || 'Cliente';
    setClienteNombre(nombre);
  }, [orden]);

  // Si no hay teléfono, no mostrar el panel
  if (!telefono) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Phone size={20} />
          <p className="text-sm font-medium">
            El cliente no tiene número de teléfono registrado
          </p>
        </div>
      </div>
    );
  }

  const trackingUrl = process.env.NEXT_PUBLIC_TRACKING_URL || 'https://tscosta.com.co/';

  // Generar mensajes
  const mensajeCambioFase = getMensajeCambioFase({
    clienteNombre,
    ordenId: orden.codigo,
    faseActual: orden.estado_actual,
    trackingUrl,
    productoId: orden.equipo?.id,
  });

  const mensajeCotizacion = getMensajeCotizacion({
    clienteNombre,
    ordenId: orden.codigo,
    cotizacionUrl: cotizacionUrl || `${trackingUrl}estado-producto?codigo=${orden.codigo}`,
    total: orden.total,
  });

  const mensajeListoEntrega = getMensajeListoEntrega({
    clienteNombre,
    ordenId: orden.codigo,
  });

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="text-green-600" size={24} />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notificaciones WhatsApp
        </h3>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        <p>
          <strong>Cliente:</strong> {clienteNombre}
        </p>
        <p>
          <strong>Teléfono:</strong> {telefono}
        </p>
      </div>

      <div className="space-y-3">
        {/* Botón de cambio de fase */}
        {mostrarCambioFase && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notificar cambio de fase
            </label>
            <WhatsAppNotificacionButton
              telefono={telefono}
              mensaje={mensajeCambioFase}
              faseActual={orden.estado_actual}
              className="w-full"
            />
          </div>
        )}

        {/* Botón de cotización */}
        {mostrarCotizacion && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enviar cotización
            </label>
            <WhatsAppCotizacionButton
              telefono={telefono}
              mensaje={mensajeCotizacion}
              className="w-full"
            />
          </div>
        )}

        {/* Botón de entrega lista (solo si está en fase de entrega) */}
        {orden.estado_actual === 'Entrega' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notificar equipo listo
            </label>
            <WhatsAppButton
              telefono={telefono}
              mensaje={mensajeListoEntrega}
              variant="primary"
              size="md"
              className="w-full"
            >
              ✅ Equipo Listo para Entrega
            </WhatsAppButton>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Al hacer clic, se abrirá WhatsApp Web con el mensaje predefinido. 
          Podrás revisarlo y editarlo antes de enviarlo.
        </p>
      </div>
    </div>
  );
}

/**
 * Versión compacta del panel para usar en cards o espacios reducidos
 */
export function WhatsAppNotificationPanelCompact({
  orden,
}: {
  orden: Orden;
}) {
  const telefono = orden.cliente?.celular || orden.cliente?.telefono || '';
  
  if (!telefono) return null;

  const clienteNombre =
    orden.cliente?.tipo_persona === 'jurídica'
      ? orden.cliente.razon_social || 'Cliente'
      : `${orden.cliente?.nombres || ''} ${orden.cliente?.apellidos || ''}`.trim();

  const trackingUrl = process.env.NEXT_PUBLIC_TRACKING_URL || 'https://tscosta.com.co/';

  const mensaje = getMensajeCambioFase({
    clienteNombre,
    ordenId: orden.codigo,
    faseActual: orden.estado_actual,
    trackingUrl,
    productoId: orden.equipo?.id,
  });

  return (
    <WhatsAppButton
      telefono={telefono}
      mensaje={mensaje}
      variant="outline"
      size="sm"
      mostrarCopiar={false}
    >
      <MessageCircle size={16} />
      Notificar
    </WhatsAppButton>
  );
}
