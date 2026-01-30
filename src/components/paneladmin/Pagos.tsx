"use client";

import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Loader2, ChevronLeft, ChevronRight, Filter, DollarSign } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import type { OrdenPago, EstadoPago } from '@/types/bold.types';
import {
  obtenerTodasLasOrdenes,
  eliminarOrdenPago,
  buscarOrdenes,
} from '@/lib/services/ordenPagoService';
import ResponsiveTable, { TableColumn, TableAction } from './ResponsiveTable';
import OrdenPagoModal from '@/components/paneladmin/OrdenPagoModal';

export default function Pagos() {
  const { theme } = useTheme();
  const toast = useToast();

  
  // Estados de datos
  const [ordenes, setOrdenes] = useState<OrdenPago[]>([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState<OrdenPago[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<OrdenPago | null>(null);
  
  // Estados de filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroMetodo, setFiltroMetodo] = useState<string>('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Cargar órdenes al montar
  useEffect(() => {
    cargarOrdenes();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros();
  }, [ordenes, searchQuery, filtroEstado, filtroMetodo]);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filtroEstado, filtroMetodo]);

  const cargarOrdenes = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerTodasLasOrdenes();
      setOrdenes(data);
      setFilteredOrdenes(data);
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
      toast.error('Error al cargar las órdenes de pago');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...ordenes];

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      resultado = resultado.filter(orden =>
        orden.order_id?.toLowerCase().includes(query) ||
        orden.cliente_nombre?.toLowerCase().includes(query) ||
        orden.cliente_email?.toLowerCase().includes(query) ||
        orden.cliente_telefono?.toLowerCase().includes(query)
      );
    }

    // Filtro por estado
    if (filtroEstado) {
      resultado = resultado.filter(orden => orden.estado_pago === filtroEstado);
    }

    // Filtro por método de pago
    if (filtroMetodo) {
      resultado = resultado.filter(orden => orden.metodo_pago === filtroMetodo);
    }

    setFilteredOrdenes(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroEstado('');
    setFiltroMetodo('');
  };

  const handleDelete = async (id: string, orderId: string) => {
    if (!confirm(`¿Está seguro de eliminar la orden "${orderId}"?`)) {
      return;
    }

    try {
      await eliminarOrdenPago(id);
      toast.success('Orden eliminada exitosamente');
      cargarOrdenes();
    } catch (err) {
      console.error('Error al eliminar orden:', err);
      toast.error('Error al eliminar la orden');
    }
  };

  const getEstadoBadgeClass = (estado: EstadoPago) => {
    switch (estado) {
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      case 'cancelado':
        return 'bg-gray-100 text-gray-800';
      case 'expirado':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetodoPagoLabel = (metodo: string) => {
    switch (metodo) {
      case 'pse':
        return 'PSE';
      case 'credit-card':
        return 'Tarjeta';
      case 'efecty':
        return 'Efecty';
      case 'whatsapp':
        return 'WhatsApp';
      default:
        return metodo;
    }
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrdenes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrdenes.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Definición de columnas para la tabla
  const columns: TableColumn<OrdenPago>[] = [
    {
      key: 'order_id',
      label: 'ID Orden',
      render: (orden) => (
        <div>
          <span className={`font-medium ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {orden.order_id}
          </span>
          {orden.bold_transaction_id && (
            <div className={`text-xs mt-0.5 ${
              theme === 'light' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              TX: {orden.bold_transaction_id.substring(0, 20)}...
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'cliente',
      label: 'Cliente',
      render: (orden) => (
        <div>
          <div className={`font-medium ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {orden.cliente_nombre}
          </div>
          <div className={`text-xs ${
            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {orden.cliente_email}
          </div>
          <div className={`text-xs ${
            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {orden.cliente_telefono}
          </div>
        </div>
      ),
    },
    {
      key: 'productos',
      label: 'Productos',
      render: (orden) => (
        <div className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
        }`}>
          {orden.productos?.length || 0} producto(s)
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'total',
      label: 'Total',
      render: (orden) => (
        <span className={`font-semibold ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          ${orden.total?.toLocaleString('es-CO') || 0}
        </span>
      ),
    },
    {
      key: 'metodo_pago',
      label: 'Método',
      render: (orden) => (
        <span className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
        }`}>
          {getMetodoPagoLabel(orden.metodo_pago)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (orden) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          getEstadoBadgeClass(orden.estado_pago)
        }`}>
          {orden.estado_pago.charAt(0).toUpperCase() + orden.estado_pago.slice(1)}
        </span>
      ),
    },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (orden) => (
        <div className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
        }`}>
          {new Date(orden.created_at).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      ),
      hideOnMobile: true,
    },
  ];

  // Definición de acciones para cada fila
  const getActions = (orden: OrdenPago): TableAction<OrdenPago>[] => [
    {
      icon: <Eye className="w-4 h-4" />,
      title: 'Ver detalles',
      className: 'p-2 rounded-lg transition-colors text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
      onClick: (orden, event) => {
        event.stopPropagation();
        setSelectedOrden(orden);
        setIsModalOpen(true);
      },
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      title: 'Eliminar orden',
      className: 'p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
      onClick: (orden, event) => {
        event.stopPropagation();
        handleDelete(orden.id, orden.order_id);
      },
    },
  ];

  const handleRowClick = (orden: OrdenPago) => {
    setSelectedOrden(orden);
    setIsModalOpen(true);
  };

  // Calcular totales para mostrar
  const totalVentas = filteredOrdenes
    .filter(o => o.estado_pago === 'aprobado')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }


  return (
    <div className="p-4 sm:p-6">
      {/* Header con búsqueda */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Pagos Bold
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Gestiona las órdenes de pago de la tienda online
          </p>
        </div>

        {/* Barra de búsqueda y acciones */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Búsqueda compacta */}
          <div className="relative sm:w-64">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'light' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ID, nombre o email..."
              className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>

          {/* Botón filtros */}
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              theme === 'light'
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            } ${(filtroEstado || filtroMetodo) ? 'ring-2 ring-yellow-500' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {(filtroEstado || filtroMetodo) && (
              <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                {[filtroEstado, filtroMetodo].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {mostrarFiltros && (
        <div className={`mb-4 p-4 rounded-lg border ${
          theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Filtros
            </h3>
            <button
              onClick={limpiarFiltros}
              className={`text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'text-yellow-600 hover:text-yellow-700'
                  : 'text-yellow-400 hover:text-yellow-300'
              }`}
            >
              Limpiar filtros
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por estado */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Estado de Pago
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="cancelado">Cancelado</option>
                <option value="expirado">Expirado</option>
              </select>
            </div>

            {/* Filtro por método de pago */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Método de Pago
              </label>
              <select
                value={filtroMetodo}
                onChange={(e) => setFiltroMetodo(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              >
                <option value="">Todos los métodos</option>
                <option value="pse">PSE</option>
                <option value="credit-card">Tarjeta de Crédito</option>
                <option value="efecty">Efecty</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tarjeta de resumen */}
      <div className={`mb-4 p-4 rounded-lg border ${
        theme === 'light' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' : 'bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-yellow-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${
            theme === 'light' ? 'bg-yellow-500' : 'bg-yellow-600'
          }`}>
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}>
              Total Ventas Aprobadas
            </div>
            <div className={`text-2xl font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              ${totalVentas.toLocaleString('es-CO')}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}>
              Órdenes Aprobadas
            </div>
            <div className={`text-xl font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              {filteredOrdenes.filter(o => o.estado_pago === 'aprobado').length}
            </div>
          </div>
        </div>
      </div>

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
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className={`px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              theme === 'light'
                ? 'border-gray-300 bg-white text-gray-900'
                : 'border-gray-600 bg-gray-700 text-gray-100'
            }`}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Tabla responsive */}
      <ResponsiveTable
        data={currentItems}
        columns={columns}
        actions={getActions}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        emptyMessage="No se encontraron órdenes de pago"
      />

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

      {/* Modal */}
      <OrdenPagoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrden(null);
        }}
        onSuccess={() => {
          cargarOrdenes();
          setSelectedOrden(null);
        }}
        orden={selectedOrden}
      />
    </div>
  );
}
