import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

interface AccesoriosProps {
  activeTab?: string;
}

const accesoriosData = [
  { 
    id: '001', 
    nombre: 'Manguera Alta Presión 15m',
    categoria: 'Mangueras',
    precio: '₡45.000',
    stock: 25,
    proveedor: 'Kärcher Costa Rica',
    estado: 'Disponible'
  },
  { 
    id: '002', 
    nombre: 'Boquilla Rotatoria 360°',
    categoria: 'Boquillas',
    precio: '₡18.500',
    stock: 12,
    proveedor: 'Hidromax SA',
    estado: 'Disponible'
  },
  { 
    id: '003', 
    nombre: 'Filtro de Aire HEPA',
    categoria: 'Filtros',
    precio: '₡32.000',
    stock: 8,
    proveedor: 'Repuestos Técnicos',
    estado: 'Agotado'
  },
  { 
    id: '004', 
    nombre: 'Cepillo Giratorio Premium',
    categoria: 'Cepillos',
    precio: '₡28.000',
    stock: 15,
    proveedor: 'Accesorios Pro',
    estado: 'Disponible'
  },
];

export default function Accesorios({ activeTab }: AccesoriosProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className={`professional-heading text-xl ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>Accesorios</h1>
          <p className={`professional-subtext text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>Gestión de accesorios y repuestos para equipos</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className={`px-4 py-2 rounded-md professional-text text-sm flex items-center space-x-2 transition-colors duration-200 ${
            theme === 'light'
              ? 'bg-mint-500 hover:bg-mint-600 text-white'
              : 'bg-lime-400 hover:bg-lime-500 text-black font-bold'
          }`}>
            <Plus className="w-4 h-4" />
            <span>Nuevo Accesorio</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex items-center space-x-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-4 py-2 pl-10 border rounded-md shadow-sm focus:ring-2 focus:border-transparent transition-colors duration-200 ${
              theme === 'light'
                ? 'border-gray-300 bg-white text-gray-900 focus:ring-mint-500 focus:border-mint-500'
                : 'border-lime-400/30 bg-dark-bg-secondary text-white focus:ring-lime-400 focus:border-lime-400'
            }`}
            placeholder="Buscar accesorio..."
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        <select className={`border rounded-md px-3 py-2 transition-colors duration-200 ${
          theme === 'light'
            ? 'border-gray-300 bg-white text-gray-900 focus:border-mint-500 focus:ring-1 focus:ring-mint-500'
            : 'border-lime-400/30 bg-dark-bg-secondary text-white focus:border-lime-400 focus:ring-1 focus:ring-lime-400'
        }`}>
          <option>Todas las categorías</option>
          <option>Mangueras</option>
          <option>Boquillas</option>
          <option>Filtros</option>
          <option>Cepillos</option>
        </select>
        
        <select className={`border rounded-md px-3 py-2 transition-colors duration-200 ${
          theme === 'light'
            ? 'border-gray-300 bg-white text-gray-900 focus:border-mint-500 focus:ring-1 focus:ring-mint-500'
            : 'border-lime-400/30 bg-dark-bg-secondary text-white focus:border-lime-400 focus:ring-1 focus:ring-lime-400'
        }`}>
          <option>Todos los estados</option>
          <option>Disponible</option>
          <option>Agotado</option>
          <option>Descontinuado</option>
        </select>
      </div>

      {/* Tabla de accesorios */}
      <div className={`shadow-sm rounded-lg border ${
        theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-dark-bg-secondary border-lime-400/20'
      }`}>
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${
              theme === 'light' ? 'divide-gray-200' : 'divide-gray-600'
            }`}>
              <thead className={`${
                theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'
              }`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                    Accesorio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                theme === 'light'
                  ? 'bg-white divide-gray-200'
                  : 'bg-gray-800 divide-gray-600'
              }`}>
                {accesoriosData.map((accesorio, index) => (
                  <tr key={accesorio.id} className={`transition-colors duration-150 ${
                    theme === 'light'
                      ? `hover:bg-gray-50 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`
                      : `hover:bg-gray-700 ${
                          index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900/50'
                        }`
                  }`}>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>{accesorio.nombre}</div>
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}>ID: {accesorio.id}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>{accesorio.categoria}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>{accesorio.precio}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        accesorio.stock > 10 
                          ? 'text-green-600 dark:text-green-400' 
                          : accesorio.stock > 0 
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {accesorio.stock} unidades
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>{accesorio.proveedor}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        accesorio.estado === 'Disponible'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {accesorio.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className={`${
                          theme === 'light'
                            ? 'text-blue-600 hover:text-blue-900'
                            : 'text-blue-400 hover:text-blue-300'
                        }`}>
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className={`${
                          theme === 'light'
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-red-400 hover:text-red-300'
                        }`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}