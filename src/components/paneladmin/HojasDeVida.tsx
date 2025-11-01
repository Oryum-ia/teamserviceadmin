import React, { useState } from 'react';
import { Plus, Search, Edit, Eye, User } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

const maestrosData = [
  { 
    id: '001', 
    nombre: 'Carlos Rodríguez', 
    especialidad: 'Mecánica General',
    experiencia: '8 años',
    telefono: '+506 8888-1234',
    email: 'carlos@teamservice.com',
    estado: 'Activo',
    fechaIngreso: '15/03/2018'
  },
  { 
    id: '002', 
    nombre: 'María González', 
    especialidad: 'Sistemas Hidráulicos',
    experiencia: '12 años',
    telefono: '+506 8888-5678',
    email: 'maria@teamservice.com',
    estado: 'Activo',
    fechaIngreso: '22/08/2015'
  },
  { 
    id: '003', 
    nombre: 'José Méndez', 
    especialidad: 'Electrodomésticos',
    experiencia: '6 años',
    telefono: '+506 8888-9012',
    email: 'jose@teamservice.com',
    estado: 'Inactivo',
    fechaIngreso: '10/11/2020'
  },
  { 
    id: '004', 
    nombre: 'Ana Vargas', 
    especialidad: 'Equipos Industriales',
    experiencia: '15 años',
    telefono: '+506 8888-3456',
    email: 'ana@teamservice.com',
    estado: 'Activo',
    fechaIngreso: '05/01/2012'
  },
];

export default function HojasDeVida() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className={`professional-heading text-xl ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>Hojas de Vida - Maestros</h1>
          <p className={`professional-subtext text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>Gestión de perfiles y expedientes del personal técnico</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className={`px-4 py-2 rounded-md professional-text text-sm flex items-center space-x-2 transition-colors duration-200 ${
            theme === 'light'
              ? 'bg-mint-600 hover:bg-mint-700 text-white'
              : 'bg-lime-400 hover:bg-lime-500 text-black font-semibold'
          }`}>
            <Plus className="w-4 h-4" />
            <span>Nuevo Maestro</span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
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
            placeholder="Buscar maestro por nombre, especialidad..."
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        <select className={`border rounded-md px-3 py-2 ${
          theme === 'light'
            ? 'border-gray-300 bg-white text-gray-900'
            : 'border-gray-600 bg-gray-700 text-white'
        }`}>
          <option>Todos los estados</option>
          <option>Activo</option>
          <option>Inactivo</option>
        </select>
        
        <select className={`border rounded-md px-3 py-2 ${
          theme === 'light'
            ? 'border-gray-300 bg-white text-gray-900'
            : 'border-gray-600 bg-gray-700 text-white'
        }`}>
          <option>Todas las especialidades</option>
          <option>Mecánica General</option>
          <option>Sistemas Hidráulicos</option>
          <option>Electrodomésticos</option>
          <option>Equipos Industriales</option>
        </select>
      </div>

      {/* Tabla de maestros */}
      <div className={`shadow-sm rounded-lg border ${
        theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-gray-800 border-gray-700'
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
                    Maestro
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                    Especialidad
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                    Experiencia
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                    Contacto
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                    Fecha Ingreso
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-300'
                  }`}>
                    Estado
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-300'
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
                {maestrosData.map((maestro, index) => (
                  <tr key={maestro.id} className={`transition-colors duration-150 ${
                    theme === 'light'
                      ? `hover:bg-gray-50 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`
                      : `hover:bg-gray-700 ${
                          index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900/50'
                        }`
                  }`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            theme === 'light' ? 'bg-slate-200' : 'bg-slate-700'
                          }`}>
                            <User className={`h-6 w-6 ${
                              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                            }`} />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className={`text-sm font-medium ${
                            theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                          }`}>{maestro.nombre}</div>
                          <div className={`text-sm ${
                            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                          }`}>ID: {maestro.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>{maestro.especialidad}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>{maestro.experiencia}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>{maestro.telefono}</div>
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}>{maestro.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>{maestro.fechaIngreso}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        maestro.estado === 'Activo'
                          ? (theme === 'light' ? 'bg-green-100 text-green-800' : 'bg-green-900 text-green-200')
                          : (theme === 'light' ? 'bg-red-100 text-red-800' : 'bg-red-900 text-red-200')
                      }`}>
                        {maestro.estado}
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
                        <button className={`${
                          theme === 'light'
                            ? 'text-amber-600 hover:text-amber-900'
                            : 'text-amber-400 hover:text-amber-300'
                        }`}>
                          <Edit className="h-4 w-4" />
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

      {/* Estadísticas rápidas */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className={`overflow-hidden shadow-sm rounded-lg border ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-medium truncate ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Total Maestros
                  </dt>
                  <dd className={`text-lg font-medium ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {maestrosData.length}
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
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  theme === 'light' ? 'bg-green-100' : 'bg-green-900'
                }`}>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-medium truncate ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Activos
                  </dt>
                  <dd className={`text-lg font-medium ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {maestrosData.filter(m => m.estado === 'Activo').length}
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
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  theme === 'light' ? 'bg-red-100' : 'bg-red-900'
                }`}>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-medium truncate ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Inactivos
                  </dt>
                  <dd className={`text-lg font-medium ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {maestrosData.filter(m => m.estado === 'Inactivo').length}
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
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  theme === 'light' ? 'bg-blue-100' : 'bg-blue-900'
                }`}>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-medium truncate ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Especialidades
                  </dt>
                  <dd className={`text-lg font-medium ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {[...new Set(maestrosData.map(m => m.especialidad))].length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}