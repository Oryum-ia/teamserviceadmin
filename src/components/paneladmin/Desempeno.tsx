"use client";

import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown, Award, AlertCircle, Calendar, Users, Loader2 } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { obtenerDesempenoDetallado, obtenerResumenEquipo, DesempenoTecnico } from '@/lib/services/desempenoService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Desempeno() {
  const { theme } = useTheme();
  const toast = useToast();

  const [tecnicos, setTecnicos] = useState<DesempenoTecnico[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [vistaActual, setVistaActual] = useState<'general' | 'tecnicos'>('general');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async (inicio?: string, fin?: string) => {
    setIsLoading(true);
    try {
      const [dataTecnicos, dataResumen] = await Promise.all([
        obtenerDesempenoDetallado(inicio, fin),
        obtenerResumenEquipo(inicio, fin)
      ]);
      
      setTecnicos(dataTecnicos);
      setResumen(dataResumen);
    } catch (err) {
      console.error('Error al cargar desempeño:', err);
      toast.error('Error al cargar datos de desempeño');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    cargarDatos(fechaInicio || undefined, fechaFin || undefined);
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    cargarDatos();
  };

  const formatearHoras = (horas?: number) => {
    if (!horas) return 'N/A';
    if (horas < 24) return `${Math.round(horas)}h`;
    const dias = Math.floor(horas / 24);
    const horasRestantes = Math.round(horas % 24);
    return `${dias}d ${horasRestantes}h`;
  };

  const obtenerColorEficiencia = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  // Preparar datos para gráficas
  const dataTiemposPromedio = tecnicos.map(t => ({
    nombre: t.tecnico_nombre.split(' ')[0], // Solo primer nombre
    cotizacion: t.tiempo_promedio_cotizacion ? Math.round(t.tiempo_promedio_cotizacion) : 0,
    reparacion: t.tiempo_promedio_reparacion ? Math.round(t.tiempo_promedio_reparacion) : 0
  }));

  const dataEficiencia = tecnicos.map(t => ({
    nombre: t.tecnico_nombre.split(' ')[0],
    eficiencia: t.eficiencia_score,
    completadas: t.ordenes_completadas
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Desempeño de Técnicos
        </h1>
        <p className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Análisis de tiempos y eficiencia en las fases de cotización y reparación
        </p>
      </div>

      {/* Filtros */}
      <div className={`p-4 rounded-lg border ${
        theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
      }`}>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>

          <div className="flex-1">
            <label className={`block text-sm font-medium mb-1 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={aplicarFiltros}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black'
              }`}
            >
              Aplicar
            </button>
            <button
              onClick={limpiarFiltros}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-300 dark:border-gray-700">
        <button
          onClick={() => setVistaActual('general')}
          className={`px-4 py-2 font-medium transition-colors ${
            vistaActual === 'general'
              ? theme === 'light'
                ? 'border-b-2 border-yellow-500 text-yellow-600'
                : 'border-b-2 border-yellow-400 text-yellow-400'
              : theme === 'light'
                ? 'text-gray-600 hover:text-gray-900'
                : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Vista General
        </button>
        <button
          onClick={() => setVistaActual('tecnicos')}
          className={`px-4 py-2 font-medium transition-colors ${
            vistaActual === 'tecnicos'
              ? theme === 'light'
                ? 'border-b-2 border-yellow-500 text-yellow-600'
                : 'border-b-2 border-yellow-400 text-yellow-400'
              : theme === 'light'
                ? 'text-gray-600 hover:text-gray-900'
                : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Por Técnico
        </button>
      </div>

      {vistaActual === 'general' && resumen && (
        <>
          {/* Resumen del Equipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border ${
              theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Técnicos Activos
                  </p>
                  <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {resumen.total_tecnicos}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Tasa de Completación
                  </p>
                  <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {Math.round(resumen.tasa_completacion)}%
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Tiempo Prom. Cotización
                  </p>
                  <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {formatearHoras(resumen.promedio_cotizacion_horas)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Tiempo Prom. Reparación
                  </p>
                  <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {formatearHoras(resumen.promedio_reparacion_horas)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica de Tiempos Promedio */}
            <div className={`p-4 rounded-lg border ${
              theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Tiempos Promedio por Técnico (horas)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataTiemposPromedio}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e5e7eb' : '#374151'} />
                  <XAxis 
                    dataKey="nombre" 
                    stroke={theme === 'light' ? '#6b7280' : '#9ca3af'}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke={theme === 'light' ? '#6b7280' : '#9ca3af'}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
                      border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                      borderRadius: '8px',
                      color: theme === 'light' ? '#111827' : '#f9fafb'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="cotizacion" fill="#eab308" name="Cotización" />
                  <Bar dataKey="reparacion" fill="#8b5cf6" name="Reparación" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Eficiencia */}
            <div className={`p-4 rounded-lg border ${
              theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Score de Eficiencia por Técnico
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dataEficiencia}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e5e7eb' : '#374151'} />
                  <XAxis 
                    dataKey="nombre" 
                    stroke={theme === 'light' ? '#6b7280' : '#9ca3af'}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke={theme === 'light' ? '#6b7280' : '#9ca3af'}
                    style={{ fontSize: '12px' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
                      border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                      borderRadius: '8px',
                      color: theme === 'light' ? '#111827' : '#f9fafb'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="eficiencia" stroke="#10b981" name="Eficiencia %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {vistaActual === 'tecnicos' && (
        <>
          {/* Lista de Técnicos */}
          <div className="space-y-4">
            {tecnicos.map((tecnico) => (
              <div
                key={tecnico.tecnico_id}
                className={`p-4 rounded-lg border ${
                  theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Info del técnico */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {tecnico.tecnico_nombre}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        obtenerColorEficiencia(tecnico.eficiencia_score)
                      }`}>
                        {tecnico.eficiencia_score}% Eficiencia
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Total Órdenes
                        </p>
                        <p className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                          {tecnico.total_ordenes}
                        </p>
                      </div>

                      <div>
                        <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Completadas
                        </p>
                        <p className={`text-xl font-bold text-green-600`}>
                          {tecnico.ordenes_completadas}
                        </p>
                      </div>

                      <div>
                        <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                          En Proceso
                        </p>
                        <p className={`text-xl font-bold text-yellow-600`}>
                          {tecnico.ordenes_en_proceso}
                        </p>
                      </div>

                      <div>
                        <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                          Tasa Completación
                        </p>
                        <p className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                          {tecnico.total_ordenes > 0 
                            ? Math.round((tecnico.ordenes_completadas / tecnico.total_ordenes) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tiempos promedio */}
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-lg border ${
                      theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900/20 border-yellow-800'
                    }`}>
                      <p className={`text-xs mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        Cotización
                      </p>
                      <p className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {formatearHoras(tecnico.tiempo_promedio_cotizacion)}
                      </p>
                    </div>

                    <div className={`p-3 rounded-lg border ${
                      theme === 'light' ? 'bg-purple-50 border-purple-200' : 'bg-purple-900/20 border-purple-800'
                    }`}>
                      <p className={`text-xs mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        Reparación
                      </p>
                      <p className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {formatearHoras(tecnico.tiempo_promedio_reparacion)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tecnicos.length === 0 && (
            <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
              theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-800'
            }`}>
              <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${
                theme === 'light' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
                No hay datos de desempeño disponibles
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
