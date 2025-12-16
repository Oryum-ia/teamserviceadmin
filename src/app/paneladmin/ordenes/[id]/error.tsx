'use client';

import { useEffect, useState } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OrdenDetalleError({ error, reset }: ErrorProps) {
  const [ordenId, setOrdenId] = useState<string | null>(null);

  useEffect(() => {
    console.error('🚨 Error en detalle de orden:', error);
    
    // Intentar extraer el ID de la URL
    try {
      const pathParts = window.location.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      if (id && !isNaN(Number(id))) {
        setOrdenId(id);
      }
    } catch {
      // Ignore
    }

    // Limpiar caché corrupto de la orden
    try {
      window.localStorage.removeItem('orden_activa');
      window.localStorage.removeItem('orden_timestamp');
      
      // Limpiar repuestos
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('repuestos_')) {
          window.localStorage.removeItem(key);
        }
      }
      console.log('🧹 Caché de orden limpiado');
    } catch {
      // Ignore
    }
  }, [error]);

  const handleGoToOrders = () => {
    window.location.href = '/paneladmin?section=ordenes';
  };

  const handleRetry = () => {
    // Limpiar todo el caché primero
    try {
      window.localStorage.removeItem('orden_activa');
    } catch {
      // Ignore
    }
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header con color */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20">
              <svg 
                className="w-6 h-6 text-white" 
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
              <h2 className="text-lg font-semibold text-white">
                Error al cargar la orden
              </h2>
              {ordenId && (
                <p className="text-white/80 text-sm">
                  Orden #{ordenId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No fue posible cargar los detalles de esta orden. Esto puede deberse a:
          </p>
          
          <ul className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Problemas de conexión con el servidor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>La orden puede haber sido eliminada o modificada</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Datos locales desincronizados (ya corregido)</span>
            </li>
          </ul>

          {/* Error details (dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6">
              <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Ver detalles técnicos
              </summary>
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <code className="text-xs text-red-600 dark:text-red-400 break-all">
                  {error.message}
                </code>
              </div>
            </details>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reintentar
            </button>
            
            <button
              onClick={handleGoToOrders}
              className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Volver a órdenes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
