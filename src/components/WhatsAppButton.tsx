'use client';

import React, { useState } from 'react';
import { MessageCircle, Copy, Check } from 'lucide-react';
import { useWhatsApp } from '@/hooks/useWhatsApp';

interface WhatsAppButtonProps {
  telefono: string;
  mensaje: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  mostrarCopiar?: boolean;
  children?: React.ReactNode;
}

/**
 * Componente reutilizable para enviar mensajes por WhatsApp
 * Abre WhatsApp Web con el número y mensaje predefinido
 */
export default function WhatsAppButton({
  telefono,
  mensaje,
  variant = 'primary',
  size = 'md',
  className = '',
  mostrarCopiar = true,
  children,
}: WhatsAppButtonProps) {
  const { enviarMensaje, copiarMensaje } = useWhatsApp();
  const [copiado, setCopiado] = useState(false);

  const handleEnviar = () => {
    enviarMensaje(telefono, mensaje);
  };

  const handleCopiar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const exito = await copiarMensaje(mensaje);
    if (exito) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  // Estilos base
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Variantes de estilo
  const variantStyles = {
    primary: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 focus:ring-green-500',
    icon: 'p-2 rounded-full bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
  };

  // Tamaños
  const sizeStyles = {
    sm: variant === 'icon' ? 'w-8 h-8' : 'px-3 py-1.5 text-sm',
    md: variant === 'icon' ? 'w-10 h-10' : 'px-4 py-2 text-base',
    lg: variant === 'icon' ? 'w-12 h-12' : 'px-6 py-3 text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleEnviar}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        title="Enviar por WhatsApp"
        aria-label="Enviar por WhatsApp"
      >
        <MessageCircle size={iconSizes[size]} />
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleEnviar}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        title="Enviar por WhatsApp"
      >
        <MessageCircle size={iconSizes[size]} />
        {children || 'Enviar WhatsApp'}
      </button>

      {mostrarCopiar && (
        <button
          onClick={handleCopiar}
          className={`${baseStyles} ${variantStyles.outline} ${sizeStyles[size]} relative`}
          title={copiado ? 'Mensaje copiado' : 'Copiar mensaje'}
          aria-label={copiado ? 'Mensaje copiado' : 'Copiar mensaje'}
        >
          {copiado ? (
            <>
              <Check size={iconSizes[size]} />
              <span className="text-xs">Copiado</span>
            </>
          ) : (
            <>
              <Copy size={iconSizes[size]} />
              {size !== 'sm' && <span className="text-xs">Copiar</span>}
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Variante compacta del botón (solo ícono)
 */
export function WhatsAppIconButton({
  telefono,
  mensaje,
  size = 'md',
  className = '',
}: Omit<WhatsAppButtonProps, 'variant' | 'children' | 'mostrarCopiar'>) {
  return (
    <WhatsAppButton
      telefono={telefono}
      mensaje={mensaje}
      variant="icon"
      size={size}
      className={className}
      mostrarCopiar={false}
    />
  );
}

/**
 * Variante para cotización (con estilo especial)
 */
export function WhatsAppCotizacionButton({
  telefono,
  mensaje,
  className = '',
}: Omit<WhatsAppButtonProps, 'variant' | 'size' | 'children' | 'mostrarCopiar'>) {
  return (
    <WhatsAppButton
      telefono={telefono}
      mensaje={mensaje}
      variant="primary"
      size="lg"
      className={`shadow-lg hover:shadow-xl ${className}`}
      mostrarCopiar={true}
    >
      💰 Enviar Cotización por WhatsApp
    </WhatsAppButton>
  );
}

/**
 * Variante para cambio de fase (con estilo outline)
 */
export function WhatsAppNotificacionButton({
  telefono,
  mensaje,
  faseActual,
  className = '',
}: Omit<WhatsAppButtonProps, 'variant' | 'size' | 'children' | 'mostrarCopiar'> & {
  faseActual: string;
}) {
  const emojis: Record<string, string> = {
    'Recepción': '📥',
    'Diagnóstico': '🔍',
    'Cotización': '💰',
    'Reparación': '🔧',
    'Entrega': '✅',
    'Finalizada': '🎉',
  };

  const emoji = emojis[faseActual] || '🔔';

  return (
    <WhatsAppButton
      telefono={telefono}
      mensaje={mensaje}
      variant="outline"
      size="md"
      className={className}
      mostrarCopiar={true}
    >
      {emoji} Notificar Cambio de Fase
    </WhatsAppButton>
  );
}
