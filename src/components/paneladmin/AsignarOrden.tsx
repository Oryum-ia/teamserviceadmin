import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';

interface Orden {
  id: string;
  fechaCreacion: string;
  estado: string;
  responsable: string;
  cliente: string;
  equipo: string;
  marca: string;
  tipo: string;
  prioridad: string;
}

interface AsignarOrdenProps {
  onBack?: () => void;
}

const AsignarOrden: React.FC<AsignarOrdenProps> = () => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof Orden>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const itemsPerPage = 10;

  // Columnas de la tabla
  const columns = [
    { key: 'id' as keyof Orden, label: 'Orden', sortable: true },
    { key: 'fechaCreacion' as keyof Orden, label: 'Fecha de creación', sortable: true },
    { key: 'estado' as keyof Orden, label: 'Estado', sortable: true },
    { key: 'responsable' as keyof Orden, label: 'Responsable', sortable: true },
    { key: 'cliente' as keyof Orden, label: 'Cliente', sortable: true },
    { key: 'equipo' as keyof Orden, label: 'Equipo', sortable: true },
    { key: 'marca' as keyof Orden, label: 'Marca', sortable: true },
    { key: 'tipo' as keyof Orden, label: 'Tipo', sortable: true },
    { key: 'prioridad' as keyof Orden, label: 'Prioridad', sortable: true }
  ];

  // Filtrar datos
  const filteredData = useMemo(() => {
    // Datos de ejemplo basados en la imagen
    const mockData: Orden[] = [
      {
        id: '25-0126',
        fechaCreacion: '17 sep. 2025 15:30 pm',
        estado: 'En diagnóstico',
        responsable: 'TEAM SERVICE COSTA',
        cliente: '(900855905) Delta Ingeniería',
        equipo: '[1-954-378.0] Karcher Karcher Compacto *MX (151272)',
        marca: 'Karcher',
        tipo: 'Garantía',
        prioridad: 'Normal'
      }
    ];
    
    return mockData.filter(item =>
      Object.values(item).some(value =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm]);

  // Ordenar datos
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const handleSort = (column: keyof Orden) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    console.log('Exportando datos...');
  };

  const getEstadoBadge = (estado: string) => {
    const badgeClasses = {
      'En diagnóstico': 'bg-blue-100 text-blue-800 border-blue-200',
      'En reparación': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Listo': 'bg-green-100 text-green-800 border-green-200',
      'Por cobrar': 'bg-amber-100 text-amber-800 border-amber-200',
    };
    
    return badgeClasses[estado as keyof typeof badgeClasses] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPrioridadBadge = (prioridad: string) => {
    const badgeClasses = {
      'Normal': 'bg-gray-100 text-gray-800 border-gray-200',
      'Urgente': 'bg-red-100 text-red-800 border-red-200',
      'Alta': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    
    return badgeClasses[prioridad as keyof typeof badgeClasses] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className={`h-full flex flex-col ${
      theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'
    }`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 ${
        theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-gray-800 border-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          {/* Búsqueda */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                }`}
              />
            </div>
          </div>

          {/* Botón Exportar */}
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Tabla */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-200'
                  : 'bg-gray-800 border-gray-700'
              }`}>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-6 py-3 text-left">
                      <div className="flex items-center space-x-1">
                        <span className={`text-xs font-medium uppercase tracking-wider ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          {column.label}
                        </span>
                        {column.sortable && (
                          <button
                            onClick={() => handleSort(column.key)}
                            className={`${
                              theme === 'light'
                                ? 'text-gray-400 hover:text-gray-600'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                          >
                            <ChevronsUpDown className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${
                theme === 'light'
                  ? 'bg-white divide-gray-200'
                  : 'bg-gray-800 divide-gray-700'
              }`}>
                {currentData.map((item) => (
                  <tr key={item.id} className={`transition-colors ${
                    theme === 'light'
                      ? 'hover:bg-gray-50'
                      : 'hover:bg-gray-700'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {item.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {item.fechaCreacion}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoBadge(item.estado)}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {item.responsable}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {item.cliente}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm max-w-xs truncate ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`} title={item.equipo}>
                        {item.equipo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {item.marca}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {item.tipo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPrioridadBadge(item.prioridad)}`}>
                        {item.prioridad}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className={`border-t px-6 py-3 ${
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-gray-800 border-gray-700'
          }`}>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'light'
                    ? 'text-gray-400 hover:text-gray-600'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'light'
                    ? 'text-gray-400 hover:text-gray-600'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  {currentPage}
                </span>
              </div>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'light'
                    ? 'text-gray-400 hover:text-gray-600'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'light'
                    ? 'text-gray-400 hover:text-gray-600'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsignarOrden;