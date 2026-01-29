"use client";

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Calculator,
  Settings,
  CheckCircle,
  TrendingUp,
  Users,
  Loader2,
  AlertCircle,
  Clock,
  Package,
  Wrench,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Activity,
  Calendar
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { obtenerEstadisticasDashboard } from '@/lib/services/estadisticasService';
import { EstadisticasGlobales } from '@/types/database.types';
import { useRouter } from 'next/navigation';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: { value: number; trend: 'up' | 'down' };
  theme: string;
  gradient: string;
  onClick?: () => void;
}

function StatCard({ title, value, icon: Icon, change, theme, gradient, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl shadow-lg border transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-2xl hover:scale-105' : ''
      } ${
        theme === 'light'
          ? 'bg-white border-gray-100'
          : 'bg-gray-800 border-gray-700'
      }`}
    >
      <div className={`absolute inset-0 opacity-5 ${gradient}`} />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${gradient}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {change && (
            <div className={`flex items-center space-x-1 text-sm font-medium ${
              change.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span>{Math.abs(change.value)}%</span>
            </div>
          )}
        </div>
        <h3 className={`text-sm font-medium mb-1 ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {title}
        </h3>
        <p className={`text-3xl font-bold ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          {value}
        </p>
      </div>
    </div>
  );
}

interface DashboardProps {
  onSectionChange?: (section: string, fase?: string, estado?: string) => void;
}

