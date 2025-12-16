export default function PanelAdminLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        {/* Logo shimmer effect */}
        <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
        
        {/* Spinner */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-transparent border-t-yellow-500 animate-spin" />
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cargando panel de administración...
        </p>
      </div>
    </div>
  );
}
