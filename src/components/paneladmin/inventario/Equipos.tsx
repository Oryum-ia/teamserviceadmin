"use client";

import React, { useEffect, useState } from 'react';
import { Search, Loader2, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { obtenerTodosLosEquipos, buscarEquipos } from '@/lib/services/equipoService';
import { obtenerTodosLosClientes } from '@/lib/services/clienteService';
import EquipoModal from '../ordenes/EquipoModal';
import ResponsiveTable, { TableColumn, TableAction } from '../ResponsiveTable';

export default function Equipos() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [equipos, setEquipos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedEquipo, setSelectedEquipo] = useState<any | null>(null);

  useEffect(() => {
    cargarEquipos();
  }, []);

  const cargarEquipos = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await obtenerTodosLosEquipos();
      setEquipos(data || []);
    } catch (err) {
      console.error('❌ Error al cargar equipos:', err);
      setError('Error al cargar equipos');
    } finally {
      setIsLoading(false);
    }
  };

  const onSearch = async (val: string) => {
    setSearchTerm(val);
    try {
      const data = await buscarEquipos(val);
      setEquipos(data || []);
    } catch (err) {
      // fallback local
      const t = val.toLowerCase();
      setEquipos(prev => prev.filter((e: any) => {
        const parts = [
          e?.serie_pieza,
          e?.modelo?.equipo,
          e?.modelo?.marca?.nombre || e?.modelo?.marca,
          e?.cliente?.identificacion,
          e?.cliente?.razon_social,
          e?.cliente?.nombre_comercial,
        ].filter(Boolean).map((s: string) => s.toLowerCase());
        return parts.some((p: string) => p.includes(t));
      }));
    }
  };

  // Definición de columnas para la tabla
  const columns: TableColumn<any>[] = [
    {
      key: 'cliente',
      label: 'Cliente',
      render: (equipo) => (
        <span className={theme === 'light' ? 'text-gray-900 font-medium' : 'text-gray-100 font-medium'}>
          {equipo?.cliente?.es_juridica 
            ? (equipo?.cliente?.razon_social || '-') 
            : (equipo?.cliente?.nombre_comercial || '-')}
        </span>
      ),
    },
    {
      key: 'identificacion',
      label: 'Identificación',
      render: (equipo) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {equipo?.cliente?.identificacion || '-'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'equipo',
      label: 'Equipo',
      render: (equipo) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {equipo?.modelo?.equipo || '-'}
        </span>
      ),
    },
    {
      key: 'marca',
      label: 'Marca',
      render: (equipo) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {equipo?.modelo?.marca?.nombre || equipo?.modelo?.marca || '-'}
        </span>
      ),
    },
    {
      key: 'referencia',
      label: 'Referencia',
      render: (equipo) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {equipo?.modelo?.referencia || '-'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'serie',
      label: 'Serie/Pieza',
      render: (equipo) => (
        <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
          {equipo?.serie_pieza || '-'}
        </span>
      ),
    },
  ];

  // Definición de acciones para cada fila
  const actions: TableAction<any>[] = [
    {
      icon: <Trash2 className="w-4 h-4" />,
      title: 'Eliminar',
      className: 'p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
      onClick: async (equipo, event) => {
        event.stopPropagation();
        if (!confirm('¿Desactivar este equipo?')) return;
        const { desactivarEquipo } = await import('@/lib/services/equipoService');
        await desactivarEquipo(equipo.id);
        await cargarEquipos();
      },
    },
  ];

  const handleRowClick = async (equipo: any) => {
    try {
      const data = await obtenerTodosLosClientes();
      setClientes(data || []);
    } catch {}
    setSelectedEquipo(equipo);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header con búsqueda */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Equipos
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Listado de equipos y búsqueda por cliente/equipo
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
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar por cliente o equipo..."
              className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>

          {/* Botón crear */}
          <button
            onClick={async () => {
              // Cargar clientes antes de abrir
              try {
                const data = await obtenerTodosLosClientes();
                setClientes(data || []);
              } catch {}
              setIsModalOpen(true);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              theme === 'light'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Equipo</span>
          </button>
        </div>
      </div>

      {error && (
        <div className={`mb-3 px-4 py-3 rounded-lg text-sm ${theme === 'light' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-900/20 text-red-300 border border-red-800'}`}>
          {error}
        </div>
      )}

      {/* Tabla responsive */}
      <ResponsiveTable
        data={equipos}
        columns={columns}
        actions={actions}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        emptyMessage="No se encontraron equipos"
      />

      {/* Modal Crear Equipo */}
      <EquipoModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedEquipo(null); }}
        onSuccess={async () => {
          await cargarEquipos();
          setIsModalOpen(false);
          setSelectedEquipo(null);
        }}
        clientes={clientes}
        onClientesChange={async () => {
          try { setClientes(await obtenerTodosLosClientes()); } catch {}
        }}
        equipoEditar={selectedEquipo}
      />
    </div>
  );
}
