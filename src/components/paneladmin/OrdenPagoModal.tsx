"use client";

import React from 'react';
import { X, Package, MapPin, CreditCard, Calendar, User, Mail, Phone, FileText } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import type { OrdenPago, EstadoPago } from '@/types/bold.types';

interface OrdenPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orden: OrdenPago | null;
}

export default function OrdenPagoModal({ isOpen, onClose, orden }: OrdenPagoModalProps) {
  const { theme } = useTheme();

  if (!isOpen || !orden) return null;

  const getEstadoBadgeClass = (estado: EstadoPago) => {
    switch (estado) {
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      case 'cancelado':
        return 'bg-gray-100 text-gray-800';
      case 'expirado':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetodoPagoLabel = (metodo: string) => {
    switch (metodo) {
      case 'pse':
        return 'PSE';
      case 'credit-card':
        return 'Tarjeta de Crédito';
      case 'efecty':
        return 'Efecty';
      case 'whatsapp':
        return 'WhatsApp';
      default:
        return metodo;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`relative w-full max-w-4xl rounded-lg shadow-xl ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}>
            <div>
              <h2 className={`text-2xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Detalles de la Orden
              </h2>
              <p className={`text-sm mt-1 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {orden.order_id}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light'
                  ? 'hover:bg-gray-100 text-gray-500'
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información del Cliente */}
              <div className={`p-4 rounded-lg border ${
                theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  <User className="w-5 h-5" />
                  Información del Cliente
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={`text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      Nombre
                    </label>
                    <p className={`text-sm font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {orden.cliente_nombre}
                    </p>
                  </div>
                  <div>
                    <label className={`text-xs font-medium flex items-center gap-1 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      <Mail className="w-3 h-3" />
                      Email
                    </label>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {orden.cliente_email}
                    </p>
                  </div>
                  <div>
                    <label className={`text-xs font-medium flex items-center gap-1 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      <Phone className="w-3 h-3" />
                      Teléfono
                    </label>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {orden.cliente_telefono}
                    </p>
                  </div>
                  {orden.cliente_documento && (
                    <div>
                      <label className={`text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        Documento
                      </label>
                      <p className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {orden.cliente_tipo_documento || 'CC'}: {orden.cliente_documento}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dirección de Envío */}
              <div className={`p-4 rounded-lg border ${
                theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  <MapPin className="w-5 h-5" />
                  Dirección de Envío
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={`text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      Dirección
                    </label>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {orden.direccion_completa}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        Ciudad
                      </label>
                      <p className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {orden.ciudad}
                      </p>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        Departamento
                      </label>
                      <p className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {orden.departamento}
                      </p>
                    </div>
                  </div>
                  {orden.codigo_postal && (
                    <div>
                      <label className={`text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        Código Postal
                      </label>
                      <p className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {orden.codigo_postal}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Pago */}
              <div className={`p-4 rounded-lg border ${
                theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  <CreditCard className="w-5 h-5" />
                  Información de Pago
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={`text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      Método de Pago
                    </label>
                    <p className={`text-sm font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {getMetodoPagoLabel(orden.metodo_pago)}
                    </p>
                  </div>
                  <div>
                    <label className={`text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      Estado
                    </label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        getEstadoBadgeClass(orden.estado_pago)
                      }`}>
                        {orden.estado_pago.charAt(0).toUpperCase() + orden.estado_pago.slice(1)}
                      </span>
                    </div>
                  </div>
                  {orden.bold_transaction_id && (
                    <div>
                      <label className={`text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        Transaction ID
                      </label>
                      <p className={`text-xs font-mono ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {orden.bold_transaction_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fechas */}
              <div className={`p-4 rounded-lg border ${
                theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  <Calendar className="w-5 h-5" />
                  Fechas
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={`text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      Fecha de Creación
                    </label>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {new Date(orden.created_at).toLocaleString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {orden.fecha_pago && (
                    <div>
                      <label className={`text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        Fecha de Pago
                      </label>
                      <p className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {new Date(orden.fecha_pago).toLocaleString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className={`mt-6 p-4 rounded-lg border ${
              theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                <Package className="w-5 h-5" />
                Productos ({orden.productos?.length || 0})
              </h3>
              <div className="space-y-3">
                {orden.productos?.map((producto, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      theme === 'light' ? 'bg-white' : 'bg-gray-800'
                    }`}
                  >
                    {producto.image && (
                      <img
                        src={producto.image}
                        alt={producto.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {producto.name}
                      </p>
                      {producto.model && (
                        <p className={`text-xs ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {producto.model}
                        </p>
                      )}
                      <p className={`text-sm mt-1 ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        Cantidad: {producto.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        ${(producto.price * producto.quantity).toLocaleString('es-CO')}
                      </p>
                      <p className={`text-xs ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        ${producto.price.toLocaleString('es-CO')} c/u
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de Pago */}
            <div className={`mt-6 p-4 rounded-lg border ${
              theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Resumen de Pago
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    Subtotal
                  </span>
                  <span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                    ${orden.subtotal.toLocaleString('es-CO')}
                  </span>
                </div>
                {orden.descuento > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Descuento {orden.codigo_cupon && `(${orden.codigo_cupon})`}
                    </span>
                    <span>
                      -${orden.descuento.toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                    Envío
                  </span>
                  <span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
                    ${orden.costo_envio.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className={`flex justify-between pt-2 border-t text-lg font-bold ${
                  theme === 'light' ? 'border-gray-300 text-gray-900' : 'border-gray-600 text-white'
                }`}>
                  <span>Total</span>
                  <span>${orden.total.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            {/* Notas del Pedido */}
            {orden.notas_pedido && (
              <div className={`mt-6 p-4 rounded-lg border ${
                theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
              }`}>
                <h3 className={`text-lg font-semibold mb-2 flex items-center gap-2 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  <FileText className="w-5 h-5" />
                  Notas del Pedido
                </h3>
                <p className={`text-sm ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  {orden.notas_pedido}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex justify-end gap-3 p-6 border-t ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
