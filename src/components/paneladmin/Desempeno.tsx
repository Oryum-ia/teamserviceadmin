"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Award, AlertCircle, Users, Loader2, Timer, Zap, ChevronDown, ChevronUp, ArrowLeft, TrendingUp, CheckCircle, AlertTriangle, ClipboardList } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { obtenerDesempenoDetallado, obtenerResumenEquipo, DesempenoTecnico } from '@/lib/services/desempenoService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

/** Formatea horas a unidad legible: min / h min / d h */
function formatearTiempo(horas?: number): string {
  if (horas === undefined || horas === null || horas <= 0) return 'N/A';
  const totalMin = horas * 60;
  if (totalMin < 1) return '< 1 min';
  if (totalMin < 60) return `${Math.round(totalMin)} min`;
  if (horas < 24) {
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    return m === 0 ? `${h}h` : `${h}h ${m}min`;
  }
  const dias = Math.floor(horas / 24);
  const horasR = Math.round(horas % 24);
  return horasR === 0 ? `${dias}d` : `${dias}d ${horasR}h`;
}

function getColorEficiencia(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

function getBgEficiencia(score: number, theme: string): string {
  if (score >= 75) return theme === 'light' ? 'bg-green-100 text-green-700' : 'bg-green-900/30 text-green-400';
  if (score >= 50) return theme === 'light' ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-900/30 text-yellow-400';
  return theme === 'light' ? 'bg-red-100 text-red-700' : 'bg-red-900/30 text-red-400';
}

export default function Desempeno() {
  const { theme } = useTheme();
  const toast = useToast();

  const [tecnicos, setTecnicos] = useState<DesempenoTecnico[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [vistaActual, setVistaActual] = useState<'general' | 'detalle'>('general');
  const [tecnicoDetalle, setTecnicoDetalle] = useState<DesempenoTecnico | null>(null);

  useEffect(() => { cargarDatos(); }, []);

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

  const aplicarFiltros = () => cargarDatos(fechaInicio || undefined, fechaFin || undefined);
  const limpiarFiltros = () => { setFechaInicio(''); setFechaFin(''); cargarDatos(); };

  const verDetalleTecnico = (tecnico: DesempenoTecnico) => {
    setTecnicoDetalle(tecnico);
    setVistaActual('detalle');
  };

  const volverAGeneral = () => {
    setTecnicoDetalle(null);
    setVistaActual('general');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  // --- DATOS PARA GRÁFICAS ---
  // Ranking por órdenes/día
  const dataRanking = tecnicos.map(t => ({
    nombre: t.tecnico_nombre.split(' ')[0],
    ordenes_dia: t.ordenes_por_dia,
    completadas: t.ordenes_completadas,
    total: t.total_ordenes,
    eficiencia: t.eficiencia_score
  })).sort((a, b) => b.ordenes_dia - a.ordenes_dia);

  // Comparativa de tiempos promedio (solo diagnóstico y reparación)
  const dataComparativa = tecnicos.map(t => ({
    nombre: t.tecnico_nombre.split(' ')[0],
    diagnostico: t.tiempo_promedio_diagnostico ? parseFloat((t.tiempo_promedio_diagnostico * 60).toFixed(0)) : 0,
    reparacion: t.tiempo_promedio_reparacion ? parseFloat((t.tiempo_promedio_reparacion * 60).toFixed(0)) : 0
  }));

  // Tooltip personalizado
  const CustomTooltipRanking = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    const tecnico = tecnicos.find(t => t.tecnico_nombre.split(' ')[0] === label);
    return (
      <div className={`p-3 rounded-lg border shadow-lg text-sm ${
        theme === 'light' ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'
      }`}>
        <p className="font-semibold mb-1">{tecnico?.tecnico_nombre || label}</p>
        <p>Órdenes/día: <span className="font-bold">{tecnico?.ordenes_por_dia}</span></p>
        <p>Completadas: <span className="font-bold">{tecnico?.ordenes_completadas}/{tecnico?.total_ordenes}</span></p>
        <p>Eficiencia: <span className="font-bold">{tecnico?.eficiencia_score}%</span></p>
      </div>
    );
  };

  const CustomTooltipTiempos = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    const tecnico = tecnicos.find(t => t.tecnico_nombre.split(' ')[0] === label);
    return (
      <div className={`p-3 rounded-lg border shadow-lg text-sm ${
        theme === 'light' ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'
      }`}>
        <p className="font-semibold mb-1">{tecnico?.tecnico_nombre || label}</p>
        <p className="text-cyan-500">Diagnóstico: {formatearTiempo(tecnico?.tiempo_promedio_diagnostico)}</p>
        <p className="text-purple-500">Reparación: {formatearTiempo(tecnico?.tiempo_promedio_reparacion)}</p>
      </div>
    );
  };

  // =============================================
  // VISTA DETALLE DE UN TÉCNICO
  // =============================================
  if (vistaActual === 'detalle' && tecnicoDetalle) {
    const t = tecnicoDetalle;
    
    // Datos para radar del técnico
    const radarData = [
      { metrica: 'Completación', valor: t.tasa_completacion, max: 100 },
      { metrica: 'Volumen', valor: Math.min(100, t.ordenes_por_dia * 50), max: 100 },
      { metrica: 'Vel. Diagnóstico', valor: t.tiempo_promedio_diagnostico ? Math.max(0, 100 - (t.tiempo_promedio_diagnostico - 1) * 20) : 50, max: 100 },
      { metrica: 'Vel. Reparación', valor: t.tiempo_promedio_reparacion ? Math.max(0, 100 - (t.tiempo_promedio_reparacion - 0.5) * 30) : 50, max: 100 },
      { metrica: 'Eficiencia', valor: t.eficiencia_score, max: 100 },
    ];

    return (
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header con botón volver */}
        <div className="flex items-center gap-4">
          <button
            onClick={volverAGeneral}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'light' ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-gray-700 text-gray-400'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {t.tecnico_nombre}
            </h1>
            <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              {t.dias_activos} días activos · Desde {new Date(t.primera_orden).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-lg font-bold ${getBgEficiencia(t.eficiencia_score, theme)}`}>
            {t.eficiencia_score}%
          </span>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <p className={`text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Órdenes/Día</p>
            </div>
            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{t.ordenes_por_dia}</p>
          </div>

          <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className={`text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Tasa Completación</p>
            </div>
            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{t.tasa_completacion}%</p>
            <p className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>{t.ordenes_completadas} de {t.total_ordenes}</p>
          </div>

          <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-cyan-500" />
              <p className={`text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Prom. Diagnóstico</p>
            </div>
            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{formatearTiempo(t.tiempo_promedio_diagnostico)}</p>
            <p className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>{t.ordenes_diagnostico} órdenes</p>
          </div>

          <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-purple-500" />
              <p className={`text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Prom. Reparación</p>
            </div>
            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{formatearTiempo(t.tiempo_promedio_reparacion)}</p>
            <p className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>{t.ordenes_reparacion} órdenes</p>
          </div>
        </div>

        {/* Radar + Resumen lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar de rendimiento */}
          <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <h3 className={`text-sm font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Perfil de Rendimiento
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={theme === 'light' ? '#e5e7eb' : '#374151'} />
                <PolarAngleAxis 
                  dataKey="metrica" 
                  tick={{ fill: theme === 'light' ? '#6b7280' : '#9ca3af', fontSize: 11 }} 
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Rendimiento"
                  dataKey="valor"
                  stroke={getColorEficiencia(t.eficiencia_score)}
                  fill={getColorEficiencia(t.eficiencia_score)}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Resumen de estado de órdenes */}
          <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <h3 className={`text-sm font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Estado de Órdenes
            </h3>
            <div className="space-y-4">
              {/* Barra de progreso visual */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Distribución</span>
                  <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{t.total_ordenes} total</span>
                </div>
                <div className="flex h-4 rounded-full overflow-hidden">
                  {t.ordenes_completadas > 0 && (
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${(t.ordenes_completadas / t.total_ordenes) * 100}%` }}
                      title={`Completadas: ${t.ordenes_completadas}`}
                    />
                  )}
                  {t.ordenes_en_proceso > 0 && (
                    <div 
                      className="bg-blue-500" 
                      style={{ width: `${(t.ordenes_en_proceso / t.total_ordenes) * 100}%` }}
                      title={`En proceso: ${t.ordenes_en_proceso}`}
                    />
                  )}
                  {t.ordenes_pendientes > 0 && (
                    <div 
                      className="bg-yellow-500" 
                      style={{ width: `${(t.ordenes_pendientes / t.total_ordenes) * 100}%` }}
                      title={`Pendientes: ${t.ordenes_pendientes}`}
                    />
                  )}
                  {(t.total_ordenes - t.ordenes_completadas - t.ordenes_en_proceso - t.ordenes_pendientes) > 0 && (
                    <div 
                      className={theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'}
                      style={{ width: `${((t.total_ordenes - t.ordenes_completadas - t.ordenes_en_proceso - t.ordenes_pendientes) / t.total_ordenes) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex gap-4 mt-2 text-xs flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Completadas: {t.ordenes_completadas}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> En proceso: {t.ordenes_en_proceso}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Pendientes: {t.ordenes_pendientes}</span>
                </div>
              </div>

              {/* Métricas clave */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900/50'}`}>
                  <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Diagnósticos realizados</p>
                  <p className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{t.ordenes_diagnostico}</p>
                </div>
                <div className={`p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900/50'}`}>
                  <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Reparaciones realizadas</p>
                  <p className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{t.ordenes_reparacion}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de órdenes del técnico */}
        <div className={`rounded-lg border overflow-hidden ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Historial de Órdenes ({t.ordenes_detalle.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Orden</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Cliente</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Estado</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Rol</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>T. Diagnóstico</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>T. Reparación</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {t.ordenes_detalle.map((orden) => (
                  <tr key={orden.id} className={`${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700/50'}`}>
                    <td className={`px-4 py-3 text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      {orden.codigo}
                    </td>
                    <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                      {orden.cliente_nombre}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        orden.estado_actual.toLowerCase().includes('finalizada') || orden.estado_actual.toLowerCase().includes('entrega')
                          ? theme === 'light' ? 'bg-green-100 text-green-700' : 'bg-green-900/30 text-green-400'
                          : orden.estado_actual.toLowerCase().includes('proceso') || orden.estado_actual.toLowerCase().includes('reparaci')
                          ? theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/30 text-blue-400'
                          : theme === 'light' ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {orden.estado_actual}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {orden.rol.includes('diagnostico') && (
                          <span className={`px-1.5 py-0.5 text-xs rounded ${theme === 'light' ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-900/30 text-cyan-400'}`}>Diag</span>
                        )}
                        {orden.rol.includes('reparacion') && (
                          <span className={`px-1.5 py-0.5 text-xs rounded ${theme === 'light' ? 'bg-purple-100 text-purple-700' : 'bg-purple-900/30 text-purple-400'}`}>Rep</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm font-mono ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                      {orden.rol.includes('diagnostico') ? formatearTiempo(orden.tiempo_diagnostico) : '—'}
                    </td>
                    <td className={`px-4 py-3 text-sm font-mono ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                      {orden.rol.includes('reparacion') ? formatearTiempo(orden.tiempo_reparacion) : '—'}
                    </td>
                    <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(orden.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // VISTA GENERAL
  // =============================================
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
          Productividad de Técnicos
        </h1>
        <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
          Métricas reales de rendimiento: velocidad, volumen y eficiencia
        </p>
      </div>

      {/* Filtros */}
      <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className={`block text-xs font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Desde</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light' ? 'border-gray-300 bg-white text-gray-900' : 'border-gray-600 bg-gray-700 text-gray-100'
              }`} />
          </div>
          <div className="flex-1">
            <label className={`block text-xs font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Hasta</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light' ? 'border-gray-300 bg-white text-gray-900' : 'border-gray-600 bg-gray-700 text-gray-100'
              }`} />
          </div>
          <div className="flex gap-2">
            <button onClick={aplicarFiltros} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'light' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            }`}>Filtrar</button>
            <button onClick={limpiarFiltros} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}>Limpiar</button>
          </div>
        </div>
      </div>

      {/* Resumen global */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Técnicos Activos</p>
            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{resumen.total_tecnicos}</p>
          </div>
          <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Tasa Completación</p>
            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{Math.round(resumen.tasa_completacion)}%</p>
          </div>
          <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Prom. Diagnóstico</p>
            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{formatearTiempo(resumen.promedio_diagnostico_horas)}</p>
          </div>
          <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Prom. Reparación</p>
            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{formatearTiempo(resumen.promedio_reparacion_horas)}</p>
          </div>
        </div>
      )}

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de productividad */}
        <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
          <h3 className={`text-sm font-semibold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            Ranking de Productividad
          </h3>
          <p className={`text-xs mb-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
            Órdenes completadas por día activo
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dataRanking} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e5e7eb' : '#374151'} />
              <XAxis type="number" stroke={theme === 'light' ? '#6b7280' : '#9ca3af'} style={{ fontSize: '11px' }} />
              <YAxis type="category" dataKey="nombre" stroke={theme === 'light' ? '#6b7280' : '#9ca3af'} style={{ fontSize: '12px' }} width={70} />
              <Tooltip content={<CustomTooltipRanking />} />
              <Bar dataKey="ordenes_dia" name="Órdenes/día" radius={[0, 4, 4, 0]}>
                {dataRanking.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorEficiencia(entry.eficiencia)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tiempos promedio (solo diagnóstico y reparación) */}
        <div className={`p-4 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
          <h3 className={`text-sm font-semibold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            Tiempos Promedio por Técnico
          </h3>
          <p className={`text-xs mb-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
            Diagnóstico y reparación (en minutos)
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dataComparativa}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e5e7eb' : '#374151'} />
              <XAxis dataKey="nombre" stroke={theme === 'light' ? '#6b7280' : '#9ca3af'} style={{ fontSize: '12px' }} />
              <YAxis stroke={theme === 'light' ? '#6b7280' : '#9ca3af'} style={{ fontSize: '11px' }}
                label={{ value: 'Minutos', angle: -90, position: 'insideLeft', style: { fontSize: '11px' } }} />
              <Tooltip content={<CustomTooltipTiempos />} />
              <Legend />
              <Bar dataKey="diagnostico" fill="#06b6d4" name="Diagnóstico" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reparacion" fill="#8b5cf6" name="Reparación" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de técnicos - clickeable para ver detalle */}
      <div className={`rounded-lg border overflow-hidden ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            Detalle por Técnico
          </h3>
          <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
            Haz clic en un técnico para ver su perfil completo
          </p>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {tecnicos.map((t) => (
            <div
              key={t.tecnico_id}
              onClick={() => verDetalleTecnico(t)}
              className={`p-4 cursor-pointer transition-colors ${
                theme === 'light' ? 'hover:bg-yellow-50' : 'hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Score badge */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${getBgEficiencia(t.eficiencia_score, theme)}`}>
                    {t.eficiencia_score}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      {t.tecnico_nombre}
                    </p>
                    <div className={`flex gap-3 text-xs mt-0.5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span>{t.ordenes_por_dia} órd/día</span>
                      <span>·</span>
                      <span>{t.ordenes_completadas}/{t.total_ordenes} completadas</span>
                      <span>·</span>
                      <span>{t.dias_activos}d activos</span>
                    </div>
                  </div>
                </div>

                {/* Métricas rápidas */}
                <div className="hidden sm:flex items-center gap-4 text-sm shrink-0">
                  <div className="text-center">
                    <p className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>Diag.</p>
                    <p className={`font-mono font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                      {formatearTiempo(t.tiempo_promedio_diagnostico)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>Rep.</p>
                    <p className={`font-mono font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                      {formatearTiempo(t.tiempo_promedio_reparacion)}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {tecnicos.length === 0 && (
        <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
          theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-800'
        }`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            No hay datos de desempeño disponibles
          </p>
        </div>
      )}
    </div>
  );
}
