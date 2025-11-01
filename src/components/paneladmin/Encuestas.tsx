'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../ThemeProvider';
import { 
  FileText, 
  Search, 
  Eye, 
  Download, 
  Filter,
  X,
  Star,
  MapPin,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { Encuesta } from '../../types/encuestas-pqr.types';

export default function Encuestas() {
  const { theme } = useTheme();
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSede, setFiltroSede] = useState('');
  const [selectedEncuesta, setSelectedEncuesta] = useState<Encuesta | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sedes, setSedes] = useState<string[]>([]);

  useEffect(() => {
    cargarEncuestas();
  }, []);

  const cargarEncuestas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('encuestas')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      setEncuestas(data || []);
      
      // Extraer sedes únicas
      const sedesUnicas = [...new Set(data?.map(e => e.sede) || [])];
      setSedes(sedesUnicas);
    } catch (error) {
      console.error('Error cargando encuestas:', error);
    } finally {
      setLoading(false);
    }
  };

  const encuestasFiltradas = encuestas.filter(encuesta => {
    const matchSearch = 
      encuesta.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encuesta.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encuesta.sede.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchSede = !filtroSede || encuesta.sede === filtroSede;

    return matchSearch && matchSede;
  });

  const calcularPromedioGeneral = (encuesta: Encuesta) => {
    const suma = 
      encuesta.atencion_calificacion +
      encuesta.calidad_calificacion +
      encuesta.tiempo_calificacion +
      encuesta.productos_calificacion +
      encuesta.satisfaccion_general;
    return (suma / 5).toFixed(1);
  };

  const exportarCSV = () => {
    const headers = [
      'ID', 'Nombre', 'Email', 'Teléfono', 'Sede', 
      'Atención', 'Calidad', 'Tiempo', 'Productos', 
      'Satisfacción', 'NPS', 'Comentarios', 'Fecha'
    ];
    
    const rows = encuestasFiltradas.map(e => [
      e.id,
      e.nombre_completo,
      e.email,
      e.telefono || '',
      e.sede,
      e.atencion_calificacion,
      e.calidad_calificacion,
      e.tiempo_calificacion,
      e.productos_calificacion,
      e.satisfaccion_general,
      e.recomendacion_puntuacion,
      e.comentarios || '',
      new Date(e.fecha_creacion).toLocaleString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encuestas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const renderEstrellas = (valor: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i <= valor 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className={`ml-2 text-sm font-medium ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
        }`}>
          {valor}/5
        </span>
      </div>
    );
  };

  const hasActiveFilters = () => {
    return searchTerm || filtroSede;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFiltroSede('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Encuestas de Satisfacción
          </h1>
          <p className={`text-sm mt-1 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            {encuestasFiltradas.length} encuesta{encuestasFiltradas.length !== 1 ? 's' : ''} encontrada{encuestasFiltradas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              showFilters
                ? theme === 'light'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-400 text-black'
                : theme === 'light'
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {hasActiveFilters() && (
              <span className="ml-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                !
              </span>
            )}
          </button>
          <button
            onClick={exportarCSV}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros colapsables */}
      {showFilters && (
        <div className={`p-4 rounded-lg mb-6 border ${
          theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Filtros de Búsqueda
            </h3>
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === 'light' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o sede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                theme === 'light'
                  ? 'bg-white border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-white'
              }`}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                theme === 'light'
                  ? 'bg-white border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-white'
              }`}
            >
              <option value="">Todas las sedes</option>
              {sedes.map(sede => (
                <option key={sede} value={sede}>{sede}</option>
              ))}
            </select>
            {filtroSede && (
              <button
                onClick={() => setFiltroSede('')}
                className={`px-3 py-2 rounded-lg ${
                  theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className={`rounded-lg overflow-hidden ${
          theme === 'light' ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'
        }`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sede</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promedio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NPS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
              }`}>
                {encuestasFiltradas.map((encuesta) => (
                  <tr key={encuesta.id} className={
                    theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'
                  }>
                    <td className={`px-6 py-4 whitespace-nowrap ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      <div className="font-medium">{encuesta.nombre_completo}</div>
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}>{encuesta.email}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      {encuesta.sede}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderEstrellas(Number(calcularPromedioGeneral(encuesta)))}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        encuesta.recomendacion_puntuacion >= 9
                          ? 'bg-green-100 text-green-800'
                          : encuesta.recomendacion_puntuacion >= 7
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {encuesta.recomendacion_puntuacion}/10
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {new Date(encuesta.fecha_creacion).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedEncuesta(encuesta);
                          setShowModal(true);
                        }}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                          theme === 'light'
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {showModal && selectedEncuesta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-lg ${
            theme === 'light' ? 'bg-white' : 'bg-gray-800'
          }`}>
            <div className={`sticky top-0 flex justify-between items-center p-6 border-b ${
              theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
            }`}>
              <h2 className={`text-xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Detalle de Encuesta #{selectedEncuesta.id}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-lg ${
                  theme === 'light'
                    ? 'hover:bg-gray-100 text-gray-500'
                    : 'hover:bg-gray-700 text-gray-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información del cliente */}
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                      {selectedEncuesta.nombre_completo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                      {selectedEncuesta.email}
                    </span>
                  </div>
                  {selectedEncuesta.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                        {selectedEncuesta.telefono}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                      {selectedEncuesta.sede}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                      {new Date(selectedEncuesta.fecha_creacion).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Calificaciones */}
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Calificaciones
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className={`text-sm mb-1 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>Atención</p>
                    {renderEstrellas(selectedEncuesta.atencion_calificacion)}
                  </div>
                  <div>
                    <p className={`text-sm mb-1 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>Calidad</p>
                    {renderEstrellas(selectedEncuesta.calidad_calificacion)}
                  </div>
                  <div>
                    <p className={`text-sm mb-1 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>Tiempo</p>
                    {renderEstrellas(selectedEncuesta.tiempo_calificacion)}
                  </div>
                  <div>
                    <p className={`text-sm mb-1 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>Productos</p>
                    {renderEstrellas(selectedEncuesta.productos_calificacion)}
                  </div>
                  <div>
                    <p className={`text-sm mb-1 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>Satisfacción General</p>
                    {renderEstrellas(selectedEncuesta.satisfaccion_general)}
                  </div>
                  <div>
                    <p className={`text-sm mb-1 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>NPS (Net Promoter Score)</p>
                    <span className={`text-2xl font-bold ${
                      selectedEncuesta.recomendacion_puntuacion >= 9
                        ? 'text-green-600'
                        : selectedEncuesta.recomendacion_puntuacion >= 7
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {selectedEncuesta.recomendacion_puntuacion}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Comentarios */}
              {selectedEncuesta.comentarios && (
                <div>
                  <h3 className={`text-lg font-semibold mb-3 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    Comentarios
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'
                  }`}>
                    <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                      {selectedEncuesta.comentarios}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
