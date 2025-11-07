"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, Ticket, Power, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { Cupon } from '@/types/database.types';
import { obtenerTodosLosCupones, eliminarCupon, toggleActivoCupon, marcarCuponComoUsado } from '@/lib/services/cuponService';
import CuponModal from './CuponModal';
import ResponsiveTable, { TableColumn, TableAction } from './ResponsiveTable';

export default function Cupones() {
  const { theme } = useTheme();
  const toast = useToast();
  
  // Estados de datos
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [filteredCupones, setFilteredCupones] = useState<Cupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCupon, setSelectedCupon] = useState<Cupon | null>(null);
  
  // Estados de filtros
  const [filtroEstado, setFiltroEstado] = useState<string>(''); // '', 'activo', 'inactivo'
  const [filtroUso, setFiltroUso] = useState<string>(''); // '', 'usado', 'disponible'
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Cargar cupones al montar
  useEffect(() => {
    cargarCupones();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros();
  }, [searchQuery, cupones, filtroEstado, filtroUso]);

  const cargarCupones = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerTodosLosCupones();
      setCupones(data);
      setFilteredCupones(data);
    } catch (err) {
      console.error('Error al cargar cupones:', err);
      toast.error('Error al cargar los cupones');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...cupones];

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      resultado = resultado.filter(cupon =>
        cupon.codigo?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por estado activo
    if (filtroEstado === 'activo') {
      resultado = resultado.filter(cupon => cupon.activo === true);
    } else if (filtroEstado === 'inactivo') {
      resultado = resultado.filter(cupon => cupon.activo === false);
    }

    // Filtro por uso
    if (filtroUso === 'usado') {
      resultado = resultado.filter(cupon => cupon.usado === true);
    } else if (filtroUso === 'disponible') {
      resultado = resultado.filter(cupon => cupon.usado === false);
    }

    setFilteredCupones(resultado);
    setCurrentPage(1);
  };

  const limpiarFiltros = () => {
    setFiltroEstado('');
    setFiltroUso('');
  };

  const handleDelete = async (id: string, codigo: string) => {
    if (!confirm(`¿Está seguro de eliminar el cupón "${codigo}"?`)) {
      return;
    }

    try {
      await eliminarCupon(id);
      toast.success('Cupón eliminado exitosamente');
      cargarCupones();
    } catch (err) {
      console.error('Error al eliminar cupón:', err);
      toast.error('Error al eliminar el cupón');
    }
  };

  const handleToggleActivo = async (id: string, activo: boolean) => {
    try {
      const nuevoEstado = !activo;
      await toggleActivoCupon(id, nuevoEstado);
      
      // Actualizar localmente sin recargar
      setCupones(prev => prev.map(c => 
        c.id === id ? { ...c, activo: nuevoEstado } : c
      ));
      setFilteredCupones(prev => prev.map(c => 
        c.id === id ? { ...c, activo: nuevoEstado } : c
      ));
      
      toast.success(`Cupón ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`);
    } catch (err) {
      console.error('Error al cambiar estado del cupón:', err);
      toast.error('Error al cambiar el estado del cupón');
    }
  };

  const handleMarcarUsado = async (id: string, codigo: string) => {
    if (!confirm(`¿Marcar el cupón "${codigo}" como usado?`)) {
      return;
    }

    try {
      await marcarCuponComoUsado(id);
      toast.success('Cupón marcado como usado');
      cargarCupones();
    } catch (err) {
      console.error('Error al marcar cupón como usado:', err);
      toast.error('Error al marcar el cupón como usado');
    }
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCupones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCupones.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Definición de columnas para la tabla
  const columns: TableColumn<Cupon>[] = [
    {
      key: 'codigo',
      label: 'Código',
      render: (cupon) => (
        <div className="flex items-center gap-2">
          <Ticket className={`w-5 h-5 ${
            theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'
          }`} />
          <span className={`font-mono font-bold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {cupon.codigo}
          </span>
        </div>
      ),
    },
    {
      key: 'descuento',
      label: 'Descuento',
      render: (cupon) => (
        <span className={`text-lg font-bold ${
          theme === 'light' ? 'text-green-600' : 'text-green-400'
        }`}>
          {cupon.porcentaje_descuento}%
        </span>
      ),
    },
    {
      key: 'uso',
      label: 'Estado de Uso',
      render: (cupon) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
          cupon.usado
            ? 'bg-red-100 text-red-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {cupon.usado ? (
            <>
              <XCircle className="w-3 h-3" />
              Usado
            </>
          ) : (
            <>
              <CheckCircle className="w-3 h-3" />
              Disponible
            </>
          )}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (cupon) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          cupon.activo
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {cupon.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'fecha_uso',
      label: 'Fecha de Uso',
      render: (cupon) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {cupon.fecha_uso ? new Date(cupon.fecha_uso).toLocaleDateString('es-CO') : '-'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      render: (cupon) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {new Date(cupon.created_at).toLocaleDateString('es-CO')}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  // Definición de acciones para cada fila
  const getActions = (cupon: Cupon): TableAction<Cupon>[] => {
    const actions: TableAction<Cupon>[] = [];

    // Solo permitir marcar como usado si no está usado y está activo
    if (!cupon.usado && cupon.activo) {
      actions.push({
        icon: <CheckCircle className="w-4 h-4" />,
        title: 'Marcar como usado',
        className: 'p-2 rounded-lg transition-colors text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
        onClick: (cupon, event) => {
          event.stopPropagation();
          handleMarcarUsado(cupon.id, cupon.codigo);
        },
      });
    }

    // Solo permitir activar/desactivar si no ha sido usado
    if (!cupon.usado) {
      actions.push({
        icon: <Power className="w-4 h-4" />,
        title: cupon.activo ? 'Desactivar' : 'Activar',
        className: `p-2 rounded-lg transition-colors ${
          cupon.activo
            ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
            : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
        }`,
        onClick: (cupon, event) => {
          event.stopPropagation();
          handleToggleActivo(cupon.id, cupon.activo ?? false);
        },
      });
    }

    // Siempre permitir eliminar
    actions.push({
      icon: <Trash2 className="w-4 h-4" />,
      title: 'Eliminar cupón',
      className: 'p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
      onClick: (cupon, event) => {
        event.stopPropagation();
        handleDelete(cupon.id, cupon.codigo);
      },
    });

    return actions;
  };

  const handleRowClick = (cupon: Cupon) => {
    // Solo permitir editar si no ha sido usado
    if (!cupon.usado) {
      setSelectedCupon(cupon);
      setIsModalOpen(true);
    } else {
      toast.info('No se puede editar un cupón que ya fue usado');
    }
  };

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
            Cupones de Descuento
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Gestiona los cupones de descuento para la tienda
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
              placeholder="Buscar por código..."
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
            } ${(filtroEstado || filtroUso) ? 'ring-2 ring-yellow-500' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {(filtroEstado || filtroUso) && (
              <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                {[filtroEstado, filtroUso].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Botón crear */}
          <button
            onClick={() => {
              setSelectedCupon(null);
              setIsModalOpen(true);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              theme === 'light'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cupón</span>
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
                Estado
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
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>

            {/* Filtro por uso */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Estado de Uso
              </label>
              <select
                value={filtroUso}
                onChange={(e) => setFiltroUso(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              >
                <option value="">Todos</option>
                <option value="disponible">Disponibles</option>
                <option value="usado">Usados</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${
          theme === 'light' ? 'bg-green-50 border border-green-200' : 'bg-green-900/20 border border-green-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                Disponibles
              </p>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-green-700' : 'text-green-300'}`}>
                {cupones.filter(c => !c.usado && c.activo).length}
              </p>
            </div>
            <CheckCircle className={`w-8 h-8 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg ${
          theme === 'light' ? 'bg-red-50 border border-red-200' : 'bg-red-900/20 border border-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`}>
                Usados
              </p>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-red-700' : 'text-red-300'}`}>
                {cupones.filter(c => c.usado).length}
              </p>
            </div>
            <XCircle className={`w-8 h-8 ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg ${
          theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/20 border border-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                Total
              </p>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>
                {cupones.length}
              </p>
            </div>
            <Ticket className={`w-8 h-8 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} />
          </div>
        </div>
      </div>

      {/* Resultados y paginación */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredCupones.length)} de {filteredCupones.length} cupones
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
        emptyMessage="No se encontraron cupones"
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
      <CuponModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCupon(null);
        }}
        onSuccess={() => {
          cargarCupones();
          setIsModalOpen(false);
          setSelectedCupon(null);
        }}
        cupon={selectedCupon}
      />
    </div>
  );
}
