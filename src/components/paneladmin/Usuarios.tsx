"use client";

import React, { useState, useEffect } from 'react';
import { UserCog, Search, Loader2, Plus, Trash2, Power, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { Usuario, UserRole } from '@/types/database.types';
import {
  obtenerTodosLosUsuarios,
  toggleActivoUsuario,
  eliminarUsuario,
} from '@/lib/services/usuarioService';
import UsuarioModal from './UsuarioModal';
import ResponsiveTable, { TableColumn, TableAction } from './ResponsiveTable';

export default function Usuarios() {
  const { theme } = useTheme();
  const toast = useToast();
  
  // Estados de datos
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [searchQuery, filterRole, usuarios]);

  const cargarUsuarios = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerTodosLosUsuarios();
      setUsuarios(data);
      setFilteredUsuarios(data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      toast.error('Error al cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...usuarios];

    // Filtrar por búsqueda
      if (searchQuery.trim()) {
        resultado = resultado.filter(
          (usuario) =>
            usuario.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            usuario.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

    // Filtrar por rol
    if (filterRole !== 'all') {
      resultado = resultado.filter((usuario) => usuario.rol === filterRole);
    }

    setFilteredUsuarios(resultado);
    setCurrentPage(1); // Reset a primera página al filtrar
  };

  const handleToggleActivo = async (usuario: Usuario) => {
    try {
      await toggleActivoUsuario(usuario.id, !usuario.activo);
      toast.success(`Usuario ${!usuario.activo ? 'activado' : 'desactivado'} exitosamente`);
      cargarUsuarios();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      toast.error('Error al cambiar el estado del usuario');
    }
  };

  const handleDeleteClick = (usuario: Usuario, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setUsuarioToDelete(usuario);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!usuarioToDelete) return;

    try {
      await eliminarUsuario(usuarioToDelete.id);
      toast.success('Usuario eliminado exitosamente');
      cargarUsuarios();
      setShowDeleteModal(false);
      setUsuarioToDelete(null);
    } catch (err: any) {
      console.error('Error al eliminar usuario:', err);
      toast.error(err.message || 'Error al eliminar el usuario');
    }
  };

  const getRoleLabel = (rol: UserRole) => {
    const labels: Record<UserRole, string> = {
      tecnico: 'Técnico',
      admin: 'Administrador',
      'super-admin': 'Super Admin',
    };
    return labels[rol];
  };

  const getRoleColor = (rol: UserRole) => {
    const colors: Record<UserRole, string> = {
      tecnico: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30',
      admin:
        'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30',
      'super-admin':
        'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30',
    };
    return colors[rol];
  };

  // Definición de columnas para la tabla
  const columns: TableColumn<Usuario>[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (usuario) => (
        <span className={`font-medium ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          {usuario.nombre}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (usuario) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {usuario.email}
        </span>
      ),
    },
    {
      key: 'rol',
      label: 'Rol',
      render: (usuario) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(usuario.rol)}`}>
          {getRoleLabel(usuario.rol)}
        </span>
      ),
    },
    {
      key: 'sede',
      label: 'Sede',
      render: (usuario) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {usuario.sede || '-'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (usuario) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
          usuario.activo
            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-500/30'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-gray-500/30'
        }`}>
          {usuario.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  // Definición de acciones para cada fila - renderizamos dinámicamente el botón de activar/desactivar
  const getActions = (usuario: Usuario): TableAction<Usuario>[] => [
    {
      icon: <Power className="w-4 h-4" />,
      title: usuario.activo ? 'Desactivar' : 'Activar',
      className: `p-2 rounded-lg transition-colors ${
        usuario.activo
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
      }`,
      onClick: (usuario, event) => {
        event.stopPropagation();
        handleToggleActivo(usuario);
      },
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      title: 'Eliminar usuario',
      className: 'p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
      onClick: (usuario, event) => {
        handleDeleteClick(usuario, event);
      },
    },
  ];

  const handleRowClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsModalOpen(true);
  };

  // Cálculos de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsuarios.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);

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
            Usuarios
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Administra usuarios y permisos del sistema
          </p>
        </div>

        {/* Botón crear */}
        <button
          onClick={() => {
            setSelectedUsuario(null);
            setIsModalOpen(true);
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
            theme === 'light'
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
              : 'bg-yellow-400 hover:bg-yellow-500 text-black'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Búsqueda */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            theme === 'light' ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              theme === 'light'
                ? 'border-gray-300 bg-white text-gray-900'
                : 'border-gray-600 bg-gray-700 text-gray-100'
            }`}
          />
        </div>

        {/* Filtro por Rol */}
        <div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              theme === 'light'
                ? 'border-gray-300 bg-white text-gray-900'
                : 'border-gray-600 bg-gray-700 text-gray-100'
            }`}
          >
            <option value="all">Todos los roles</option>
            <option value="tecnico">Técnico</option>
            <option value="admin">Administrador</option>
            <option value="super-admin">Super Admin</option>
          </select>
        </div>
      </div>

      {/* Resultados y paginación */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredUsuarios.length)} de {filteredUsuarios.length} usuarios
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
        emptyMessage="No se encontraron usuarios"
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

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && usuarioToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={`relative w-full max-w-md rounded-lg shadow-xl ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-6 border-b ${
                theme === 'light' ? 'border-gray-200' : 'border-gray-700'
              }`}
            >
              <h2
                className={`text-xl font-semibold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}
              >
                Confirmar eliminación
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUsuarioToDelete(null);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'hover:bg-gray-100 text-gray-500'
                    : 'hover:bg-gray-700 text-gray-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className={`text-sm mb-4 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                ¿Está seguro que desea eliminar al usuario{' '}
                <span className="font-semibold">{usuarioToDelete.nombre}</span>?
              </p>
              <p className={`text-xs mb-6 ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema.
              </p>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUsuarioToDelete(null);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUsuario(null);
        }}
        onSuccess={() => {
          cargarUsuarios();
          setIsModalOpen(false);
          setSelectedUsuario(null);
        }}
        usuario={selectedUsuario}
      />
    </div>
  );
}
