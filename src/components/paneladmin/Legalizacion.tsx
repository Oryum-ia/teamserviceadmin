import React, { useState } from 'react';
import { FileCheck, Search, Eye, Download, Calendar } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

const legalizacionData = [
  {
    id: '25-0125',
    fecha: '18 sept. 2024',
    cliente: 'Jonathan Estrada',
    equipo: 'Lavadora Automática "Max Compact"',
    maestro: 'Carlos Rodríguez',
    estado: 'Pendiente',
    tipo: 'Reparación',
    valor: '₡125.000',
    fechaLimite: '25 sept. 2024'
  },
  {
    id: '25-0124',
    fecha: '16 sept. 2024',
    cliente: 'Marginal Luz',
    equipo: 'Aspiradora Industrial',
    maestro: 'María González',
    estado: 'Legalizada',
    tipo: 'Mantenimiento',
    valor: '₡85.000',
    fechaLimite: '23 sept. 2024'
  },
  {
    id: '25-0123',
    fecha: '15 sept. 2024',
    cliente: 'Melitón Velazquez',
    equipo: 'Lavadora A1 "Max (10/800)"',
    maestro: 'José Méndez',
    estado: 'En Revisión',
    tipo: 'Garantía',
    valor: '₡0',
    fechaLimite: '22 sept. 2024'
  },
  {
    id: '25-0122',
    fecha: '14 sept. 2024',
    cliente: 'Confidenta Luis Marquez',
    equipo: 'Kärcher K1 "Max (10/800)"',
    maestro: 'Ana Vargas',
    estado: 'Legalizada',
    tipo: 'Reparación',
    valor: '₡200.000',
    fechaLimite: '21 sept. 2024'
  },
];

