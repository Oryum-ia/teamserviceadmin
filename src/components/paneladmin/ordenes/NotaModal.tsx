"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabaseClient';
import { crearTimestampColombia } from '@/lib/utils/dateUtils';

interface NotaModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly ordenId: string;
  readonly notaInicial: string;
  readonly onNotaGuardada: (nota: string) => void;
}

// Result type para operaciones que pueden fallar
type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

// Timeout para operaciones de red (10 segundos)
const OPERATION_TIMEOUT_MS = 10000;

/**
 * Función pura para validar la nota
 */
const validateNota = (nota: string): Result<string, string> => {
  const trimmedNota = nota.trim();
  
  if (trimmedNota.length > 5000) {
    return { ok: false, error: 'La nota no puede exceder 5000 caracteres' };
  }
  
  return { ok: true, value: trimmedNota };
};

/**
 * Función para verificar la sesión del usuario
 */
const verificarSesion = async (): Promise<Result<boolean, string>> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return { ok: false, error: 'Error al verificar la sesión' };
    }
    
    if (!session) {
      return { ok: false, error: 'No hay sesión activa. Por favor, inicie sesión nuevamente.' };
    }
    
    return { ok: true, value: true };
  } catch (error) {
    return { ok: false, error: 'Error de conexión al verificar la sesión' };
  }
};

/**
 * Función para guardar la nota con timeout
 */
const guardarNotaConTimeout = async (
  ordenId: string,
  nota: string
): Promise<Result<void, string>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPERATION_TIMEOUT_MS);

  try {
    const { error } = await supabase
      .from('ordenes')
      .update({
        nota_orden: nota,
        ultima_actualizacion: crearTimestampColombia()
      })
      .eq('id', ordenId)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      // Mensajes de error específicos según el tipo
      if (error.code === 'PGRST116') {
        return { ok: false, error: 'No se encontró la orden especificada' };
      }
      if (error.code === '42501') {
        return { ok: false, error: 'No tiene permisos para modificar esta orden' };
      }
      if (error.message.includes('JWT')) {
        return { ok: false, error: 'Sesión expirada. Por favor, inicie sesión nuevamente.' };
      }
      
      return { ok: false, error: `Error de base de datos: ${error.message}` };
    }

    return { ok: true, value: undefined };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { ok: false, error: 'La operación tardó demasiado. Verifique su conexión a internet.' };
      }
      return { ok: false, error: `Error inesperado: ${error.message}` };
    }
    
    return { ok: false, error: 'Error desconocido al guardar la nota' };
  }
};

export default function NotaModal({ 
  isOpen, 
  onClose, 
  ordenId, 
  notaInicial, 
  onNotaGuardada 
}: NotaModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [nota, setNota] = useState(notaInicial || '');
  const [isGuardando, setIsGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  useEffect(() => {
    setNota(notaInicial || '');
    setErrorValidacion(null);
  }, [notaInicial, isOpen]);

  const handleNotaChange = (value: string) => {
    setNota(value);
    setErrorValidacion(null);
  };

  const handleGuardar = async () => {
    // Validar nota
    const validationResult = validateNota(nota);
    if (!validationResult.ok) {
      setErrorValidacion(validationResult.error);
      toast.error(validationResult.error);
      return;
    }

    setIsGuardando(true);
    setErrorValidacion(null);

    try {
      // 1. Verificar sesión
      const sessionResult = await verificarSesion();
      if (!sessionResult.ok) {
        toast.error(sessionResult.error);
        setErrorValidacion(sessionResult.error);
        return;
      }

      // 2. Guardar nota con timeout
      const saveResult = await guardarNotaConTimeout(ordenId, validationResult.value);
      
      if (!saveResult.ok) {
        toast.error(saveResult.error);
        setErrorValidacion(saveResult.error);
        return;
      }

      // 3. Éxito
      toast.success('Nota guardada exitosamente');
      onNotaGuardada(validationResult.value);
      onClose();
    } catch (error) {
      console.error('Error inesperado al guardar nota:', error);
      const errorMsg = 'Error inesperado. Por favor, intente nuevamente.';
      toast.error(errorMsg);
      setErrorValidacion(errorMsg);
    } finally {
      setIsGuardando(false);
    }
  };

  if (!isOpen) return null;

  const caracteresRestantes = 5000 - nota.length;
  const excedeLimite = caracteresRestantes < 0;

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
            disabled={isGuardando}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'hover:bg-gray-100 text-gray-500'
                : 'hover:bg-gray-700 text-gray-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
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
          
          {/* Error de validación */}
          {errorValidacion && (
            <div className={`flex items-start gap-2 p-3 mb-4 rounded-lg ${
              theme === 'light' 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-red-900/20 border border-red-800'
            }`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                theme === 'light' ? 'text-red-600' : 'text-red-400'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  theme === 'light' ? 'text-red-800' : 'text-red-300'
                }`}>
                  {errorValidacion}
                </p>
              </div>
            </div>
          )}

          <textarea
            value={nota}
            onChange={(e) => handleNotaChange(e.target.value)}
            placeholder="Escriba una nota importante sobre esta orden..."
            rows={8}
            disabled={isGuardando}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none transition-colors ${
              theme === 'light'
                ? 'border-gray-300 bg-white text-gray-900'
                : 'border-gray-600 bg-gray-700 text-gray-100'
            } ${excedeLimite ? 'border-red-500 focus:ring-red-500' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          
          {/* Contador de caracteres */}
          <div className={`flex items-center justify-between mt-2 text-xs ${
            excedeLimite 
              ? 'text-red-600' 
              : caracteresRestantes < 100 
                ? 'text-yellow-600' 
                : theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <span>
              {excedeLimite ? 'Excede el límite' : 'Caracteres disponibles'}
            </span>
            <span className="font-medium">
              {caracteresRestantes.toLocaleString()} / 5,000
            </span>
          </div>
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
            disabled={isGuardando || excedeLimite || nota.trim().length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={
              excedeLimite 
                ? 'Excede el límite de caracteres' 
                : nota.trim().length === 0 
                  ? 'La nota no puede estar vacía' 
                  : ''
            }
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
