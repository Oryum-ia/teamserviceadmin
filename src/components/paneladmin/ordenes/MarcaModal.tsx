"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { crearMarca } from '@/lib/services/marcaService';
import { useToast } from '@/contexts/ToastContext';

interface MarcaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (marcaCreada: any) => void;
  marcaEditar?: any;
}

export default function MarcaModal({ isOpen, onClose, onSuccess, marcaEditar }: MarcaModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    pais_origen: '',
    sitio_web: ''
  });

  // Reset form cuando se abre o cargar datos para editar
  useEffect(() => {
    if (isOpen) {
      if (marcaEditar) {
        setFormData({
          nombre: marcaEditar.nombre || '',
          descripcion: marcaEditar.descripcion || '',
          pais_origen: marcaEditar.pais_origen || '',
          sitio_web: marcaEditar.sitio_web || ''
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          pais_origen: '',
          sitio_web: ''
        });
      }
      setError('');
    }
  }, [isOpen, marcaEditar]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        setError('El nombre de la marca es requerido');
        setIsLoading(false);
        return;
      }

      if (marcaEditar) {
        // Modo edición
        const { actualizarMarca } = await import('@/lib/services/marcaService');
        const marcaActualizada = await actualizarMarca(marcaEditar.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          pais_origen: formData.pais_origen || undefined,
          sitio_web: formData.sitio_web || undefined
        });
        toast.success('Marca actualizada exitosamente');
        onSuccess(marcaActualizada);
      } else {
        // Modo creación
        const marcaCreada = await crearMarca({
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          pais_origen: formData.pais_origen || undefined,
          sitio_web: formData.sitio_web || undefined
        });
        toast.success('Marca creada exitosamente');
        onSuccess(marcaCreada);
      }
      onClose();
    } catch (err) {
      console.error('Error al guardar marca:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar la marca';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50">
      <div className={`relative w-full max-w-md rounded-lg shadow-xl overflow-hidden ${
        theme === 'light' ? 'bg-white' : 'bg-gray-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        }`}>
          <h2 className={`text-xl font-semibold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {marcaEditar ? 'Editar Marca' : 'Crear Nueva Marca'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Nombre de la Marca *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Kärcher, Bosch, Samsung"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
              required
              autoFocus
            />
          </div>

          {/* Descripción */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              placeholder="Descripción breve de la marca..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>

          {/* País de Origen */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              País de Origen
            </label>
            <input
              type="text"
              name="pais_origen"
              value={formData.pais_origen}
              onChange={handleChange}
              placeholder="Ej: Alemania, Estados Unidos, Japón"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>

          {/* Sitio Web */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Sitio Web
            </label>
            <input
              type="url"
              name="sitio_web"
              value={formData.sitio_web}
              onChange={handleChange}
              placeholder="https://www.ejemplo.com"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4">
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
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando...</span>
                </span>
              ) : (
                marcaEditar ? 'Actualizar Marca' : 'Crear Marca'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
