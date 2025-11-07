"use client";

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, ShieldCheck, Calendar, User, MapPin, DollarSign, FileText, Star, ThumbsUp } from 'lucide-react';
import { Notification } from '../types/notifications';
import { useTheme } from './ThemeProvider';

interface NotificationModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
}

export function NotificationModal({ notification, isOpen, onClose, onMarkAsRead }: NotificationModalProps) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && notification && !notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  }, [isOpen, notification, onMarkAsRead]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pqr_nuevo':
        return <FileText className="h-6 w-6 text-orange-500" />;
      case 'encuesta_nueva':
        return <Star className="h-6 w-6 text-yellow-500" />;
      case 'cotizacion_aceptada':
        return <ThumbsUp className="h-6 w-6 text-green-500" />;
      case 'order_authorized':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'warranty_info':
        return <ShieldCheck className="h-6 w-6 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-amber-500" />;
      case 'system_alert':
        return <AlertCircle className="h-6 w-6 text-purple-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    const colorMap = {
      pqr_nuevo: theme === 'light' 
        ? 'border-orange-200 bg-orange-50' 
        : 'border-orange-800 bg-orange-900/20',
      encuesta_nueva: theme === 'light' 
        ? 'border-yellow-200 bg-yellow-50' 
        : 'border-yellow-800 bg-yellow-900/20',
      cotizacion_aceptada: theme === 'light' 
        ? 'border-green-200 bg-green-50' 
        : 'border-green-800 bg-green-900/20',
      order_authorized: theme === 'light' 
        ? 'border-green-200 bg-green-50' 
        : 'border-green-800 bg-green-900/20',
      warranty_info: theme === 'light' 
        ? 'border-blue-200 bg-blue-50' 
        : 'border-blue-800 bg-blue-900/20',
      success: theme === 'light' 
        ? 'border-green-200 bg-green-50' 
        : 'border-green-800 bg-green-900/20',
      error: theme === 'light' 
        ? 'border-red-200 bg-red-50' 
        : 'border-red-800 bg-red-900/20',
      warning: theme === 'light' 
        ? 'border-amber-200 bg-amber-50' 
        : 'border-amber-800 bg-amber-900/20',
      system_alert: theme === 'light' 
        ? 'border-purple-200 bg-purple-50' 
        : 'border-purple-800 bg-purple-900/20',
      default: theme === 'light' 
        ? 'border-blue-200 bg-blue-50' 
        : 'border-blue-800 bg-blue-900/20'
    };
    
    return colorMap[type as keyof typeof colorMap] || colorMap.default;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!isOpen || !notification) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
      isVisible ? 'backdrop-blur-sm bg-black/30' : 'backdrop-blur-none bg-transparent'
    }`}>
      <div 
        className={`relative w-full max-w-md transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          animation: isVisible ? 'slideInUp 0.3s ease-out' : undefined
        }}
      >
        <div className={`
          rounded-2xl border-2 shadow-2xl backdrop-blur-xl p-6
          ${getNotificationColor(notification.type)}
          ${theme === 'light' ? '' : 'bg-dark-bg-secondary/95 text-white border-lime-400/20'}
        `}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getNotificationIcon(notification.type)}
              <div>
                <h3 className={`text-lg font-semibold ${
                  theme === 'light'
                    ? 'text-gray-900'
                    : 'text-white'
                }`}>
                  {notification.title}
                </h3>
                <p className={`text-sm ${
                  theme === 'light'
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}>
                  {formatDate(notification.timestamp)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-full transition-colors ${
                theme === 'light'
                  ? 'hover:bg-gray-200'
                  : 'hover:bg-gray-700'
              }`}
            >
              <X className={`h-5 w-5 ${
                theme === 'light'
                  ? 'text-gray-500'
                  : 'text-gray-400'
              }`} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <p className={`${
              theme === 'light'
                ? 'text-gray-700'
                : 'text-gray-300'
            }`}>
              {notification.message}
            </p>

            {/* Order Information */}
            {notification.data?.orderInfo && (
              <div className={`rounded-lg p-4 space-y-2 ${
                theme === 'light'
                  ? 'bg-white/70'
                  : 'bg-dark-bg-tertiary/50 border border-lime-400/10'
              }`}>
                <h4 className={`font-semibold flex items-center ${
                  theme === 'light'
                    ? 'text-gray-900'
                    : 'text-white'
                }`}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Información de Orden
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Orden:</span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.orderInfo.orderNumber}
                    </p>
                  </div>
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Estado:</span>
                    <p className={`font-medium capitalize ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.orderInfo.status}
                    </p>
                  </div>
                  {notification.data.orderInfo.amount && (
                    <div className="col-span-2">
                      <span className={`${
                        theme === 'light'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}>Monto:</span>
                      <p className={`font-medium flex items-center ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-white'
                      }`}>
                        <DollarSign className="h-4 w-4 mr-1" />
                        {notification.data.orderInfo.amount.toLocaleString()} {notification.data.orderInfo.currency || 'CRC'}
                      </p>
                    </div>
                  )}
                  {notification.data.orderInfo.description && (
                    <div className="col-span-2">
                      <span className={`${
                        theme === 'light'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}>Descripción:</span>
                      <p className={`font-medium ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-white'
                      }`}>
                        {notification.data.orderInfo.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warranty Information */}
            {notification.data?.warrantyInfo && (
              <div className={`rounded-lg p-4 space-y-2 ${
                theme === 'light'
                  ? 'bg-white/70'
                  : 'bg-gray-700/50'
              }`}>
                <h4 className={`font-semibold flex items-center ${
                  theme === 'light'
                    ? 'text-gray-900'
                    : 'text-white'
                }`}>
                  <ShieldCheck className="h-4 w-4 mr-2 text-blue-500" />
                  Información de Garantía
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Tipo:</span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.warrantyInfo.warrantyType}
                    </p>
                  </div>
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Cobertura:</span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.warrantyInfo.coverage}
                    </p>
                  </div>
                  <div>
                    <span className={`flex items-center ${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>
                      <Calendar className="h-4 w-4 mr-1" />
                      Vence:
                    </span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {formatDate(notification.data.warrantyInfo.expirationDate)}
                    </p>
                  </div>
                  {notification.data.warrantyInfo.terms && (
                    <div>
                      <span className={`${
                        theme === 'light'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}>Términos:</span>
                      <p className={`font-medium ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-white'
                      }`}>
                        {notification.data.warrantyInfo.terms}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PQR Information */}
            {notification.data?.pqrInfo && (
              <div className={`rounded-lg p-4 space-y-2 ${
                theme === 'light'
                  ? 'bg-white/70'
                  : 'bg-dark-bg-tertiary/50 border border-lime-400/10'
              }`}>
                <h4 className={`font-semibold flex items-center ${
                  theme === 'light'
                    ? 'text-gray-900'
                    : 'text-white'
                }`}>
                  <FileText className="h-4 w-4 mr-2 text-orange-500" />
                  Información de la Solicitud
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Radicado:</span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.pqrInfo.radicado}
                    </p>
                  </div>
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Tipo:</span>
                    <p className={`font-medium capitalize ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.pqrInfo.tipoSolicitud}
                    </p>
                  </div>
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Prioridad:</span>
                    <p className={`font-medium capitalize ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.pqrInfo.prioridad}
                    </p>
                  </div>
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Ciudad:</span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.pqrInfo.ciudad}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Asunto:</span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.pqrInfo.asunto}
                    </p>
                  </div>
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Email:</span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.pqrInfo.email}
                    </p>
                  </div>
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Teléfono:</span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.pqrInfo.telefono}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Encuesta Information */}
            {notification.data?.encuestaInfo && (
              <div className={`rounded-lg p-4 space-y-2 ${
                theme === 'light'
                  ? 'bg-white/70'
                  : 'bg-dark-bg-tertiary/50 border border-lime-400/10'
              }`}>
                <h4 className={`font-semibold flex items-center ${
                  theme === 'light'
                    ? 'text-gray-900'
                    : 'text-white'
                }`}>
                  <Star className="h-4 w-4 mr-2 text-yellow-500" />
                  Resultados de la Encuesta
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className={`${
                        theme === 'light'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}>Cliente:</span>
                      <p className={`font-medium ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-white'
                      }`}>
                        {notification.data.encuestaInfo.nombre}
                      </p>
                    </div>
                    <div>
                      <span className={`${
                        theme === 'light'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}>Sede:</span>
                      <p className={`font-medium capitalize ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-white'
                      }`}>
                        {notification.data.encuestaInfo.sede}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className={`${
                        theme === 'light'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}>Calificación Promedio:</span>
                      <p className={`font-bold text-lg ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-white'
                      }`}>
                        {notification.data.encuestaInfo.promedio.toFixed(1)}/5 ⭐
                      </p>
                    </div>
                    <div>
                      <span className={`${
                        theme === 'light'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}>NPS:</span>
                      <p className={`font-bold text-lg ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-white'
                      }`}>
                        {notification.data.encuestaInfo.nps}/10
                      </p>
                    </div>
                  </div>
                  {notification.data.encuestaInfo.comentarios && (
                    <div className="pt-2">
                      <span className={`${
                        theme === 'light'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}>Comentarios:</span>
                      <p className={`font-medium italic ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-white'
                      }`}>
                        "{notification.data.encuestaInfo.comentarios}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cotización Information */}
            {notification.data?.cotizacionInfo && (
              <div className={`rounded-lg p-4 space-y-2 ${
                theme === 'light'
                  ? 'bg-white/70'
                  : 'bg-dark-bg-tertiary/50 border border-lime-400/10'
              }`}>
                <h4 className={`font-semibold flex items-center ${
                  theme === 'light'
                    ? 'text-gray-900'
                    : 'text-white'
                }`}>
                  <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                  Información de la Cotización
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Orden:</span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.cotizacionInfo.numeroOrden}
                    </p>
                  </div>
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Cliente:</span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.cotizacionInfo.clienteNombre}
                    </p>
                  </div>
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Total:</span>
                    <p className={`font-medium flex items-center ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      <DollarSign className="h-4 w-4 mr-1" />
                      {notification.data.cotizacionInfo.total.toLocaleString()} CRC
                    </p>
                  </div>
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Fase:</span>
                    <p className={`font-medium capitalize ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.cotizacionInfo.faseActual}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Information */}
            {notification.data?.customerInfo && (
              <div className={`rounded-lg p-4 space-y-2 ${
                theme === 'light'
                  ? 'bg-white/70'
                  : 'bg-gray-700/50'
              }`}>
                <h4 className={`font-semibold flex items-center ${
                  theme === 'light'
                    ? 'text-gray-900'
                    : 'text-white'
                }`}>
                  <User className="h-4 w-4 mr-2 text-gray-600" />
                  Información del Cliente
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className={`${
                      theme === 'light'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>Nombre:</span>
                    <p className={`font-medium ${
                      theme === 'light'
                        ? 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {notification.data.customerInfo.name}
                    </p>
                  </div>
                  {notification.data.customerInfo.phone && (
                    <div>
                      <span className={`${
                        theme === 'light'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}>Teléfono:</span>
                      <p className={`font-medium ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-white'
                      }`}>
                        {notification.data.customerInfo.phone}
                      </p>
                    </div>
                  )}
                  {notification.data.customerInfo.address && (
                    <div>
                      <span className={`flex items-center ${
                        theme === 'light'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}>
                        <MapPin className="h-4 w-4 mr-1" />
                        Dirección:
                      </span>
                      <p className={`font-medium ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-white'
                      }`}>
                        {notification.data.customerInfo.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          {notification.actionButton && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  notification.actionButton?.action();
                  handleClose();
                }}
                className={`px-6 py-2 font-medium rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'bg-mint-600 hover:bg-mint-700 text-white'
                    : 'bg-lime-400 hover:bg-lime-500 text-black font-bold'
                }`}
              >
                {notification.actionButton.text}
              </button>
            </div>
          )}

          {/* Close button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleClose}
              className={`px-8 py-2 font-medium rounded-lg transition-colors ${
                theme === 'light'
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  : 'bg-dark-bg-tertiary hover:bg-lime-400/10 text-white border border-lime-400/30 hover:border-lime-400/50'
              }`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translate3d(0, 100%, 0);
            visibility: visible;
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}