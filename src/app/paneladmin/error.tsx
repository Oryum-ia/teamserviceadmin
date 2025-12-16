'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PanelAdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('🚨 Error en Panel Admin:', error);
  }, [error]);

  const handleGoBack = () => {
    // Limpiar localStorage corrupto si existe
    try {
      const ordenActual = localStorage.getItem('orden_actual');
      if (ordenActual) {
        localStorage.removeItem('orden_actual');
        console.log('🧹 Caché de orden limpiado');
      }
    } catch (e) {
      // Ignore
    }
    
    window.location.href = '/paneladmin';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        {/* Header con icono */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg 
              className="w-6 h-6 text-red-600 dark:text-red-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Error en el Panel
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ocurrió un problema al cargar esta sección
            </p>
          </div>
        </div>

        {/* Detalles del error (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detalles técnicos:
            </p>
            <code className="text-xs text-red-600 dark:text-red-400 break-all">
              {error.message}
            </code>
          </div>
        )}

        {/* Sugerencias */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
            Posibles soluciones:
          </p>
          <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
            <li>Intente recargar la página</li>
            <li>Verifique su conexión a internet</li>
            <li>Cierre sesión y vuelva a iniciar</li>
          </ul>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Intentar nuevamente
          </button>
          
          <button
            onClick={handleGoBack}
            className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