export default function DashboardNuevo({ onSectionChange }: DashboardProps = {}) {
  const { theme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState<EstadisticasGlobales | null>(null);
  const [ordenesRecientes, setOrdenesRecientes] = useState<any[]>([]);
  const [statsClientes, setStatsClientes] = useState({ total: 0, nuevos_mes: 0 });
  const [statsEquipos, setStatsEquipos] = useState({ total: 0, mantenimiento_pendiente: 0 });
  const [statsTecnicos, setStatsTecnicos] = useState({ total: 0, activos: 0 });
  
  // Filtros
  const [sedeSeleccionada, setSedeSeleccionada] = useState<string>('todas');
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('');
  const [sedes, setSedes] = useState<string[]>([]);

  useEffect(() => {
    cargarSedes();
    cargarEstadisticas();
  }, [sedeSeleccionada, mesSeleccionado]);

  const cargarSedes = async () => {
    try {
      const { obtenerSedes } = await import('@/lib/services/estadisticasService');
      const sedesData = await obtenerSedes();
      setSedes(sedesData);
    } catch (err) {
      console.error('Error al cargar sedes:', err);
    }
  };

  const cargarEstadisticas = async () => {
    setIsLoading(true);
    setError('');
    try {
      const filtros: any = {};
      
      if (sedeSeleccionada && sedeSeleccionada !== 'todas') {
        filtros.sede = sedeSeleccionada;
      }
      
      if (mesSeleccionado) {
        filtros.mes = mesSeleccionado;
      }
      
      const data = await obtenerEstadisticasDashboard(filtros);
      setEstadisticas(data.estadisticas);
      setOrdenesRecientes(data.ordenes_recientes);
      
      // Cargar estadísticas adicionales
      await Promise.all([
        cargarStatsClientes(),
        cargarStatsEquipos(),
        cargarStatsTecnicos()
      ]);
      
      console.log('✅ Estadísticas cargadas:', data);
    } catch (err) {
      console.error('❌ Error al cargar estadísticas:', err);
      setError('Error al cargar las estadísticas del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarStatsClientes = async () => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { count: total } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: nuevos } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());
      
      setStatsClientes({ total: total || 0, nuevos_mes: nuevos || 0 });
    } catch (err) {
      console.error('Error al cargar stats de clientes:', err);
    }
  };

  const cargarStatsEquipos = async () => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { count: total } = await supabase.from('equipos').select('*', { count: 'exact', head: true });
      
      const hoy = new Date().toISOString().split('T')[0];
      const { count: pendientes } = await supabase
        .from('equipos')
        .select('*', { count: 'exact', head: true })
        .lte('fecha_proximo_mantenimiento', hoy)
        .eq('estado', 'Habilitado');
      
      setStatsEquipos({ total: total || 0, mantenimiento_pendiente: pendientes || 0 });
    } catch (err) {
      console.error('Error al cargar stats de equipos:', err);
    }
  };

  const cargarStatsTecnicos = async () => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { count: total } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'tecnico');
      
      const { count: activos } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'tecnico')
        .eq('activo', true);
      
      setStatsTecnicos({ total: total || 0, activos: activos || 0 });
    } catch (err) {
      console.error('Error al cargar stats de técnicos:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className={`w-10 h-10 animate-spin ${
            theme === 'light' ? 'text-yellow-500' : 'text-yellow-400'
          }`} />
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Cargando estadísticas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Error al cargar el dashboard</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={cargarEstadisticas}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 h-full overflow-auto">
      {/* Header con fecha y filtros */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Panel de Control
            </h1>
            <p className={`text-sm flex items-center gap-2 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {/* Filtros compactos */}
          <div className={`flex flex-wrap items-center gap-2 p-3 rounded-lg border ${
            theme === 'light'
              ? 'bg-gray-50 border-gray-200'
              : 'bg-gray-800 border-gray-700'
          }`}>
            <select
              value={sedeSeleccionada}
              onChange={(e) => setSedeSeleccionada(e.target.value)}
              className={`px-3 py-1.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'bg-white border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-white'
              }`}
            >
              <option value="todas">📍 Todas las sedes</option>
              {sedes.map(sede => (
                <option key={sede} value={sede}>{sede}</option>
              ))}
            </select>

            <input
              type="month"
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              placeholder="Mes"
              className={`px-3 py-1.5 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'bg-white border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-white'
              }`}
            />

            {(sedeSeleccionada !== 'todas' || mesSeleccionado) && (
              <button
                onClick={() => {
                  setSedeSeleccionada('todas');
                  setMesSeleccionado('');
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                }`}
              >
                ✕ Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Métricas Principales - Grid Mejorado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {isLoading ? (
          // Skeleton loaders
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`p-6 rounded-lg shadow-sm border animate-pulse ${
                theme === 'light'
                  ? 'bg-white border-gray-200'
                  : 'bg-gray-800 border-gray-700'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-lg ${
                    theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                  }`} />
                </div>
                <div className={`h-4 w-24 rounded mb-2 ${
                  theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                }`} />
                <div className={`h-8 w-16 rounded ${
                  theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                }`} />
              </div>
            ))}
          </>
        ) : estadisticas ? (
          <>
            {/* Total de Órdenes */}
            <div className={`p-6 rounded-lg shadow-sm border ${
              theme === 'light'
                ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
                : 'bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-medium ${
                  theme === 'light' ? 'text-yellow-900' : 'text-yellow-300'
                }`}>
                  Total de Órdenes {mesSeleccionado ? `(${new Date(mesSeleccionado + '-01').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })})` : ''}
                </h3>
                <ClipboardList className={`w-5 h-5 ${
                  theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'
                }`} />
              </div>
              <div className={`text-3xl font-bold ${
                theme === 'light' ? 'text-yellow-900' : 'text-yellow-100'
              }`}>
                {estadisticas.total_ordenes}
              </div>
              <div className={`text-sm mt-2 ${
                theme === 'light' ? 'text-yellow-700' : 'text-yellow-400'
              }`}>
                {mesSeleccionado ? (
                  <div>Total del período seleccionado</div>
                ) : (
                  <>
                    <div>Hoy: {estadisticas.ordenes_dia}</div>
                    <div>Esta semana: {estadisticas.ordenes_semana}</div>
                    <div>Este mes: {estadisticas.ordenes_mes}</div>
                  </>
                )}
              </div>
            </div>

            {/* Ingresos */}
            <div className={`p-6 rounded-lg shadow-sm border ${
              theme === 'light'
                ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                : 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-medium ${
                  theme === 'light' ? 'text-green-900' : 'text-green-300'
                }`}>
                  Ingresos {mesSeleccionado ? `(${new Date(mesSeleccionado + '-01').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })})` : ''}
                </h3>
                <TrendingUp className={`w-5 h-5 ${
                  theme === 'light' ? 'text-green-600' : 'text-green-400'
                }`} />
              </div>
              <div className={`text-3xl font-bold ${
                theme === 'light' ? 'text-green-900' : 'text-green-100'
              }`}>
                ${estadisticas.ingresos_totales.toLocaleString('es-CO')}
              </div>
              <div className={`text-sm mt-2 ${
                theme === 'light' ? 'text-green-700' : 'text-green-400'
              }`}>
                {mesSeleccionado ? (
                  <div>Total del período seleccionado</div>
                ) : (
                  <div>Este mes: ${estadisticas.ingresos_mes_actual.toLocaleString('es-CO')}</div>
                )}
              </div>
            </div>

            {/* En Proceso */}
            <div className={`p-6 rounded-lg shadow-sm border ${
              theme === 'light'
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                : 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-medium ${
                  theme === 'light' ? 'text-blue-900' : 'text-blue-300'
                }`}>
                  En Proceso
                </h3>
                <Settings className={`w-5 h-5 ${
                  theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                }`} />
              </div>
              <div className={`text-3xl font-bold ${
                theme === 'light' ? 'text-blue-900' : 'text-blue-100'
              }`}>
                {estadisticas.ordenes_por_estado.en_proceso}
              </div>
              <div className={`text-sm mt-2 ${
                theme === 'light' ? 'text-blue-700' : 'text-blue-400'
              }`}>
                Activas actualmente
              </div>
            </div>

            {/* Completadas */}
            <div className={`p-6 rounded-lg shadow-sm border ${
              theme === 'light'
                ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                : 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-medium ${
                  theme === 'light' ? 'text-purple-900' : 'text-purple-300'
                }`}>
                  Completadas
                </h3>
                <CheckCircle className={`w-5 h-5 ${
                  theme === 'light' ? 'text-purple-600' : 'text-purple-400'
                }`} />
              </div>
              <div className={`text-3xl font-bold ${
                theme === 'light' ? 'text-purple-900' : 'text-purple-100'
              }`}>
                {estadisticas.ordenes_por_estado.completada}
              </div>
              <div className={`text-sm mt-2 ${
                theme === 'light' ? 'text-purple-700' : 'text-purple-400'
              }`}>
                Total finalizadas
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Métricas Secundarias */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Recursos y Operaciones
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <StatCard
            title="Clientes Registrados"
            value={statsClientes.total}
            icon={Users}
            change={statsClientes.nuevos_mes > 0 ? { value: statsClientes.nuevos_mes, trend: 'up' } : undefined}
            theme={theme}
            gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
            onClick={() => onSectionChange?.('clientes')}
          />
          <StatCard
            title="Equipos en Sistema"
            value={statsEquipos.total}
            icon={Package}
            change={statsEquipos.mantenimiento_pendiente > 0 ? 
              { value: statsEquipos.mantenimiento_pendiente, trend: 'down' } : undefined}
            theme={theme}
            gradient="bg-gradient-to-br from-orange-500 to-orange-600"
            onClick={() => onSectionChange?.('inventario-equipos')}
          />
          <StatCard
            title="Técnicos Activos"
            value={`${statsTecnicos.activos}/${statsTecnicos.total}`}
            icon={Wrench}
            theme={theme}
            gradient="bg-gradient-to-br from-teal-500 to-teal-600"
            onClick={() => onSectionChange?.('usuarios')}
          />
        </div>
      </div>

      {/* Estados por Fase - Cards Compactos */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Estados por Fase
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Recepción */}
          <div
            onClick={() => onSectionChange?.('ordenes', 'Recepción')}
            className={`p-5 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
              theme === 'light'
                ? 'bg-white border-gray-200 hover:border-teal-400'
                : 'bg-gray-800 border-gray-700 hover:border-teal-400'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Clock className={`w-5 h-5 ${
                theme === 'light' ? 'text-teal-600' : 'text-teal-400'
              }`} />
              <span className={`text-2xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {estadisticas.ordenes_por_fase['Recepción'] || 0}
              </span>
            </div>
            <h3 className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Recepción
            </h3>
            <p className={`text-xs mt-1 ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Nuevas órdenes
            </p>
          </div>

          {/* Diagnóstico */}
          <div
            onClick={() => onSectionChange?.('ordenes', 'Diagnóstico')}
            className={`p-5 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
              theme === 'light'
                ? 'bg-white border-gray-200 hover:border-blue-400'
                : 'bg-gray-800 border-gray-700 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Search className={`w-5 h-5 ${
                theme === 'light' ? 'text-blue-600' : 'text-blue-400'
              }`} />
              <span className={`text-2xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {estadisticas.ordenes_por_fase['Diagnóstico'] || 0}
              </span>
            </div>
            <h3 className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Diagnóstico
            </h3>
            <p className={`text-xs mt-1 ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Pendientes: {estadisticas.ordenes_por_estado.pendiente || 0}
            </p>
          </div>

          <div
            onClick={() => {
              // Cotización incluye "Cotización" y "Esperando aceptación"
              // Pasamos múltiples fases separadas por coma
              onSectionChange?.('ordenes', 'Cotización,Esperando aceptación');
            }}
            className={`p-5 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
              theme === 'light'
                ? 'bg-white border-gray-200 hover:border-purple-400'
                : 'bg-gray-800 border-gray-700 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Calculator className={`w-5 h-5 ${
                theme === 'light' ? 'text-purple-600' : 'text-purple-400'
              }`} />
              <span className={`text-2xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {estadisticas.ordenes_por_fase['Cotización'] || 0}
              </span>
            </div>
            <h3 className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Cotización
            </h3>
            <p className={`text-xs mt-1 ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              En aprobación
            </p>
          </div>

          <div
            onClick={() => onSectionChange?.('ordenes', 'Reparación')}
            className={`p-5 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
              theme === 'light'
                ? 'bg-white border-gray-200 hover:border-orange-400'
                : 'bg-gray-800 border-gray-700 hover:border-orange-400'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Settings className={`w-5 h-5 ${
                theme === 'light' ? 'text-orange-600' : 'text-orange-400'
              }`} />
              <span className={`text-2xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {estadisticas.ordenes_por_fase['Reparación'] || 0}
              </span>
            </div>
            <h3 className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Reparación
            </h3>
            <p className={`text-xs mt-1 ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Repuestos: {estadisticas.ordenes_por_estado.espera_repuestos || 0}
            </p>
          </div>

          <div
            onClick={() => onSectionChange?.('ordenes', 'Entrega')}
            className={`p-5 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
              theme === 'light'
                ? 'bg-white border-gray-200 hover:border-green-400'
                : 'bg-gray-800 border-gray-700 hover:border-green-400'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Package className={`w-5 h-5 ${
                theme === 'light' ? 'text-green-600' : 'text-green-400'
              }`} />
              <span className={`text-2xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {estadisticas.ordenes_por_fase['Entrega'] || 0}
              </span>
            </div>
            <h3 className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Entrega
            </h3>
            <p className={`text-xs mt-1 ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Listas para entregar
            </p>
          </div>
        </div>
      </div>

      {/* Órdenes Recientes */}
      {ordenesRecientes.length > 0 && (
        <div>
          <h2 className={`text-lg font-semibold mb-4 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Órdenes Recientes
          </h2>
          <div className={`rounded-lg shadow-sm border overflow-hidden ${
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-gray-800 border-gray-700'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}>
                  <tr className={`border-b ${
                    theme === 'light' ? 'border-gray-200' : 'border-gray-700'
                  }`}>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      N° Orden
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      Cliente
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      Fase
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      Estado
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {ordenesRecientes.map((orden, index) => (
                    <tr
                      key={orden.id}
                      onClick={() => router.push(`/paneladmin/ordenes/${orden.id}`)}
                      className={`transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'hover:bg-gray-50 hover:shadow-sm'
                          : 'hover:bg-gray-700 hover:shadow-sm'
                      }`}
                    >
                      <td className={`px-4 py-3 text-sm font-medium ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>
                        {orden.numero_orden}
                      </td>
                      <td className={`px-4 py-3 text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {orden.cliente?.razon_social || orden.cliente?.nombre_comercial || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          theme === 'light'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-purple-900/30 text-purple-300'
                        }`}>
                          {orden.fase_actual}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          orden.estado?.toLowerCase().includes('completada') || orden.estado?.toLowerCase().includes('finalizada')
                            ? (theme === 'light' ? 'bg-green-100 text-green-800' : 'bg-green-900/50 text-green-200 border border-green-700')
                            : orden.estado?.toLowerCase().includes('proceso') || orden.estado?.toLowerCase().includes('reparación') || orden.estado?.toLowerCase().includes('reparacion')
                            ? (theme === 'light' ? 'bg-blue-100 text-blue-800' : 'bg-blue-900/50 text-blue-200 border border-blue-700')
                            : orden.estado?.toLowerCase().includes('repuesto') || orden.estado?.toLowerCase().includes('espera')
                            ? (theme === 'light' ? 'bg-orange-100 text-orange-800' : 'bg-orange-900/50 text-orange-200 border border-orange-700')
                            : orden.estado?.toLowerCase().includes('cancelada')
                            ? (theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-gray-700/50 text-gray-300 border border-gray-600')
                            : (theme === 'light' ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-900/50 text-yellow-200 border border-yellow-700')
                        }`}>
                          {orden.estado}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {new Date(orden.created_at).toLocaleDateString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
