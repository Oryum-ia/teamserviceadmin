"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { Orden, OrdenStatus } from '@/types/database.types';
import { obtenerTodasLasOrdenes } from '@/lib/services/ordenService';
import OrdenModal from './ordenes/OrdenModal';

// Helper function to get status color and label (coded status)
const getStatusInfo = (status: OrdenStatus) => {
  switch (status) {
    case 'completada':
      return { color: 'bg-green-500', label: 'Completada' };
    case 'en_proceso':
      return { color: 'bg-blue-500', label: 'En Proceso' };
    case 'espera_repuestos':
      return { color: 'bg-orange-500', label: 'Esperando Repuestos' };
    case 'pendiente':
      return { color: 'bg-yellow-500', label: 'Pendiente' };
    case 'cancelada':
      return { color: 'bg-red-500', label: 'Cancelada' };
    default:
      return { color: 'bg-gray-500', label: status };
  }
};

// Helper to map estado_actual (DB) to color/label; falls back to coded status
const getEstadoActualInfo = (estadoActual?: string, fallbackStatus?: OrdenStatus) => {
  if (estadoActual) {
    switch (estadoActual) {
      case 'Bodega':
        return { color: 'bg-amber-500', label: 'Bodega' };
      case 'Chatarrizado':
        return { color: 'bg-red-600', label: 'Chatarrizado' };
      case 'Recepción':
        return { color: 'bg-sky-500', label: 'Recepción' };
      case 'Esperando repuestos':
        return { color: 'bg-orange-500', label: 'Esperando Repuestos' };
      case 'Cotización':
        return { color: 'bg-blue-500', label: 'Cotización' };
      case 'Esperando aceptación':
        return { color: 'bg-purple-600', label: 'Esperando Aceptación' };
      case 'Diagnóstico':
        return { color: 'bg-purple-500', label: 'Diagnóstico' };
      case 'Reparación':
        return { color: 'bg-indigo-500', label: 'Reparación' };
      case 'Finalizada':
        return { color: 'bg-green-500', label: 'Finalizada' };
      default:
        return { color: 'bg-gray-500', label: estadoActual };
    }
  }
  // Fallback to previous status enum mapping
  return getStatusInfo((fallbackStatus as OrdenStatus) || 'pendiente');
};

interface ColumnFilters {
  numeroOrden: string;
  cliente: string;
  identificacion: string;
  equipo: string;
  serial: string;
  marca: string;
  modelo: string;
  sede: string;
  estado: OrdenStatus | 'all';
}

