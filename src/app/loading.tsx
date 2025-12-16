export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner animado */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>
        
        {/* Texto de carga */}
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          Cargando...
        </p>
      </div>
    </div>
  );
}
