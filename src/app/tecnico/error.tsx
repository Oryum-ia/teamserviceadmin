'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TecnicoError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('🚨 Error en Panel Técnico:', error);
  }, [error]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('userSession');
      localStorage.removeItem('teamservice_user');
    } catch (e) {
      // Ignore
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        {/* Icono */}
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <svg 
            className="w-8 h-8 text-red-600 dark:text-red-400" 
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

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Error en el Panel de Técnico
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ha ocurrido un error al cargar el panel. Por favor, intente nuevamente.
        </p>

        {/* Error details (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
              Ver detalles
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-red-600 dark:text-red-400 overflow-x-auto">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Reintentar
          </button>
          
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
