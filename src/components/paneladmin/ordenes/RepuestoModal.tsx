"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { crearRepuesto } from '@/lib/services/repuestoService';
import { useToast } from '@/contexts/ToastContext';

interface RepuestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (repuestoCreado: any) => void;
  repuestoEditar?: any;
}

export default function RepuestoModal({ isOpen, onClose, onSuccess, repuestoEditar }: RepuestoModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    cantidad: '1',
    causante: '',
    escrito: ''
  });

  // Reset form cuando se abre o cargar datos para editar
  useEffect(() => {
    if (isOpen) {
      if (repuestoEditar) {
        setFormData({
          codigo: repuestoEditar.codigo || '',
          descripcion: repuestoEditar.descripcion || '',
          cantidad: repuestoEditar.cantidad ? repuestoEditar.cantidad.toString() : '1',
          causante: repuestoEditar.causante || '',
          escrito: repuestoEditar.escrito || ''
        });
      } else {
        setFormData({
          codigo: '',
          descripcion: '',
          cantidad: '1',
          causante: '',
          escrito: ''
        });
      }
      setError('');
    }
  }, [isOpen, repuestoEditar]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (repuestoEditar) {
        // Modo edición
        const { actualizarRepuesto } = await import('@/lib/services/repuestoService');
        const repuestoActualizado = await actualizarRepuesto(repuestoEditar.id, {
          codigo: formData.codigo || undefined,
          descripcion: formData.descripcion || undefined,
          cantidad: formData.cantidad ? parseInt(formData.cantidad) : 1,
          causante: formData.causante || undefined,
          escrito: formData.escrito || undefined
        });
        toast.success('Repuesto actualizado exitosamente');
        onSuccess(repuestoActualizado);
      } else {
        // Modo creación
        const repuestoCreado = await crearRepuesto({
          codigo: formData.codigo || undefined,
          descripcion: formData.descripcion || undefined,
          cantidad: formData.cantidad ? parseInt(formData.cantidad) : 1,
          causante: formData.causante || undefined,
          escrito: formData.escrito || undefined
        });
        toast.success('Repuesto creado exitosamente');
        onSuccess(repuestoCreado);
      }
      onClose();
    } catch (err) {
      console.error('Error al guardar repuesto:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el repuesto';
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
            {repuestoEditar ? 'Editar Repuesto' : 'Crear Nuevo Repuesto'}
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

          {/* Grid: Código y Cantidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Código
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="Ej: REP-001"
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
                Cantidad
              </label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
            </div>
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
              placeholder="Descripción del repuesto..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>

          {/* Causante */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Causante
            </label>
            <input
              type="text"
              name="causante"
              value={formData.causante}
              onChange={handleChange}
              placeholder="Causa del requerimiento"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>

          {/* Escrito */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Escrito
            </label>
            <input
              type="text"
              name="escrito"
              value={formData.escrito}
              onChange={handleChange}
              placeholder="Notas adicionales"
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
                repuestoEditar ? 'Actualizar Repuesto' : 'Crear Repuesto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
