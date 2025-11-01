"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { Cliente } from '@/types/database.types';
import { crearCliente, actualizarCliente } from '@/lib/services/clienteService';
import { useToast } from '@/contexts/ToastContext';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cliente?: Cliente | null;
}

export default function ClienteModal({ isOpen, onClose, onSuccess, cliente }: ClienteModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    tipo_documento: 'CC',
    identificacion: '',
    dv: '',
    es_juridica: false,
    razon_social: '',
    regimen: 'Simplificado',
    nombre_comercial: '',
    ciudad: '',
    direccion: '',
    telefono: '',
    correo_electronico: '',
    comentarios: ''
  });

  // Cargar datos del cliente si estamos editando
  useEffect(() => {
    if (cliente) {
      setFormData({
        tipo_documento: cliente.tipo_documento || 'CC',
        identificacion: cliente.identificacion,
        dv: cliente.dv || '',
        es_juridica: cliente.es_juridica,
        razon_social: cliente.razon_social || '',
        regimen: cliente.regimen || 'Simplificado',
        nombre_comercial: cliente.nombre_comercial || '',
        ciudad: cliente.ciudad || '',
        direccion: cliente.direccion || '',
        telefono: cliente.telefono || '',
        correo_electronico: cliente.correo_electronico || '',
        comentarios: cliente.comentarios || ''
      });
    } else {
      // Reset form for new cliente
      setFormData({
        tipo_documento: 'CC',
        identificacion: '',
        dv: '',
        es_juridica: false,
        razon_social: '',
        regimen: 'Simplificado',
        nombre_comercial: '',
        ciudad: '',
        direccion: '',
        telefono: '',
        correo_electronico: '',
        comentarios: ''
      });
    }
    setError('');
  }, [cliente, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones básicas
      if (!formData.identificacion) {
        setError('La identificación es requerida');
        setIsLoading(false);
        return;
      }

      if (formData.es_juridica && !formData.razon_social) {
        setError('La razón social es requerida para personas jurídicas');
        setIsLoading(false);
        return;
      }

      if (!formData.es_juridica && !formData.nombre_comercial) {
        setError('El nombre es requerido para personas naturales');
        setIsLoading(false);
        return;
      }

      const clienteData = {
        ...formData,
        dv: formData.dv || undefined,
        razon_social: formData.razon_social || undefined,
        regimen: formData.regimen || undefined,
        nombre_comercial: formData.nombre_comercial || undefined,
        ciudad: formData.ciudad || undefined,
        direccion: formData.direccion || undefined,
        telefono: formData.telefono || undefined,
        correo_electronico: formData.correo_electronico || undefined,
        comentarios: formData.comentarios || undefined
      };

      if (cliente) {
        // Actualizar cliente existente
        await actualizarCliente(cliente.id, clienteData);
        toast.success('Cliente actualizado exitosamente');
      } else {
        // Crear nuevo cliente
        await crearCliente(clienteData);
        toast.success('Cliente creado exitosamente');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el cliente';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
        theme === 'light' ? 'bg-white' : 'bg-gray-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        }`}>
          <h2 className={`text-xl font-semibold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Tipo de persona */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="es_juridica"
                  checked={formData.es_juridica}
                  onChange={handleChange}
                  className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                />
                <span className={`text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  ¿Es persona jurídica?
                </span>
              </label>
            </div>

            {/* Tipo de documento e Identificación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Tipo de documento *
                </label>
                <select
                  name="tipo_documento"
                  value={formData.tipo_documento}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                  required
                >
                  <option value="CC">CC - Cédula de Ciudadanía</option>
                  <option value="NIT">NIT - Número de Identificación Tributaria</option>
                  <option value="CE">CE - Cédula de Extranjería</option>
                  <option value="PAS">PAS - Pasaporte</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Identificación *
                </label>
                <input
                  type="text"
                  name="identificacion"
                  value={formData.identificacion}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                  required
                />
              </div>

              {formData.tipo_documento === 'NIT' && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    DV
                  </label>
                  <input
                    type="text"
                    name="dv"
                    value={formData.dv}
                    onChange={handleChange}
                    maxLength={1}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Razón Social (solo para jurídica) / Nombre (para natural) */}
            {formData.es_juridica ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    name="razon_social"
                    value={formData.razon_social}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Nombre Comercial
                  </label>
                  <input
                    type="text"
                    name="nombre_comercial"
                    value={formData.nombre_comercial}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="nombre_comercial"
                  value={formData.nombre_comercial}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                  required
                />
              </div>
            )}

            {/* Régimen (solo para jurídica) */}
            {formData.es_juridica && (
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Régimen
                </label>
                <select
                  name="regimen"
                  value={formData.regimen}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                >
                  <option value="Simplificado">Simplificado</option>
                  <option value="Común">Común</option>
                  <option value="Especial">Especial</option>
                </select>
              </div>
            )}

            {/* Dirección y Ciudad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Ciudad
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                />
              </div>
            </div>

            {/* Teléfono y Correo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="correo_electronico"
                  value={formData.correo_electronico}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                />
              </div>
            </div>

            {/* Comentarios */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Comentarios
              </label>
              <textarea
                name="comentarios"
                value={formData.comentarios}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-end space-x-3 p-6 border-t ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : cliente ? 'Actualizar' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
