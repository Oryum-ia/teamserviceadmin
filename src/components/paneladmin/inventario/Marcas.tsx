"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, Globe, MapPin } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { obtenerTodasLasMarcas, desactivarMarca, type Marca } from '@/lib/services/marcaService';
import MarcaModal from '../ordenes/MarcaModal';
import ResponsiveTable, { TableColumn, TableAction } from '../ResponsiveTable';

export default function Marcas() {
  const { theme } = useTheme();
  const toast = useToast();

  // Estados de datos
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [filteredMarcas, setFilteredMarcas] = useState<Marca[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [marcaToEdit, setMarcaToEdit] = useState<Marca | null>(null);
  const [selectedMarca, setSelectedMarca] = useState<Marca | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Cargar marcas al montar
  useEffect(() => {
    cargarMarcas();
  }, []);

  // Aplicar búsqueda
  useEffect(() => {
    aplicarFiltros();
  }, [searchQuery, marcas]);

  const cargarMarcas = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerTodasLasMarcas();
      setMarcas(data);
      setFilteredMarcas(data);
    } catch (err) {
      console.error('Error al cargar marcas:', err);
      toast.error('Error al cargar las marcas');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...marcas];

    if (searchQuery.trim()) {
      resultado = resultado.filter(marca =>
        marca.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        marca.pais_origen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        marca.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMarcas(resultado);
    setCurrentPage(1); // Reset a primera página al filtrar
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Está seguro de desactivar la marca "${nombre}"?`)) {
      return;
    }

    try {
      await desactivarMarca(id);
      toast.success('Marca desactivada exitosamente');
      cargarMarcas();
    } catch (err) {
      console.error('Error al desactivar marca:', err);
      toast.error('Error al desactivar la marca');
    }
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMarcas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMarcas.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Definición de columnas para la tabla
  const columns: TableColumn<Marca>[] = [
    {
      key: 'nombre',
      label: 'Marca',
      render: (marca) => (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {marca.nombre}
          </span>
          {marca.sitio_web && (
            <a
              href={marca.sitio_web}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'pais',
      label: 'País de Origen',
      render: (marca) => (
        marca.pais_origen ? (
          <div className={`flex items-center gap-1 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-300'
          }`}>
            <MapPin className="w-4 h-4" />
            {marca.pais_origen}
          </div>
        ) : (
          <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>-</span>
        )
      ),
      hideOnMobile: true,
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (marca) => (
        <div className={`max-w-xs truncate ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {marca.descripcion || '-'}
        </div>
      ),
    },
  ];

  // Definición de acciones para cada fila
  const actions: TableAction<Marca>[] = [
    {
      icon: <Trash2 className="w-4 h-4" />,
      title: 'Desactivar marca',
      className: 'p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
      onClick: (marca, event) => {
        event.stopPropagation();
        handleDelete(marca.id, marca.nombre);
      },
    },
  ];

  const handleRowClick = (marca: Marca) => {
    setSelectedMarca(marca);
    setMarcaToEdit(marca);
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
            Marcas
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Gestiona las marcas de equipos y productos
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
              placeholder="Buscar marcas..."
              className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>

          {/* Botón crear */}
          <button
            onClick={() => {
              setMarcaToEdit(null);
              setIsModalOpen(true);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              theme === 'light'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Marca</span>
          </button>
        </div>
      </div>

      {/* Resultados y paginación */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredMarcas.length)} de {filteredMarcas.length} marcas
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
        emptyMessage="No se encontraron marcas"
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
              // Mostrar solo algunas páginas en mobile
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
      <MarcaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMarca(null);
          setMarcaToEdit(null);
        }}
        onSuccess={() => {
          cargarMarcas();
          setIsModalOpen(false);
          setSelectedMarca(null);
          setMarcaToEdit(null);
        }}
        marcaEditar={selectedMarca}
      />
    </div>
  );
}
