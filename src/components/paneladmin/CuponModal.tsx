"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2, Ticket } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { Cupon } from '@/types/database.types';
import { crearCupon, actualizarCupon } from '@/lib/services/cuponService';

interface CuponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cupon: Cupon | null;
}

export default function CuponModal({ isOpen, onClose, onSuccess, cupon }: CuponModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Estados del formulario
  const [codigo, setCodigo] = useState('');
  const [porcentajeDescuento, setPorcentajeDescuento] = useState<number>(10);
  const [activo, setActivo] = useState(true);

  // Cargar datos del cupón si estamos editando
  useEffect(() => {
    if (cupon) {
      setCodigo(cupon.codigo);
      setPorcentajeDescuento(cupon.porcentaje_descuento);
      setActivo(cupon.activo);
    } else {
      // Resetear formulario para nuevo cupón
      setCodigo('');
      setPorcentajeDescuento(10);
      setActivo(true);
    }
  }, [cupon, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!codigo.trim()) {
      toast.error('El código del cupón es requerido');
      return;
    }

    if (porcentajeDescuento < 1 || porcentajeDescuento > 100) {
      toast.error('El porcentaje debe estar entre 1 y 100');
      return;
    }

    setIsLoading(true);

    try {
      const cuponData = {
        codigo: codigo.trim().toUpperCase(), // Convertir a mayúsculas
        porcentaje_descuento: porcentajeDescuento,
        usado: false, // Siempre false al crear/editar
        activo,
      };

      if (cupon) {
        // Actualizar cupón existente
        await actualizarCupon(cupon.id, cuponData);
        toast.success('Cupón actualizado exitosamente');
      } else {
        // Crear nuevo cupón
        await crearCupon(cuponData);
        toast.success('Cupón creado exitosamente');
      }

      // Esperar un momento antes de recargar para asegurar que la BD esté actualizada
      await new Promise(resolve => setTimeout(resolve, 300));
      onSuccess();
    } catch (err: any) {
      console.error('Error al guardar cupón:', err);
      
      // Manejar error de código duplicado
      if (err.code === '23505') {
        toast.error('Ya existe un cupón con ese código');
      } else {
        toast.error('Error al guardar el cupón');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`relative z-10 inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800'
        }`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  theme === 'light' ? 'bg-yellow-100' : 'bg-yellow-900/30'
                }`}>
                  <Ticket className={`w-6 h-6 ${
                    theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'
                  }`} />
                </div>
                <h3 className={`text-xl font-semibold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  {cupon ? 'Editar Cupón' : 'Nuevo Cupón'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'hover:bg-gray-100 text-gray-400'
                    : 'hover:bg-gray-700 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {/* Código del cupón */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Código del Cupón <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: DESCUENTO20"
                  maxLength={50}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                  disabled={isLoading}
                  required
                />
                <p className={`mt-1 text-xs ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Código único para identificar el cupón
                </p>
              </div>

              {/* Porcentaje de descuento */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Porcentaje de Descuento <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={porcentajeDescuento}
                    onChange={(e) => setPorcentajeDescuento(Number(e.target.value))}
                    min={1}
                    max={100}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                    disabled={isLoading}
                    required
                  />
                  <span className={`text-2xl font-bold ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    %
                  </span>
                </div>
                <input
                  type="range"
                  value={porcentajeDescuento}
                  onChange={(e) => setPorcentajeDescuento(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full mt-2"
                  disabled={isLoading}
                />
                <p className={`mt-1 text-xs ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Descuento entre 1% y 100%
                </p>
              </div>

              {/* Estado activo */}
              <div className="flex items-center justify-between">
                <div>
                  <label className={`block text-sm font-medium ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Estado del Cupón
                  </label>
                  <p className={`text-xs ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {activo ? 'El cupón está activo y puede ser usado' : 'El cupón está desactivado'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivo(!activo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    activo ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      activo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Información adicional si estamos editando */}
              {cupon && (
                <div className={`p-4 rounded-lg ${
                  theme === 'light' ? 'bg-gray-50' : 'bg-gray-700/50'
                }`}>
                  <h4 className={`text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Información del Cupón
                  </h4>
                  <div className="space-y-1 text-xs">
                    <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                      <span className="font-medium">Estado de uso:</span>{' '}
                      <span className={cupon.usado ? 'text-red-600' : 'text-green-600'}>
                        {cupon.usado ? 'Usado' : 'Disponible'}
                      </span>
                    </p>
                    {cupon.fecha_uso && (
                      <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                        <span className="font-medium">Fecha de uso:</span>{' '}
                        {new Date(cupon.fecha_uso).toLocaleString('es-CO')}
                      </p>
                    )}
                    <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                      <span className="font-medium">Creado:</span>{' '}
                      {new Date(cupon.created_at).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${
              theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-700 bg-gray-900/50'
            }`}>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  theme === 'light'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {cupon ? 'Actualizar' : 'Crear'} Cupón
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
