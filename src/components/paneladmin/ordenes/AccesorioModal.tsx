"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { crearAccesorio } from '@/lib/services/accesorioService';
import { useToast } from '@/contexts/ToastContext';

interface AccesorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accesorioCreado: any) => void;
  accesorioEditar?: any;
}

export default function AccesorioModal({ isOpen, onClose, onSuccess, accesorioEditar }: AccesorioModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    descripcion: '',
    marca: ''
  });

  // Reset form cuando se abre o cargar datos para editar
  useEffect(() => {
    if (isOpen) {
      if (accesorioEditar) {
        setFormData({
          descripcion: accesorioEditar.descripcion || '',
          marca: accesorioEditar.marca || ''
        });
      } else {
        setFormData({
          descripcion: '',
          marca: ''
        });
      }
      setError('');
    }
  }, [isOpen, accesorioEditar]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones
      if (!formData.descripcion.trim()) {
        setError('La descripción es requerida');
        setIsLoading(false);
        return;
      }

      if (accesorioEditar) {
        // Modo edición
        const { actualizarAccesorio } = await import('@/lib/services/accesorioService');
        const accesorioActualizado = await actualizarAccesorio(accesorioEditar.id, {
          descripcion: formData.descripcion,
          marca: formData.marca || undefined
        });
        toast.success('Accesorio actualizado exitosamente');
        onSuccess(accesorioActualizado);
      } else {
        // Modo creación
        const accesorioCreado = await crearAccesorio({
          descripcion: formData.descripcion,
          marca: formData.marca || undefined
        });
        toast.success('Accesorio creado exitosamente');
        onSuccess(accesorioCreado);
      }
      onClose();
    } catch (err) {
      console.error('Error al guardar accesorio:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el accesorio';
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
            {accesorioEditar ? 'Editar Accesorio' : 'Crear Nuevo Accesorio'}
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

          {/* Descripción */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Descripción *
            </label>
            <input
              type="text"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Ej: Manguera Alta Presión 15m"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
              required
            />
          </div>

          {/* Marca */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Marca
            </label>
            <input
              type="text"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              placeholder="Ej: Kärcher"
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
                accesorioEditar ? 'Actualizar Accesorio' : 'Crear Accesorio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
