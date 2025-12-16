'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OrdenesError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error('🚨 Error en Órdenes:', error);
    
    // Limpiar datos corruptos del localStorage
    try {
      localStorage.removeItem('orden_actual');
      console.log('🧹 Cache de orden limpiado');
    } catch (e) {
      // Ignore
    }
  }, [error]);

  const handleGoToList = () => {
    // Limpiar todo el caché de órdenes
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('orden_') || key.startsWith('repuestos_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('🧹 Cache de órdenes limpiado:', keysToRemove.length, 'items');
    } catch (e) {
      // Ignore
    }
    
    window.location.href = '/paneladmin?section=ordenes';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <svg 
              className="w-6 h-6 text-orange-600 dark:text-orange-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Error al cargar la orden
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No se pudo mostrar la información solicitada
            </p>
          </div>
        </div>

        {/* Error details (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Info box */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Sugerencia:</strong> Si el problema persiste después de reintentar, 
            regrese a la lista de órdenes. El caché local será limpiado automáticamente.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            Reintentar
          </button>
          
          <button
            onClick={handleGoToList}
            className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            Volver a órdenes
          </button>
        </div>
      </div>
    </div>
  );
}
