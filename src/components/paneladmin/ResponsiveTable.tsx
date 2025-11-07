"use client";

import React, { ReactNode, useEffect } from 'react';
import { useTheme } from '../ThemeProvider';
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime';

export interface TableColumn<T = any> {
  /** Identificador único de la columna */
  key: string;
  /** Título que se muestra en el header */
  label: string;
  /** Función para renderizar el contenido de la celda */
  render: (item: T) => ReactNode;
  /** Ocultar en móvil (opcional) */
  hideOnMobile?: boolean;
  /** Alineación del contenido (opcional, default: 'left') */
  align?: 'left' | 'center' | 'right';
  /** Clase CSS adicional para el header (opcional) */
  headerClassName?: string;
  /** Clase CSS adicional para la celda (opcional) */
  cellClassName?: string;
  /** Marcar esta columna como imagen para mostrar a la izquierda en móvil (opcional) */
  isMobileImage?: boolean;
}

export interface TableAction<T = any> {
  /** Ícono del botón de acción */
  icon: ReactNode;
  /** Función que se ejecuta al hacer click */
  onClick: (item: T, event: React.MouseEvent) => void;
  /** Título del botón (tooltip) */
  title: string;
  /** Clase CSS adicional (opcional) */
  className?: string;
  /** Mostrar solo en hover (opcional) */
  showOnHover?: boolean;
}

interface ResponsiveTableProps<T = any> {
  /** Array de datos a mostrar (solo si no se usa realtime) */
  data?: T[];
  /** Definición de las columnas */
  columns: TableColumn<T>[];
  /** Acciones disponibles para cada fila (opcional) - puede ser array o función que retorna array */
  actions?: TableAction<T>[] | ((item: T) => TableAction<T>[]);
  /** Función que se ejecuta al hacer click en una fila (opcional) */
  onRowClick?: (item: T) => void;
  /** Mensaje cuando no hay datos (opcional) */
  emptyMessage?: string;
  /** Clave única para cada item (default: 'id') */
  keyExtractor?: (item: T) => string;
  /** Mostrar loading (opcional) */
  isLoading?: boolean;
  /** Clase CSS adicional para el contenedor (opcional) */
  className?: string;
  /** Mostrar imagen a la izquierda en móvil (opcional, default: false) */
  mobileImageLayout?: boolean;
  /** Configuración de Realtime (opcional) */
  realtime?: {
    /** Nombre de la tabla en Supabase */
    table: string;
    /** Función para obtener los datos iniciales */
    fetchData: () => Promise<T[]>;
    /** Habilitar/deshabilitar realtime (default: true) */
    enabled?: boolean;
    /** Callback cuando se inserta un nuevo registro */
    onInsert?: (newItem: T) => void;
    /** Callback cuando se actualiza un registro */
    onUpdate?: (updatedItem: T) => void;
    /** Callback cuando se elimina un registro */
    onDelete?: (deletedId: string) => void;
  };
}

export default function ResponsiveTable<T = any>({
  data: externalData,
  columns,
  actions,
  onRowClick,
  emptyMessage = 'No se encontraron resultados',
  keyExtractor = (item: any) => item.id,
  isLoading: externalLoading = false,
  className = '',
  mobileImageLayout = false,
  realtime,
}: ResponsiveTableProps<T>) {
  const { theme } = useTheme();

  // Usar Realtime si está configurado
  const realtimeResult = realtime
    ? useSupabaseRealtime({
        table: realtime.table,
        fetchData: realtime.fetchData,
        keyExtractor,
        enabled: realtime.enabled ?? true,
        onInsert: realtime.onInsert,
        onUpdate: realtime.onUpdate,
        onDelete: realtime.onDelete,
      })
    : null;

  // Determinar qué datos y estado de loading usar
  const data = realtime ? realtimeResult!.data : (externalData || []);
  const isLoading = realtime ? realtimeResult!.isLoading : externalLoading;

  // Helper para obtener las acciones de un item (puede ser array estático o función)
  const getItemActions = (item: T): TableAction<T>[] => {
    if (!actions) return [];
    return typeof actions === 'function' ? actions(item) : actions;
  };

  // Verificar si hay acciones
  const hasActions = actions && (typeof actions === 'function' || actions.length > 0);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={`text-center py-12 rounded-lg border-2 border-dashed ${
          theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-800'
        } ${className}`}
      >
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Vista Desktop - Tabla tradicional */}
      <div className={`hidden lg:block overflow-x-auto ${className}`}>
        <table
          className={`w-full rounded-lg overflow-hidden ${
            theme === 'light' ? 'bg-white' : 'bg-gray-800'
          }`}
        >
          <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-${column.align || 'left'} text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  } ${column.headerClassName || ''}`}
                >
                  {column.label}
                </th>
              ))}
              {hasActions && (
                <th
                  className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}
                >
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
            }`}
          >
            {data.map((item) => {
              const itemActions = getItemActions(item);
              return (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'}`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-${column.align || 'left'} ${
                        column.cellClassName || ''
                      }`}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                  {hasActions && (
                    <td
                      className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {itemActions.map((action, index) => (
                          <button
                            key={index}
                            onClick={(e) => action.onClick(item, e)}
                            className={action.className || 'p-2 rounded-lg transition-colors'}
                            title={action.title}
                          >
                            {action.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista Mobile - Cards */}
      <div className="lg:hidden space-y-4">
        {data.map((item) => {
          const itemActions = getItemActions(item);
          const imageColumn = mobileImageLayout ? columns.find(col => col.isMobileImage) : null;
          const dataColumns = columns.filter((col) => !col.hideOnMobile && !col.isMobileImage);
          
          return (
            <div
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`rounded-lg border p-4 ${
                onRowClick ? 'cursor-pointer' : ''
              } ${
                theme === 'light'
                  ? 'bg-white border-gray-200 hover:bg-gray-50'
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
              } transition-colors`}
            >
              {/* Contenido del card con layout de imagen */}
              {mobileImageLayout && imageColumn ? (
                <div className="flex gap-4">
                  {/* Imagen a la izquierda */}
                  <div className="flex-shrink-0">
                    {imageColumn.render(item)}
                  </div>
                  
                  {/* Datos a la derecha */}
                  <div className="flex-1 space-y-3">
                    {dataColumns.map((column) => (
                      <div key={column.key} className="flex flex-col">
                        <span
                          className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          {column.label}
                        </span>
                        <div
                          className={`text-sm ${
                            theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                          }`}
                        >
                          {column.render(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Layout tradicional sin imagen */
                <div className="space-y-3">
                  {columns
                    .filter((col) => !col.hideOnMobile)
                    .map((column) => (
                      <div key={column.key} className="flex flex-col">
                        <span
                          className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          {column.label}
                        </span>
                        <div
                          className={`text-sm ${
                            theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                          }`}
                        >
                          {column.render(item)}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Acciones en mobile */}
              {hasActions && itemActions.length > 0 && (
                <div
                  className="flex items-center justify-end gap-2 mt-4 pt-4 border-t"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    borderColor: theme === 'light' ? '#e5e7eb' : '#374151',
                  }}
                >
                  {itemActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={(e) => action.onClick(item, e)}
                      className={action.className || 'p-2 rounded-lg transition-colors'}
                      title={action.title}
                    >
                      {action.icon}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
