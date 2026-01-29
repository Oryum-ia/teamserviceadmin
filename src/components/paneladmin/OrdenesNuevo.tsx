"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Loader2, ChevronLeft, ChevronRight, X, Trash2, AlertTriangle } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { Orden, OrdenStatus } from '@/types/database.types';
import { obtenerOrdenesPaginadas, eliminarOrden } from '@/lib/services/ordenService';
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
  estado: OrdenStatus | 'all' | string; // Permitir string para múltiples estados
  fase: string; // Puede contener múltiples fases separadas por coma
}

export default function OrdenesNuevo() {
  const { theme } = useTheme();
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cargar filtros desde localStorage al iniciar
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(() => {
    if (typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem('ordenes_filtros');
      if (savedFilters) {
        try {
          const parsed = JSON.parse(savedFilters);
          // Asegurar que el campo fase siempre exista
          return {
            numeroOrden: parsed.numeroOrden || '',
            cliente: parsed.cliente || '',
            identificacion: parsed.identificacion || '',
            equipo: parsed.equipo || '',
            serial: parsed.serial || '',
            marca: parsed.marca || '',
            modelo: parsed.modelo || '',
            sede: parsed.sede || '',
            estado: parsed.estado || 'all',
            fase: parsed.fase || ''
          };
        } catch (e) {
          console.error('Error al cargar filtros guardados:', e);
        }
      }
    }
    return {
      numeroOrden: '',
      cliente: '',
      identificacion: '',
      equipo: '',
      serial: '',
      marca: '',
      modelo: '',
      sede: '',
      estado: 'all',
      fase: ''
    };
  });

  // Detectar si viene de dashboard con filtro de fase o estado
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const faseParam = params.get('fase');
      const estadoParam = params.get('estado');
      
      if (faseParam || estadoParam) {
        console.log('🔍 Parámetros recibidos:', { faseParam, estadoParam });
        
        const newFilters = { ...columnFilters };
        
        if (faseParam) {
          // Usar directamente el parámetro de fase sin mapeo
          newFilters.fase = faseParam;
          console.log('✅ Filtro de fase aplicado:', faseParam);
        }
        
        if (estadoParam) {
          // Si el estado contiene múltiples valores separados por coma,
          // guardarlos para filtrar por múltiples estados
          newFilters.estado = estadoParam as OrdenStatus | 'all';
          console.log('✅ Filtro de estado aplicado:', estadoParam);
        }
        
        setColumnFilters(newFilters);
        setShowFilters(true);
        
        // Limpiar los parámetros de la URL después de aplicarlos
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ordenToDelete, setOrdenToDelete] = useState<any>(null);

  // Guardar filtros en localStorage cuando cambien
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ordenes_filtros', JSON.stringify(columnFilters));
    }
  }, [columnFilters]);

  // Cargar órdenes cuando cambien filtros o paginación (con debounce)
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      cargarOrdenes();
    }, 500);
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [columnFilters, currentPage, itemsPerPage]);

  const cargarOrdenes = async () => {
    console.log('🔄 [OrdenesNuevo] Iniciando carga de órdenes...');
    console.log('📋 [OrdenesNuevo] Filtros actuales:', columnFilters);
    setIsLoading(true);
    setError('');
    try {
      console.log(`📡 [OrdenesNuevo] Llamando a obtenerOrdenesPaginadas (Pag: ${currentPage})...`);
      
      const { data, count } = await obtenerOrdenesPaginadas({
        page: currentPage, 
        pageSize: itemsPerPage,
        filters: columnFilters
      });
      
      console.log('✅ [OrdenesNuevo] Datos recibidos:', data ? data.length : 'null', 'Total:', count);
      
      if (Array.isArray(data)) {
        setOrdenes(data);
        setFilteredOrdenes(data); // Ya vienen filtrados del servidor
        setTotalItems(count);
      } else {
        console.error('⚠️ [OrdenesNuevo] Los datos recibidos no son un array:', data);
        setOrdenes([]);
        setFilteredOrdenes([]);
        setTotalItems(0);
        setError('Error: Formato de datos inválido');
      }
    } catch (err: any) {
      console.error('❌ [OrdenesNuevo] Error al cargar órdenes:', err);
      
      // Detectar errores de sesión
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes('Sesión expirada') || errorMessage.includes('sesión')) {
        setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(`Error al cargar las órdenes: ${errorMessage}`);
      }
      
      setOrdenes([]);
      setFilteredOrdenes([]);
      setTotalItems(0);
    } finally {
      console.log('🏁 [OrdenesNuevo] Finalizando carga, quitando spinner.');
      setIsLoading(false);
    }
  };

  // Función aplicarFiltros eliminada (se hace en server) para evitar doble filtrado
  const aplicarFiltros = () => {
     // Trigger reload via useEffect dependency
     setCurrentPage(1);
  };

    // La función original aplicaba filtros en memoria.
    // Ahora, los filtros triggers un reload del useEffect.
    // Mantendremos esta función como wrapper simple o la eliminaremos del uso directo.
    // setCurrentPage(1) se debe llamar al cambiar filtros en los inputs directamente.
    // Los inputs ya llaman a setColumnFilters, lo cual dispara el useEffect.
    // Pero si queremos resetear página al filtrar esto ayuda.
    // Como el useEffect observa columnFilters, resetear página ahí es tricky.
    // Mejor lógica: useEffect observa columnFilters, si cambian, resetea a pag 1?
    // No, mejor dejar que el usuario maneje o resetear página manualmente en los inputs.
    // Simplificación: eliminar lógica de filtrado cliente.
    // (Este bloque estaba vacio por el reemplazo anterior)

  const handleModalSuccess = () => {
    cargarOrdenes();
  };

  const getClienteName = (orden: any) => {
    if (!orden.cliente) return 'Cliente no encontrado';
    
    // Prioritize based on es_juridica flag, but ensure we always get a valid name
    const cliente = orden.cliente;
    
    // For companies (jurídicas): prioritize razon_social
    if (cliente.es_juridica === true) {
      return cliente.razon_social?.trim() || cliente.nombre_comercial?.trim() || 'Sin nombre';
    }
    
    // For individuals (not jurídicas or es_juridica is null/false): prioritize nombre_comercial
    return cliente.nombre_comercial?.trim() || cliente.razon_social?.trim() || 'Sin nombre';
  };

  const clearAllFilters = () => {
    const defaultFilters = {
      numeroOrden: '',
      cliente: '',
      identificacion: '',
      equipo: '',
      serial: '',
      marca: '',
      modelo: '',
      sede: '',
      estado: 'all' as const,
      fase: ''
    };
    setColumnFilters(defaultFilters);
    // Limpiar también el localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ordenes_filtros', JSON.stringify(defaultFilters));
    }
  };

  const hasActiveFilters = () => {
    return columnFilters.numeroOrden || columnFilters.cliente || columnFilters.identificacion ||
      columnFilters.equipo || columnFilters.serial || columnFilters.marca ||
      columnFilters.modelo || columnFilters.sede || columnFilters.estado !== 'all' || columnFilters.fase;
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage; // Para mostrar índice correcto
  const currentItems = filteredOrdenes; // Ya vienen paginados del servidor
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleDeleteClick = (e: React.MouseEvent, orden: any) => {
    e.stopPropagation();
    setOrdenToDelete(orden);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!ordenToDelete) return;

    try {
      await eliminarOrden(ordenToDelete.id);
      setIsDeleteModalOpen(false);
      setOrdenToDelete(null);
      // Recargar la lista
      cargarOrdenes();
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error al eliminar la orden. Por favor intente nuevamente.");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header con búsqueda */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
            Órdenes de Servicio
          </h1>
          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
            Gestiona y monitorea todas las órdenes de servicio
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${showFilters
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
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${theme === 'light'
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
        <div className={`mb-4 p-4 rounded-lg border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
          }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                Filtros de Búsqueda
              </h3>
              {columnFilters.fase && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  theme === 'light' ? 'bg-purple-100 text-purple-800' : 'bg-purple-900/30 text-purple-300'
                }`}>
                  Fase: {columnFilters.fase.includes(',') 
                    ? columnFilters.fase.split(',').map(f => f.trim()).join(' o ') 
                    : columnFilters.fase}
                </span>
              )}
            </div>
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${theme === 'light'
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
                onChange={(e) => {
                   setColumnFilters({ ...columnFilters, numeroOrden: e.target.value });
                   setCurrentPage(1); // Reset page on filter change
                }}
                placeholder="N° Orden..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
              />
              {columnFilters.numeroOrden && (
                <button
                  onClick={() => setColumnFilters({ ...columnFilters, numeroOrden: '' })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Fase */}
            <div>
              <select
                value={columnFilters.fase}
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, fase: e.target.value });
                  setCurrentPage(1);
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
              >
                <option value="">Todas las fases</option>
                <option value="Recepción">Recepción</option>
                <option value="Diagnóstico">Diagnóstico</option>
                <option value="Cotización">Cotización</option>
                <option value="Esperando aceptación">Esperando aceptación</option>
                <option value="Reparación">Reparación</option>
                <option value="Entrega">Entrega</option>
                <option value="Finalizada">Finalizada</option>
                <option value="Bodega">Bodega</option>
                <option value="Chatarrizado">Chatarrizado</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <select
                value={columnFilters.estado}
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, estado: e.target.value as OrdenStatus | 'all' });
                  setCurrentPage(1);
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
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
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, cliente: e.target.value });
                  setCurrentPage(1);
                }}
                placeholder="Cliente..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
              />
              {columnFilters.cliente && (
                <button
                  onClick={() => setColumnFilters({ ...columnFilters, cliente: '' })}
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
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, identificacion: e.target.value });
                  setCurrentPage(1);
                }}
                placeholder="Identificación..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
              />
              {columnFilters.identificacion && (
                <button
                  onClick={() => setColumnFilters({ ...columnFilters, identificacion: '' })}
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
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, equipo: e.target.value });
                  setCurrentPage(1);
                }}
                placeholder="Tipo de equipo..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
              />
              {columnFilters.equipo && (
                <button
                  onClick={() => setColumnFilters({ ...columnFilters, equipo: '' })}
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
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, serial: e.target.value });
                  setCurrentPage(1);
                }}
                placeholder="Serial..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
              />
              {columnFilters.serial && (
                <button
                  onClick={() => setColumnFilters({ ...columnFilters, serial: '' })}
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
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, marca: e.target.value });
                  setCurrentPage(1);
                }}
                placeholder="Marca..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
              />
              {columnFilters.marca && (
                <button
                  onClick={() => setColumnFilters({ ...columnFilters, marca: '' })}
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
                onChange={(e) => {
                   setColumnFilters({ ...columnFilters, modelo: e.target.value });
                   setCurrentPage(1);
                }}
                placeholder="Modelo..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
              />
              {columnFilters.modelo && (
                <button
                  onClick={() => setColumnFilters({ ...columnFilters, modelo: '' })}
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
                onChange={(e) => {
                  setColumnFilters({ ...columnFilters, sede: e.target.value });
                  setCurrentPage(1);
                }}
                placeholder="Sede..."
                className={`w-full pl-3 pr-8 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
              />
              {columnFilters.sede && (
                <button
                  onClick={() => setColumnFilters({ ...columnFilters, sede: '' })}
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
        <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, totalItems)} de {totalItems} órdenes
        </div>

        {/* Items por página */}
        <div className="flex items-center gap-2">
          <span className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
            Mostrar:
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className={`px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
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
        <div className={`text-center py-12 rounded-lg border-2 border-dashed ${theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-800'
          }`}>
          <p className={`text-lg font-medium mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            {hasActiveFilters() ? 'No se encontraron órdenes' : 'No hay órdenes registradas'}
          </p>
          <p className={`text-sm mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            {hasActiveFilters() 
              ? `No hay órdenes que coincidan con los filtros aplicados${columnFilters.fase ? ` (Fase: ${columnFilters.fase})` : ''}`
              : 'Comienza creando tu primera orden de servicio'
            }
          </p>
          {hasActiveFilters() ? (
            <button
              onClick={clearAllFilters}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${theme === 'light'
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
            >
              Limpiar filtros
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${theme === 'light'
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
          <div className={`rounded-lg border overflow-hidden ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
            }`}>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '1200px' }}>
                <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      Estado
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      Fase
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      N° Orden
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      Cliente
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      Identificación
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      Marca
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      Modelo
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      Serial
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      Responsable
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      Sede
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      Fecha Creación
                    </th>
                    <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
                  }`}>
                  {currentItems.map((orden) => {
                    const statusInfo = getEstadoActualInfo(orden.estado_actual, orden.estado);

                    return (
                      <tr
                        key={orden.id}
                        onClick={() => router.push(`/paneladmin/ordenes/${orden.id}`)}
                        className={`cursor-pointer transition-colors ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'
                          }`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            theme === 'light' ? 'bg-purple-100 text-purple-800' : 'bg-purple-900/30 text-purple-300'
                          }`}>
                            {orden.estado_actual || 'Sin fase'}
                          </span>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>
                          <span className="font-medium">{orden.numero_orden}</span>
                        </td>
                        <td className={`px-4 py-4 ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                          }`}>
                          <div className="max-w-xs">
                            <div className="font-medium truncate" title={getClienteName(orden)}>
                              {getClienteName(orden)}
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                          {orden.cliente?.identificacion || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                          {orden.marca || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                          {orden.modelo || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                          {orden.serial || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                          {orden.responsable || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                          {orden.sede || '-'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                          {new Date(orden.fecha_creacion).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => handleDeleteClick(e, orden)}
                            className={`p-2 rounded-full transition-colors ${theme === 'light'
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-red-400 hover:bg-red-900/20'
                              }`}
                            title="Eliminar orden"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'light'
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
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === pageNumber
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'light'
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-xl transform transition-all p-6 ${theme === 'light' ? 'bg-white' : 'bg-gray-800 border border-gray-700'
            }`}>
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full mb-4 ${theme === 'light' ? 'bg-red-100' : 'bg-red-900/30'
                }`}>
                <AlertTriangle className={`w-8 h-8 ${theme === 'light' ? 'text-red-600' : 'text-red-400'
                  }`} />
              </div>

              <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                ¿Eliminar orden {ordenToDelete?.numero_orden}?
              </h3>

              <p className={`mb-6 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta orden permanentemente?
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${theme === 'light'
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
