"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, Box, Hash } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { obtenerTodosLosRepuestos, eliminarRepuesto } from '@/lib/services/repuestoService';
import RepuestoModal from '../ordenes/RepuestoModal';
import ResponsiveTable, { TableColumn, TableAction } from '../ResponsiveTable';

export default function Repuestos() {
  const { theme } = useTheme();
  const toast = useToast();

  // Estados de datos
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [filteredRepuestos, setFilteredRepuestos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRepuesto, setSelectedRepuesto] = useState<any | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Cargar repuestos al montar
  useEffect(() => {
    cargarRepuestos();
  }, []);

  // Aplicar búsqueda
  useEffect(() => {
    aplicarFiltros();
  }, [searchQuery, repuestos]);

  const cargarRepuestos = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerTodosLosRepuestos();
      setRepuestos(data);
      setFilteredRepuestos(data);
    } catch (err) {
      console.error('Error al cargar repuestos:', err);
      toast.error('Error al cargar los repuestos');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...repuestos];

    if (searchQuery.trim()) {
      resultado = resultado.filter(repuesto =>
        repuesto.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repuesto.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repuesto.causante?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repuesto.escrito?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRepuestos(resultado);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string, descripcion: string) => {
    if (!confirm(`¿Está seguro de eliminar el repuesto "${descripcion}"?`)) {
      return;
    }

    try {
      await eliminarRepuesto(id);
      toast.success('Repuesto eliminado exitosamente');
      cargarRepuestos();
    } catch (err) {
      console.error('Error al eliminar repuesto:', err);
      toast.error('Error al eliminar el repuesto');
    }
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRepuestos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRepuestos.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const columns: TableColumn<any>[] = [
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (repuesto) => (
        <span className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
          {repuesto.descripcion}
        </span>
      ),
    },
    {
      key: 'codigo',
      label: 'Código',
      render: (repuesto) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {repuesto.codigo || '-'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'cantidad',
      label: 'Cantidad',
      render: (repuesto) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {repuesto.cantidad || '0'}
        </span>
      ),
    },
    {
      key: 'causante',
      label: 'Causante',
      render: (repuesto) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {repuesto.causante || '-'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'escrito',
      label: 'Escrito',
      render: (repuesto) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {repuesto.escrito || '-'}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  const actions: TableAction<any>[] = [
    {
      icon: <Trash2 className="w-4 h-4" />,
      title: 'Eliminar repuesto',
      className: 'p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
      onClick: (repuesto, event) => {
        event.stopPropagation();
        handleDelete(repuesto.id, repuesto.descripcion);
      },
    },
  ];

  const handleRowClick = (repuesto: any) => {
    setSelectedRepuesto(repuesto);
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
            Repuestos
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Gestiona los repuestos disponibles en el inventario
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
              placeholder="Buscar repuestos..."
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
            <span>Nuevo Repuesto</span>
          </button>
        </div>
      </div>

      {/* Resultados y paginación */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredRepuestos.length)} de {filteredRepuestos.length} repuestos
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
        emptyMessage="No se encontraron repuestos"
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
      <RepuestoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRepuesto(null);
        }}
        onSuccess={() => {
          cargarRepuestos();
          setIsModalOpen(false);
          setSelectedRepuesto(null);
        }}
        repuestoEditar={selectedRepuesto}
      />
    </div>
  );
}
