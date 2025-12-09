"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, Tag, Wrench, Box } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { obtenerTodosLosModelos, eliminarModelo } from '@/lib/services/modeloService';
import ModeloModal from '../ordenes/ModeloModal';

export default function Modelos() {
  const { theme } = useTheme();
  const toast = useToast();

  // Estados de datos
  const [modelos, setModelos] = useState<any[]>([]);
  const [filteredModelos, setFilteredModelos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModelo, setSelectedModelo] = useState<any | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Cargar modelos al montar
  useEffect(() => {
    cargarModelos();
  }, []);

  // Aplicar búsqueda
  useEffect(() => {
    aplicarFiltros();
  }, [searchQuery, modelos]);

  const cargarModelos = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerTodosLosModelos();
      setModelos(data);
      setFilteredModelos(data);
    } catch (err) {
      console.error('Error al cargar modelos:', err);
      toast.error('Error al cargar los modelos');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...modelos];

    if (searchQuery.trim()) {
      resultado = resultado.filter(modelo =>
        modelo.equipo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        modelo.marca?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        modelo.referencia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        modelo.serial?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredModelos(resultado);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Está seguro de eliminar el modelo "${nombre}"?`)) {
      return;
    }

    try {
      await eliminarModelo(id);
      toast.success('Modelo eliminado exitosamente');
      cargarModelos();
    } catch (err) {
      console.error('Error al eliminar modelo:', err);
      toast.error('Error al eliminar el modelo');
    }
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredModelos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredModelos.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
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
            Modelos
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Gestiona los modelos de equipos y sus relaciones
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
              placeholder="Buscar modelos..."
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
            <span>Nuevo Modelo</span>
          </button>
        </div>
      </div>

      {/* Resultados y paginación */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredModelos.length)} de {filteredModelos.length} modelos
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

      {/* Tabla/Cards responsive */}
      {currentItems.length === 0 ? (
        <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
          theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-800'
        }`}>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            No se encontraron modelos
          </p>
        </div>
      ) : (
        <>
          {/* Vista Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className={`w-full rounded-lg overflow-hidden ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}>
              <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Equipo
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Marca
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Referencia
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Serial
                  </th>

                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
              }`}>
                {currentItems.map((modelo) => (
                  <tr
                    key={modelo.id}
                    onClick={() => {
                      setSelectedModelo(modelo);
                      setIsModalOpen(true);
                    }}
                    className={`transition-colors cursor-pointer ${
                      theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'
                    }`}>
                    <td className={`px-6 py-4 ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      <span className="font-medium">{modelo.equipo}</span>
                    </td>
                    <td className={`px-6 py-4 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      {modelo.marca?.nombre || modelo.marca || '-'}
                    </td>
                    <td className={`px-6 py-4 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      {modelo.referencia || '-'}
                    </td>
                    <td className={`px-6 py-4 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      {modelo.serial || '-'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(ev) => ev.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(modelo.id, modelo.equipo)}
                        className="p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista Tablet/Mobile */}
          <div className="lg:hidden space-y-4">
            {currentItems.map((modelo) => (
              <div
                key={modelo.id}
                className={`rounded-lg p-4 ${
                  theme === 'light' ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className={`font-medium mb-2 ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {modelo.equipo}
                    </h3>

                    <div className="space-y-1 text-sm">
                      {modelo.marca && (
                        <div className={`flex items-center gap-2 ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          <Tag className="w-3 h-3" />
                          <span>{modelo.marca?.nombre || modelo.marca}</span>
                        </div>
                      )}

                      {modelo.referencia && (
                        <div className={`${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          Ref: {modelo.referencia}
                        </div>
                      )}

                      {modelo.serial && (
                        <div className={`${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          Serial: {modelo.serial}
                        </div>
                      )}

                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(modelo.id, modelo.equipo)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
      <ModeloModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedModelo(null);
        }}
        onSuccess={() => {
          cargarModelos();
          setIsModalOpen(false);
          setSelectedModelo(null);
        }}
        modeloEditar={selectedModelo}
      />
    </div>
  );
}