export default function Legalizacion() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('mes');

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className={`professional-heading text-xl ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>Legalización de Órdenes</h1>
          <p className={`professional-subtext text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>Proceso de validación y aprobación de trabajos realizados</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md professional-text text-sm flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exportar Reporte</span>
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md professional-text text-sm flex items-center space-x-2">
            <FileCheck className="w-4 h-4" />
            <span>Legalización Masiva</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={`border rounded-md px-3 py-2 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-white'
              }`}
            >
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
              <option value="trimestre">Este trimestre</option>
              <option value="año">Este año</option>
            </select>
          </div>
          
          <select className={`border rounded-md px-3 py-2 ${
            theme === 'light'
              ? 'border-gray-300 bg-white text-gray-900'
              : 'border-gray-600 bg-gray-700 text-white'
          }`}>
            <option>Todos los estados</option>
            <option>Pendiente</option>
            <option>En Revisión</option>
            <option>Legalizada</option>
          </select>
          
          <select className={`border rounded-md px-3 py-2 ${
            theme === 'light'
              ? 'border-gray-300 bg-white text-gray-900'
              : 'border-gray-600 bg-gray-700 text-white'
          }`}>
            <option>Todos los tipos</option>
            <option>Reparación</option>
            <option>Mantenimiento</option>
            <option>Garantía</option>
          </select>
        </div>

        <div className="flex-1 max-w-md relative ml-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-4 py-2 pl-10 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              theme === 'light'
                ? 'border-gray-300 bg-white text-gray-900'
                : 'border-gray-600 bg-gray-700 text-white'
            }`}
            placeholder="Buscar por orden, cliente, maestro..."
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className={`overflow-hidden shadow-sm rounded-lg border ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  theme === 'light'
                    ? 'bg-blue-100'
                    : 'bg-blue-900'
                }`}>
                  <FileCheck className={`h-5 w-5 ${
                    theme === 'light'
                      ? 'text-blue-600'
                      : 'text-blue-400'
                  }`} />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-medium truncate ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}>
                    Total Órdenes
                  </dt>
                  <dd className={`text-lg font-medium ${
                    theme === 'light'
                      ? 'text-gray-900'
                      : 'text-white'
                  }`}>
                    {legalizacionData.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className={`overflow-hidden shadow-sm rounded-lg border ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  theme === 'light'
                    ? 'bg-orange-100'
                    : 'bg-orange-900'
                }`}>
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-medium truncate ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}>
                    Pendientes
                  </dt>
                  <dd className={`text-lg font-medium ${
                    theme === 'light'
                      ? 'text-gray-900'
                      : 'text-white'
                  }`}>
                    {legalizacionData.filter(item => item.estado === 'Pendiente').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className={`overflow-hidden shadow-sm rounded-lg border ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  theme === 'light'
                    ? 'bg-green-100'
                    : 'bg-green-900'
                }`}>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-medium truncate ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}>
                    Legalizadas
                  </dt>
                  <dd className={`text-lg font-medium ${
                    theme === 'light'
                      ? 'text-gray-900'
                      : 'text-white'
                  }`}>
                    {legalizacionData.filter(item => item.estado === 'Legalizada').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className={`overflow-hidden shadow-sm rounded-lg border ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  theme === 'light'
                    ? 'bg-purple-100'
                    : 'bg-purple-900'
                }`}>
                  <span className={`${
                    theme === 'light'
                      ? 'text-purple-600'
                      : 'text-purple-400'
                  } text-sm font-medium`}>₡</span>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-medium truncate ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}>
                    Total Valor
                  </dt>
                  <dd className={`text-lg font-medium ${
                    theme === 'light'
                      ? 'text-gray-900'
                      : 'text-white'
                  }`}>
                    ₡410.000
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de legalización */}
      <div className={`shadow-sm rounded-lg border ${
        theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-gray-800 border-gray-700'
      }`}>
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${
              theme === 'light'
                ? 'divide-gray-200'
                : 'divide-gray-600'
            }`}>
              <thead className={`${
                theme === 'light'
                  ? 'bg-gray-50'
                  : 'bg-gray-700'
              }`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}>
                    Orden
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}>
                    Fecha
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}>
                    Cliente
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}>
                    Equipo
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}>
                    Maestro
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}>
                    Tipo
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}>
                    Valor
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}>
                    Estado
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                theme === 'light'
                  ? 'bg-white divide-gray-200'
                  : 'bg-gray-800 divide-gray-600'
              }`}>
                {legalizacionData.map((item, index) => (
                  <tr key={item.id} className={`transition-colors duration-150 ${
                    theme === 'light'
                      ? `hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`
                      : `hover:bg-gray-700 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900/50'}`
                  }`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        <span className={`font-medium ${
                          theme === 'light'
                            ? 'text-blue-600'
                            : 'text-blue-400'
                        }`}>{item.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-gray-100'
                      }`}>{item.fecha}</div>
                      <div className={`text-xs ${
                        theme === 'light'
                          ? 'text-gray-500'
                          : 'text-gray-400'
                      }`}>Límite: {item.fechaLimite}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm max-w-xs truncate ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-gray-100'
                      }`}>
                        {item.cliente}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm max-w-xs truncate ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-gray-100'
                      }`}>
                        {item.equipo}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-gray-100'
                      }`}>{item.maestro}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.tipo === 'Reparación' 
                          ? theme === 'light'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-blue-900 text-blue-200'
                          : item.tipo === 'Mantenimiento'
                          ? theme === 'light'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-purple-900 text-purple-200'
                          : theme === 'light'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-gray-900 text-gray-200'
                      }`}>
                        {item.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        theme === 'light'
                          ? 'text-gray-900'
                          : 'text-gray-100'
                      }`}>{item.valor}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.estado === 'Legalizada'
                          ? theme === 'light'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-green-900 text-green-200'
                          : item.estado === 'En Revisión'
                          ? theme === 'light'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-orange-900 text-orange-200'
                          : theme === 'light'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-red-900 text-red-200'
                      }`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className={`${
                          theme === 'light'
                            ? 'text-blue-600 hover:text-blue-900'
                            : 'text-blue-400 hover:text-blue-300'
                        }`}>
                          <Eye className="h-4 w-4" />
                        </button>
                        {item.estado !== 'Legalizada' && (
                          <button className={`${
                            theme === 'light'
                              ? 'text-green-600 hover:text-green-900'
                              : 'text-green-400 hover:text-green-300'
                          }`}>
                            <FileCheck className="h-4 w-4" />
                          </button>
                        )}
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