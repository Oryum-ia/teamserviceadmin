"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { obtenerTodosLosAccesorios, eliminarAccesorio } from '@/lib/services/accesorioService';
import AccesorioModal from '../ordenes/AccesorioModal';
import ResponsiveTable, { TableColumn, TableAction } from '../ResponsiveTable';

export default function Accesorios() {
  const { theme } = useTheme();
  const toast = useToast();

  // Estados de datos
  const [accesorios, setAccesorios] = useState<any[]>([]);
  const [filteredAccesorios, setFilteredAccesorios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccesorio, setSelectedAccesorio] = useState<any | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Cargar accesorios al montar
  useEffect(() => {
    cargarAccesorios();
  }, []);

  // Aplicar búsqueda
  useEffect(() => {
    aplicarFiltros();
  }, [searchQuery, accesorios]);

  const cargarAccesorios = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerTodosLosAccesorios();
      setAccesorios(data);
      setFilteredAccesorios(data);
    } catch (err) {
      console.error('Error al cargar accesorios:', err);
      toast.error('Error al cargar los accesorios');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...accesorios];

    if (searchQuery.trim()) {
      resultado = resultado.filter(accesorio =>
        accesorio.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        accesorio.marca?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAccesorios(resultado);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string, descripcion: string) => {
    if (!confirm(`¿Está seguro de eliminar el accesorio "${descripcion}"?`)) {
      return;
    }

    try {
      await eliminarAccesorio(id);
      toast.success('Accesorio eliminado exitosamente');
      cargarAccesorios();
    } catch (err) {
      console.error('Error al eliminar accesorio:', err);
      toast.error('Error al eliminar el accesorio');
    }
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAccesorios.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAccesorios.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Definición de columnas para la tabla
  const columns: TableColumn<any>[] = [
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (accesorio) => (
        <span className={`font-medium ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          {accesorio.descripcion}
        </span>
      ),
    },
    {
      key: 'marca',
      label: 'Marca',
      render: (accesorio) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {accesorio.marca || '-'}
        </span>
      ),
    },
  ];

  // Definición de acciones para cada fila
  const actions: TableAction<any>[] = [
    {
      icon: <Trash2 className="w-4 h-4" />,
      title: 'Eliminar accesorio',
      className: 'p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
      onClick: (accesorio, event) => {
        event.stopPropagation();
        handleDelete(accesorio.id, accesorio.descripcion);
      },
    },
  ];

  const handleRowClick = (accesorio: any) => {
    setSelectedAccesorio(accesorio);
    setIsModalOpen(true);
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
            Accesorios
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Gestiona los accesorios disponibles en el inventario
          </p>
        </div>

        {/* Barra de búsqueda y acciones */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Búsqueda compacta */}
          <div className="relative sm:w-80">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'light' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar accesorios..."
              className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>

          {/* Botón crear */}
          <button
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              theme === 'light'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Accesorio</span>
          </button>
        </div>
      </div>

      {/* Resultados y paginación */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredAccesorios.length)} de {filteredAccesorios.length} accesorios
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
        actions={actions}
        onRowClick={handleRowClick}
        emptyMessage="No se encontraron accesorios"
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
      <AccesorioModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAccesorio(null);
        }}
        onSuccess={() => {
          cargarAccesorios();
          setIsModalOpen(false);
          setSelectedAccesorio(null);
        }}
        accesorioEditar={selectedAccesorio}
      />
    </div>
  );
}
