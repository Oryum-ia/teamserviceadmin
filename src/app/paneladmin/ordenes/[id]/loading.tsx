export default function OrdenDetalleLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back button skeleton */}
            <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            
            {/* Title skeleton */}
            <div className="space-y-2">
              <div className="w-48 h-6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="w-32 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
          
          {/* Actions skeleton */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-8 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Phase stepper skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="w-16 h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div className="w-32 h-6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="w-full h-10 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info card skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div className="w-24 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="w-28 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Loading indicator */}
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 dark:bg-black/40 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl flex items-center gap-4">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-4 border-transparent border-t-yellow-500 animate-spin" />
          </div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Cargando orden...</span>
        </div>
      </div>
    </div>
  );
}
