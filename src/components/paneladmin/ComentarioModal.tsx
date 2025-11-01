"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { crearComentario, actualizarComentario } from '@/lib/services/comentarioService';
import { useToast } from '@/contexts/ToastContext';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
}

interface Orden {
  id: string;
  numero_orden: string;
}

interface Comentario {
  id: string;
  orden_id: string;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  comentario: string;
  usuario_id: string;
  created_at: string;
  usuario?: Usuario;
  orden?: Orden;
}

interface ComentarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  comentario?: Comentario | null;
}

export default function ComentarioModal({ isOpen, onClose, onSuccess, comentario }: ComentarioModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    orden_id: '',
    estado_anterior: '',
    estado_nuevo: '',
    comentario: ''
  });

  // Cargar datos del comentario si estamos editando
  useEffect(() => {
    if (comentario) {
      setFormData({
        orden_id: comentario.orden_id,
        estado_anterior: comentario.estado_anterior || '',
        estado_nuevo: comentario.estado_nuevo || '',
        comentario: comentario.comentario
      });
    } else {
      // Reset form for new comentario
      setFormData({
        orden_id: '',
        estado_anterior: '',
        estado_nuevo: '',
        comentario: ''
      });
    }
    setError('');
  }, [comentario, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones básicas
      if (!formData.orden_id) {
        setError('El ID de la orden es requerido');
        setIsLoading(false);
        return;
      }

      if (!formData.comentario) {
        setError('El comentario es requerido');
        setIsLoading(false);
        return;
      }

      const comentarioData = {
        orden_id: formData.orden_id,
        estado_anterior: formData.estado_anterior || undefined,
        estado_nuevo: formData.estado_nuevo || undefined,
        comentario: formData.comentario
      };

      if (comentario) {
        // Actualizar comentario existente
        await actualizarComentario(comentario.id, comentarioData);
        toast.success('Comentario actualizado exitosamente');
      } else {
        // Crear nuevo comentario
        await crearComentario(comentarioData);
        toast.success('Comentario creado exitosamente');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar comentario:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el comentario';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className={`relative w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
        theme === 'light' ? 'bg-white' : 'bg-gray-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        }`}>
          <h2 className={`text-xl font-semibold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {comentario ? 'Ver Comentario' : 'Nuevo Comentario'}
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

            {/* Orden ID */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                ID de la Orden *
              </label>
              <input
                type="text"
                name="orden_id"
                value={formData.orden_id}
                onChange={handleChange}
                disabled={!!comentario}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                } ${comentario ? 'opacity-50 cursor-not-allowed' : ''}`}
                required
              />
              {comentario && (
                <p className={`text-xs mt-1 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Orden: {comentario.orden?.numero_orden || 'N/A'}
                </p>
              )}
            </div>

            {/* Estado Anterior */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Estado Anterior
              </label>
              <input
                type="text"
                name="estado_anterior"
                value={formData.estado_anterior}
                onChange={handleChange}
                disabled={!!comentario}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                } ${comentario ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            {/* Estado Nuevo */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Estado Nuevo
              </label>
              <input
                type="text"
                name="estado_nuevo"
                value={formData.estado_nuevo}
                onChange={handleChange}
                disabled={!!comentario}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                } ${comentario ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            {/* Comentario */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Comentario *
              </label>
              <textarea
                name="comentario"
                value={formData.comentario}
                onChange={handleChange}
                disabled={!!comentario}
                rows={5}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                } ${comentario ? 'opacity-50 cursor-not-allowed' : ''}`}
                required
              />
            </div>

            {/* Info del usuario que creó (solo si estamos editando) */}
            {comentario && comentario.usuario && (
              <div className={`p-3 rounded-lg ${
                theme === 'light' ? 'bg-gray-50' : 'bg-gray-900/50'
              }`}>
                <p className={`text-sm ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  <span className="font-medium">Creado por:</span> {comentario.usuario.nombre} ({comentario.usuario.email})
                </p>
                <p className={`text-xs mt-1 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {new Date(comentario.created_at).toLocaleString('es-CO')}
                </p>
              </div>
            )}
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
            {!comentario && (
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Crear Comentario'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
