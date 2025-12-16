export default function OrdenesLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        {/* Icono de orden */}
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-white animate-pulse" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        
        {/* Spinner */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-3 border-gray-200 dark:border-gray-700" />
          <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-3 border-transparent border-t-yellow-500 animate-spin" />
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cargando orden...
        </p>
      </div>
    </div>
  );
}
