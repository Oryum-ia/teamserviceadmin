"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon, Filter, Download, Power } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { ProductoTienda } from '@/types/database.types';
import { obtenerTodosLosProductos, eliminarProducto, toggleActivoProducto } from '@/lib/services/productoTiendaService';
import { obtenerTodasLasCategorias, type Categoria } from '@/lib/services/categoriaService';
import { obtenerTodasLasMarcas, type Marca } from '@/lib/services/marcaService';
import ProductoTiendaModal from './ProductoTiendaModal';
import ResponsiveTable, { TableColumn, TableAction } from './ResponsiveTable';

export default function ProductosTienda() {
  const { theme } = useTheme();
  const toast = useToast();
  
  // Estados de datos
  const [productos, setProductos] = useState<ProductoTienda[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<ProductoTienda[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<ProductoTienda | null>(null);
  
  // Estados de filtros
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroMarca, setFiltroMarca] = useState<string>('');
  const [filtroActivo, setFiltroActivo] = useState<string>(''); // '', 'activo', 'inactivo'
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Cargar productos, categorías y marcas al montar
  useEffect(() => {
    cargarProductos();
    cargarCategorias();
    cargarMarcas();
  }, []);

  // Aplicar filtros cuando cambien los filtros o productos
  useEffect(() => {
    aplicarFiltros();
  }, [productos, searchQuery, filtroCategoria, filtroMarca, filtroActivo]);

  // Solo resetear página cuando cambien los filtros (no cuando cambien los productos)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filtroCategoria, filtroMarca, filtroActivo]);

  const cargarProductos = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerTodosLosProductos();
      setProductos(data);
      setFilteredProductos(data);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      toast.error('Error al cargar los productos');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const data = await obtenerTodasLasCategorias();
      setCategorias(data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const cargarMarcas = async () => {
    try {
      const data = await obtenerTodasLasMarcas();
      setMarcas(data);
    } catch (err) {
      console.error('Error al cargar marcas:', err);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...productos];

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      resultado = resultado.filter(producto =>
        producto.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        producto.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por categoría
    if (filtroCategoria) {
      resultado = resultado.filter(producto => producto.categoria_id === filtroCategoria);
    }

    // Filtro por marca
    if (filtroMarca) {
      resultado = resultado.filter(producto => producto.marca_id === filtroMarca);
    }

    // Filtro por estado activo
    if (filtroActivo === 'activo') {
      resultado = resultado.filter(producto => producto.activo === true);
    } else if (filtroActivo === 'inactivo') {
      resultado = resultado.filter(producto => producto.activo === false);
    }

    setFilteredProductos(resultado);
    // No resetear currentPage aquí, se hace en el useEffect cuando cambian los filtros
  };

  const limpiarFiltros = () => {
    setFiltroCategoria('');
    setFiltroMarca('');
    setFiltroActivo('');
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Está seguro de eliminar el producto "${nombre}"?`)) {
      return;
    }

    try {
      await eliminarProducto(id);
      toast.success('Producto eliminado exitosamente');
      cargarProductos();
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleToggleActivo = async (id: string, activo: boolean) => {
    try {
      const nuevoEstado = !activo;
      await toggleActivoProducto(id, nuevoEstado);
      
      // Actualizar localmente sin recargar
      setProductos(prev => prev.map(p => 
        p.id === id ? { ...p, activo: nuevoEstado } : p
      ));
      setFilteredProductos(prev => prev.map(p => 
        p.id === id ? { ...p, activo: nuevoEstado } : p
      ));
      
      toast.success(`Producto ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`);
    } catch (err) {
      console.error('Error al cambiar estado del producto:', err);
      toast.error('Error al cambiar el estado del producto');
    }
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProductos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Definición de columnas para la tabla
  const columns: TableColumn<ProductoTienda>[] = [
    {
      key: 'imagen',
      label: 'Imagen',
      render: (producto) => {
        const primeraImagen = producto.imagenes && producto.imagenes.length > 0 
          ? producto.imagenes[0] 
          : null;
        
        return primeraImagen ? (
          <div className="relative">
            <img
              src={primeraImagen}
              alt={producto.nombre}
              className="w-16 h-16 object-cover rounded-lg"
            />
            {producto.imagenes && producto.imagenes.length > 1 && (
              <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${
                theme === 'light' ? 'bg-yellow-500 text-white' : 'bg-yellow-400 text-black'
              }`}>
                +{producto.imagenes.length - 1}
              </span>
            )}
          </div>
        ) : (
          <div className={`w-16 h-16 flex items-center justify-center rounded-lg ${
            theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'
          }`}>
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        );
      },
      isMobileImage: true, // Marcar como imagen para móvil
    },
    {
      key: 'nombre',
      label: 'Nombre',
      render: (producto) => (
        <span className={`font-medium ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          {producto.nombre}
        </span>
      ),
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (producto) => (
        <div className={`max-w-xs truncate ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
        }`} title={producto.descripcion || '-'}>
          {producto.descripcion || '-'}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'precio',
      label: 'Precio',
      render: (producto) => (
        <span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>
          {producto.precio ? `$${producto.precio.toLocaleString()}` : '-'}
        </span>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (producto) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {producto.stock ?? '-'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'tiempo_garantia',
      label: 'Garantía',
      render: (producto) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {producto.tiempo_garantia || '-'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (producto) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          producto.activo
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {producto.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  // Definición de acciones para cada fila
  const getActions = (producto: ProductoTienda): TableAction<ProductoTienda>[] => [
    {
      icon: <Power className="w-4 h-4" />,
      title: producto.activo ? 'Desactivar' : 'Activar',
      className: `p-2 rounded-lg transition-colors ${
        producto.activo
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
      }`,
      onClick: (producto, event) => {
        event.stopPropagation();
        handleToggleActivo(producto.id, producto.activo ?? false);
      },
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      title: 'Eliminar producto',
      className: 'p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
      onClick: (producto, event) => {
        event.stopPropagation();
        handleDelete(producto.id, producto.nombre);
      },
    },
  ];

  const handleRowClick = (producto: ProductoTienda) => {
    setSelectedProducto(producto);
    setIsModalOpen(true);
  };

  const exportarCSV = () => {
    try {
      // Usar filteredProductos en lugar de productos para respetar los filtros
      const productosAExportar = filteredProductos;

      if (productosAExportar.length === 0) {
        toast.error('No hay productos para exportar');
        return;
      }

      // Crear encabezados CSV
      const headers = [
        'ID',
        'Nombre',
        'Descripción',
        'Precio',
        'Stock',
        'Tiempo Garantía',
        'SKU',
        'Categoría ID',
        'Marca ID',
        'Estado',
        'Fecha Creación'
      ];

      // Crear filas CSV
      const rows = productosAExportar.map(producto => [
        producto.id,
        `"${(producto.nombre || '').replace(/"/g, '""')}"`,
        `"${(producto.descripcion || '').replace(/"/g, '""')}"`,
        producto.precio || '',
        producto.stock ?? '',
        producto.tiempo_garantia || '',
        '', // SKU no existe en el tipo ProductoTienda
        producto.categoria_id || '',
        producto.marca_id || '',
        producto.activo ? 'Activo' : 'Inactivo',
        producto.created_at ? new Date(producto.created_at).toLocaleString('es-CO') : ''
      ]);

      // Crear contenido CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `productos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${productosAExportar.length} productos exportados exitosamente`);
    } catch (err) {
      console.error('Error al exportar CSV:', err);
      toast.error('Error al exportar los productos');
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
            Productos
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Gestiona los productos de la landing page
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
              placeholder="Buscar productos..."
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
            } ${(filtroCategoria || filtroMarca || filtroActivo) ? 'ring-2 ring-yellow-500' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {(filtroCategoria || filtroMarca || filtroActivo) && (
              <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                {[filtroCategoria, filtroMarca, filtroActivo].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Botón crear */}
          <button
            onClick={() => {
              setSelectedProducto(null);
              setIsModalOpen(true);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              theme === 'light'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>

          {/* Botón exportar CSV */}
          <button
            onClick={exportarCSV}
            disabled={filteredProductos.length === 0}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'light'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title="Exportar productos filtrados a CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por categoría */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Categoría
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {/* Filtro por marca */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Marca
              </label>
              <select
                value={filtroMarca}
                onChange={(e) => setFiltroMarca(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              >
                <option value="">Todas las marcas</option>
                {marcas.map(marca => (
                  <option key={marca.id} value={marca.id}>{marca.nombre}</option>
                ))}
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Estado
              </label>
              <select
                value={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.value)}
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
          </div>
        </div>
      )}

      {/* Resultados y paginación */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredProductos.length)} de {filteredProductos.length} productos
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
        emptyMessage="No se encontraron productos"
        mobileImageLayout={true}
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
      <ProductoTiendaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProducto(null);
        }}
        onSuccess={(productoGuardado) => {
          // Actualizar el estado local sin recargar toda la página
          if (productoGuardado) {
            if (selectedProducto) {
              // Actualizar producto existente en el estado
              setProductos(prev => prev.map(p => 
                p.id === productoGuardado.id ? productoGuardado : p
              ));
              setFilteredProductos(prev => prev.map(p => 
                p.id === productoGuardado.id ? productoGuardado : p
              ));
            } else {
              // Agregar nuevo producto al estado
              setProductos(prev => [productoGuardado, ...prev]);
              setFilteredProductos(prev => [productoGuardado, ...prev]);
            }
          }
          setSelectedProducto(null);
        }}
        producto={selectedProducto}
      />
    </div>
  );
}