export default function OrdenesNuevo() {
  const { theme } = useTheme();
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    numeroOrden: '',
    cliente: '',
    identificacion: '',
    equipo: '',
    serial: '',
    marca: '',
    modelo: '',
    sede: '',
    estado: 'all'
  });

  // No abrir filtros automáticamente - solo aplicarlos

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar órdenes al montar el componente
  useEffect(() => {
    cargarOrdenes();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    aplicarFiltros();
  }, [columnFilters, ordenes]);

  const cargarOrdenes = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await obtenerTodasLasOrdenes();
      setOrdenes(data);
      setFilteredOrdenes(data);
      console.log('✅ Órdenes cargadas:', data.length);
    } catch (err) {
      console.error('❌ Error al cargar órdenes:', err);
      setError('Error al cargar las órdenes');
      setOrdenes([]);
      setFilteredOrdenes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...ordenes];

    // Filtrar por número de orden
    if (columnFilters.numeroOrden.trim()) {
      resultado = resultado.filter(orden =>
        orden.numero_orden?.toLowerCase().includes(columnFilters.numeroOrden.toLowerCase())
      );
    }

    // Filtrar por cliente
    if (columnFilters.cliente.trim()) {
      resultado = resultado.filter(orden =>
        orden.cliente?.razon_social?.toLowerCase().includes(columnFilters.cliente.toLowerCase()) ||
        orden.cliente?.nombre_comercial?.toLowerCase().includes(columnFilters.cliente.toLowerCase())
      );
    }

    // Filtrar por identificación
    if (columnFilters.identificacion.trim()) {
      resultado = resultado.filter(orden =>
        orden.cliente?.identificacion?.toLowerCase().includes(columnFilters.identificacion.toLowerCase())
      );
    }

    // Filtrar por equipo
    if (columnFilters.equipo.trim()) {
      resultado = resultado.filter(orden =>
        orden.tipo_producto?.toLowerCase().includes(columnFilters.equipo.toLowerCase())
      );
    }

    // Filtrar por serial
    if (columnFilters.serial.trim()) {
      resultado = resultado.filter(orden =>
        orden.serial?.toLowerCase().includes(columnFilters.serial.toLowerCase())
      );
    }

    // Filtrar por marca
    if (columnFilters.marca.trim()) {
      resultado = resultado.filter(orden =>
        orden.marca?.toLowerCase().includes(columnFilters.marca.toLowerCase())
      );
    }

    // Filtrar por modelo
    if (columnFilters.modelo.trim()) {
      resultado = resultado.filter(orden =>
        orden.modelo?.toLowerCase().includes(columnFilters.modelo.toLowerCase())
      );
    }

    // Filtrar por sede
    if (columnFilters.sede.trim()) {
      resultado = resultado.filter(orden =>
        orden.sede_creador?.toLowerCase().includes(columnFilters.sede.toLowerCase())
      );
    }

    // Filtrar por estado
    if (columnFilters.estado !== 'all') {
      resultado = resultado.filter(orden => orden.estado === columnFilters.estado);
    }

    setFilteredOrdenes(resultado);
    setCurrentPage(1);
  };

  const handleModalSuccess = () => {
    cargarOrdenes();
  };

  const getClienteName = (orden: any) => {
    if (!orden.cliente) return 'Cliente no encontrado';
    return orden.cliente.es_juridica
      ? orden.cliente.razon_social || orden.cliente.nombre_comercial
      : orden.cliente.nombre_comercial || orden.cliente.razon_social;
  };

  const clearAllFilters = () => {
    setColumnFilters({
      numeroOrden: '',
      cliente: '',
      identificacion: '',
      equipo: '',
      serial: '',
      marca: '',
      modelo: '',
      sede: '',
      estado: 'all'
    });
  };

  const hasActiveFilters = () => {
    return columnFilters.numeroOrden || columnFilters.cliente || columnFilters.identificacion ||
           columnFilters.equipo || columnFilters.serial || columnFilters.marca ||
           columnFilters.modelo || columnFilters.sede || columnFilters.estado !== 'all';
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrdenes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrdenes.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header con búsqueda */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Órdenes de Servicio
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Gestiona y monitorea todas las órdenes de servicio
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
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
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              theme === 'light'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            }`}
          >
            <span>+ Nueva Orden</span>
          </button>
        </div>
      </div>

      {/* Panel de filtros colapsable */}
      {showFilters && (
        <div className={`mb-4 p-4 rounded-lg border ${
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Número de orden */}
            <div className="relative">
              <input
                type="text"
                value={columnFilters.numeroOrden}
                onChange={(e) => setColumnFilters({...columnFilters, numeroOrden: e.target.value})}
                placeholder="N° Orden..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
              {columnFilters.numeroOrden && (
                <button
                  onClick={() => setColumnFilters({...columnFilters, numeroOrden: ''})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Estado */}
            <div>
              <select
                value={columnFilters.estado}
                onChange={(e) => setColumnFilters({...columnFilters, estado: e.target.value as OrdenStatus | 'all'})}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Proceso</option>
                <option value="espera_repuestos">Esperando Repuestos</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            {/* Cliente */}
            <div className="relative">
              <input
                type="text"
                value={columnFilters.cliente}
                onChange={(e) => setColumnFilters({...columnFilters, cliente: e.target.value})}
                placeholder="Cliente..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
              {columnFilters.cliente && (
                <button
                  onClick={() => setColumnFilters({...columnFilters, cliente: ''})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Identificación */}
            <div className="relative">
              <input
                type="text"
                value={columnFilters.identificacion}
                onChange={(e) => setColumnFilters({...columnFilters, identificacion: e.target.value})}
                placeholder="Identificación..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
              {columnFilters.identificacion && (
                <button
                  onClick={() => setColumnFilters({...columnFilters, identificacion: ''})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Equipo */}
            <div className="relative">
              <input
                type="text"
                value={columnFilters.equipo}
                onChange={(e) => setColumnFilters({...columnFilters, equipo: e.target.value})}
                placeholder="Tipo de equipo..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
              {columnFilters.equipo && (
                <button
                  onClick={() => setColumnFilters({...columnFilters, equipo: ''})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Serial */}
            <div className="relative">
              <input
                type="text"
                value={columnFilters.serial}
                onChange={(e) => setColumnFilters({...columnFilters, serial: e.target.value})}
                placeholder="Serial..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
              {columnFilters.serial && (
                <button
                  onClick={() => setColumnFilters({...columnFilters, serial: ''})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Marca */}
            <div className="relative">
              <input
                type="text"
                value={columnFilters.marca}
                onChange={(e) => setColumnFilters({...columnFilters, marca: e.target.value})}
                placeholder="Marca..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
              {columnFilters.marca && (
                <button
                  onClick={() => setColumnFilters({...columnFilters, marca: ''})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modelo */}
            <div className="relative">
              <input
                type="text"
                value={columnFilters.modelo}
                onChange={(e) => setColumnFilters({...columnFilters, modelo: e.target.value})}
                placeholder="Modelo..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
              {columnFilters.modelo && (
                <button
                  onClick={() => setColumnFilters({...columnFilters, modelo: ''})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sede */}
            <div className="relative">
              <input
                type="text"
                value={columnFilters.sede}
                onChange={(e) => setColumnFilters({...columnFilters, sede: e.target.value})}
                placeholder="Sede..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
              {columnFilters.sede && (
                <button
                  onClick={() => setColumnFilters({...columnFilters, sede: ''})}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Resultados y paginación */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredOrdenes.length)} de {filteredOrdenes.length} órdenes
        </div>

        {/* Items por página */}
        <div className="flex items-center gap-2">
          <span className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Mostrar:
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className={`px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              theme === 'light'
                ? 'border-gray-300 bg-white text-gray-900'
                : 'border-gray-600 bg-gray-700 text-gray-100'
            }`}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredOrdenes.length === 0 && (
        <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
          theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-800'
        }`}>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            {hasActiveFilters() ? 'No se encontraron órdenes con los filtros aplicados' : 'No hay órdenes registradas'}
          </p>
          {!hasActiveFilters() && (
            <button
              onClick={() => setIsModalOpen(true)}
              className={`mt-4 px-4 py-2 rounded-lg text-sm transition-colors ${
                theme === 'light'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black'
              }`}
            >
              Crear primera orden
            </button>
          )}
        </div>
      )}

      {/* Tabla con scroll horizontal */}
      {!isLoading && currentItems.length > 0 && (
        <>
          <div className={`rounded-lg border overflow-hidden ${
            theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '1200px' }}>
                <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Estado
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      N° Orden
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Cliente
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Identificación
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Marca
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Modelo
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Serial
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Responsable
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Sede
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Fecha Creación
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
                }`}>
                  {currentItems.map((orden) => {
                    const statusInfo = getEstadoActualInfo(orden.estado_actual, orden.estado);

                    return (
                      <tr 
                        key={orden.id} 
                        onClick={() => router.push(`/paneladmin/ordenes/${orden.id}`)}
                        className={`cursor-pointer transition-colors ${
                          theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'
                        }`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${
                          theme === 'light' ? 'text-gray-900' : 'text-white'
                        }`}>
                          <span className="font-medium">{orden.numero_orden}</span>
                        </td>
                        <td className={`px-4 py-4 ${
                          theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                        }`}>
                          <div className="max-w-xs">
                            <div className="font-medium truncate" title={getClienteName(orden)}>
                              {getClienteName(orden)}
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {orden.cliente?.identificacion || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {orden.marca || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {orden.modelo || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {orden.serial || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {orden.responsable || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {orden.sede_creador || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {new Date(orden.fecha_creacion).toLocaleDateString('es-CO')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNumber
                            ? theme === 'light'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-yellow-400 text-black'
                            : theme === 'light'
                              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="text-gray-500">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <OrdenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
