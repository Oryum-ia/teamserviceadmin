"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';

interface NotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordenId: string;
  notaInicial: string;
  onNotaGuardada: (nota: string) => void;
}

export default function NotaModal({ isOpen, onClose, ordenId, notaInicial, onNotaGuardada }: NotaModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [nota, setNota] = useState(notaInicial || '');
  const [isGuardando, setIsGuardando] = useState(false);

  useEffect(() => {
    setNota(notaInicial || '');
  }, [notaInicial]);

  const handleGuardar = async () => {
    setIsGuardando(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');

      const { error } = await supabase
        .from('ordenes')
        .update({
          nota_orden: nota,
          ultima_actualizacion: new Date().toISOString()
        })
        .eq('id', ordenId);

      if (error) throw error;

      toast.success('Nota guardada exitosamente');
      onNotaGuardada(nota);
      onClose();
    } catch (error) {
      console.error('Error al guardar nota:', error);
      toast.error('Error al guardar la nota');
    } finally {
      setIsGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`relative w-full max-w-2xl rounded-lg shadow-xl ${
        theme === 'light' ? 'bg-white' : 'bg-gray-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        }`}>
          <h2 className={`text-xl font-semibold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Nota de la Orden
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

        {/* Content */}
        <div className="p-6">
          <p className={`text-sm mb-3 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Esta nota es visible para todos los técnicos y administradores que trabajen en esta orden.
          </p>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Escriba una nota importante sobre esta orden..."
            rows={8}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none ${
              theme === 'light'
                ? 'border-gray-300 bg-white text-gray-900'
                : 'border-gray-600 bg-gray-700 text-gray-100'
            }`}
          />
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${
          theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        }`}>
          <button
            onClick={onClose}
            disabled={isGuardando}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={isGuardando}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isGuardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Nota
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
