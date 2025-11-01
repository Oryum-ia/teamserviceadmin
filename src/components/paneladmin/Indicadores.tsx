"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { obtenerEstadisticasGlobales } from '@/lib/services/estadisticasService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

export default function Indicadores() {
  const { theme } = useTheme();
  const toast = useToast();

  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'dia' | 'semana' | 'mes'>('mes');

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerEstadisticasGlobales();
      setEstadisticas(data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      toast.error('Error al cargar indicadores');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="p-6">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-center text-gray-600 dark:text-gray-400">
          No se pudieron cargar las estadísticas
        </p>
      </div>
    );
  }

  // Preparar datos para gráficas
  const dataPorEstado = Object.entries(estadisticas.ordenes_por_estado || {}).map(([estado, cantidad]) => ({
    name: estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' '),
    value: cantidad as number
  }));

  const dataPorFase = Object.entries(estadisticas.ordenes_por_fase || {}).map(([fase, cantidad]) => ({
    name: fase.charAt(0).toUpperCase() + fase.slice(1),
    cantidad: cantidad as number
  }));

  const COLORS = ['#3b82f6', '#eab308', '#f59e0b', '#10b981', '#ef4444'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-CO').format(value);
  };

  const obtenerOrdenesPeriodo = () => {
    switch (periodoSeleccionado) {
      case 'dia':
        return estadisticas.ordenes_dia || 0;
      case 'semana':
        return estadisticas.ordenes_semana || 0;
      case 'mes':
        return estadisticas.ordenes_mes || 0;
      default:
        return 0;
    }
  };

  const calcularTasaCompletacion = () => {
    const total = estadisticas.total_ordenes || 1;
    const completadas = estadisticas.ordenes_por_estado?.completada || 0;
    return Math.round((completadas / total) * 100);
  };

  const calcularTasaPendientes = () => {
    const total = estadisticas.total_ordenes || 1;
    const pendientes = (estadisticas.ordenes_por_estado?.pendiente || 0) + 
                       (estadisticas.ordenes_por_estado?.en_proceso || 0);
    return Math.round((pendientes / total) * 100);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Indicadores del Sistema
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Métricas y KPIs generales del negocio
          </p>
        </div>

        {/* Selector de período */}
        <div className="flex gap-2">
          {(['dia', 'semana', 'mes'] as const).map((periodo) => (
            <button
              key={periodo}
              onClick={() => setPeriodoSeleccionado(periodo)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                periodoSeleccionado === periodo
                  ? theme === 'light'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-400 text-black'
                  : theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Órdenes */}
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                Total Órdenes
              </p>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {formatNumber(estadisticas.total_ordenes)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {formatNumber(obtenerOrdenesPeriodo())} en {periodoSeleccionado}
              </p>
            </div>
          </div>
        </div>

        {/* Órdenes Completadas */}
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                Completadas
              </p>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {formatNumber(estadisticas.ordenes_por_estado?.completada || 0)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <p className="text-xs text-green-600 dark:text-green-400">
                  {calcularTasaCompletacion()}% tasa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ingresos Totales */}
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                Ingresos Totales
              </p>
              <p className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {formatCurrency(estadisticas.ingresos_totales)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Mes: {formatCurrency(estadisticas.ingresos_mes_actual)}
              </p>
            </div>
          </div>
        </div>

        {/* Órdenes Pendientes */}
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                En Proceso
              </p>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {formatNumber((estadisticas.ordenes_por_estado?.pendiente || 0) + 
                 (estadisticas.ordenes_por_estado?.en_proceso || 0))}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {calcularTasaPendientes()}% del total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Estado */}
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Distribución por Estado
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dataPorEstado}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dataPorEstado.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '8px',
                  color: theme === 'light' ? '#111827' : '#f9fafb'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Órdenes por Fase */}
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Órdenes por Fase del Proceso
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataPorFase}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e5e7eb' : '#374151'} />
              <XAxis 
                dataKey="name" 
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
              <Bar dataKey="cantidad" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Métricas Adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' : 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>
                Promedio por Día
              </p>
              <p className={`text-3xl font-bold mt-1 ${theme === 'light' ? 'text-blue-900' : 'text-blue-100'}`}>
                {formatNumber(Math.round((estadisticas.ordenes_mes || 0) / 30))}
              </p>
            </div>
            <Calendar className={`w-8 h-8 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' : 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${theme === 'light' ? 'text-green-700' : 'text-green-300'}`}>
                Ingreso Promedio
              </p>
              <p className={`text-2xl font-bold mt-1 ${theme === 'light' ? 'text-green-900' : 'text-green-100'}`}>
                {formatCurrency(
                  estadisticas.total_ordenes > 0 
                    ? estadisticas.ingresos_totales / estadisticas.total_ordenes 
                    : 0
                )}
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200' : 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${theme === 'light' ? 'text-purple-700' : 'text-purple-300'}`}>
                Tasa de Éxito
              </p>
              <p className={`text-3xl font-bold mt-1 ${theme === 'light' ? 'text-purple-900' : 'text-purple-100'}`}>
                {calcularTasaCompletacion()}%
              </p>
            </div>
            <BarChart3 className={`w-8 h-8 ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`} />
          </div>
        </div>
      </div>

      {/* Alertas y Notas */}
      <div className={`p-4 rounded-lg border ${
        theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900/20 border-yellow-800'
      }`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`w-5 h-5 mt-0.5 ${theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'}`} />
          <div>
            <h4 className={`font-semibold ${theme === 'light' ? 'text-yellow-900' : 'text-yellow-200'}`}>
              Órdenes Esperando Repuestos
            </h4>
            <p className={`text-sm mt-1 ${theme === 'light' ? 'text-yellow-800' : 'text-yellow-300'}`}>
              Hay {estadisticas.ordenes_por_estado?.espera_repuestos || 0} órdenes esperando repuestos. 
              Revisar inventario y procesos de compra.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
