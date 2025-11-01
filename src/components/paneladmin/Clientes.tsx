"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { Cliente } from '@/types/database.types';
import { obtenerTodosLosClientes, buscarClientes, eliminarCliente } from '@/lib/services/clienteService';
import ClienteModal from './ClienteModal';

export default function Clientes() {
  const { theme } = useTheme();
  const toast = useToast();
  
  // Estados de datos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Cargar clientes al montar
  useEffect(() => {
    cargarClientes();
  }, []);

  // Aplicar búsqueda
  useEffect(() => {
    aplicarFiltros();
  }, [searchQuery, clientes]);

  const cargarClientes = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerTodosLosClientes();
      setClientes(data);
      setFilteredClientes(data);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      toast.error('Error al cargar los clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...clientes];

    if (searchQuery.trim()) {
      resultado = resultado.filter(cliente =>
        cliente.identificacion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cliente.razon_social?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cliente.nombre_comercial?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cliente.correo_electronico?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cliente.ciudad?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredClientes(resultado);
    setCurrentPage(1); // Reset a primera página al filtrar
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Está seguro de eliminar el cliente "${nombre}"?`)) {
      return;
    }

    try {
      await eliminarCliente(id);
      toast.success('Cliente eliminado exitosamente');
      cargarClientes();
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      toast.error('Error al eliminar el cliente');
    }
  };

  const getDisplayName = (cliente: Cliente) => {
    if (cliente.es_juridica) {
      return cliente.razon_social || cliente.nombre_comercial || 'Sin nombre';
    }
    return cliente.nombre_comercial || cliente.razon_social || 'Sin nombre';
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

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
            Clientes
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Gestiona tus clientes y su información de contacto
          </p>
        </div>

        {/* Barra de búsqueda y acciones */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Búsqueda compacta */}
          <div className="relative sm:w-96">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'light' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar clientes..."
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
              setSelectedCliente(null);
              setIsModalOpen(true);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              theme === 'light'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Resultados y paginación */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredClientes.length)} de {filteredClientes.length} clientes
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
            No se encontraron clientes
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
                    Tipo
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Identificación
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Nombre / Razón Social
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Ciudad
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Teléfono
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Correo
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
                {currentItems.map((cliente) => (
                  <tr
                    key={cliente.id}
                    onClick={() => {
                      setSelectedCliente(cliente);
                      setIsModalOpen(true);
                    }}
                    className={`transition-colors cursor-pointer ${
                      theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        cliente.es_juridica
                          ? theme === 'light'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-blue-900/30 text-blue-300'
                          : theme === 'light'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-green-900/30 text-green-300'
                      }`}>
                        {cliente.es_juridica ? 'Jurídica' : 'Natural'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {cliente.tipo_documento} {cliente.identificacion}{cliente.dv ? `-${cliente.dv}` : ''}
                    </td>
                    <td className={`px-6 py-4 ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      <div className="max-w-xs truncate" title={getDisplayName(cliente)}>
                        {getDisplayName(cliente)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      {cliente.ciudad || '-'}
                    </td>
                    <td className={`px-6 py-4 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      {cliente.telefono || '-'}
                    </td>
                    <td className={`px-6 py-4 ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      <div className="max-w-xs truncate" title={cliente.correo_electronico || '-'}>
                        {cliente.correo_electronico || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(ev) => ev.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(cliente.id, getDisplayName(cliente))}
                        className="p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      <ClienteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCliente(null);
        }}
        onSuccess={() => {
          cargarClientes();
          setIsModalOpen(false);
          setSelectedCliente(null);
        }}
        cliente={selectedCliente}
      />
    </div>
  );
}
