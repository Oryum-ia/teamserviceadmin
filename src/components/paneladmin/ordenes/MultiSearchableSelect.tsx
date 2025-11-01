"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, X } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';

interface MultiSearchableSelectProps {
  value: string[];  // Array de IDs seleccionados
  onChange: (value: string[]) => void;
  options: Array<{ id: string; label: string; searchText: string }>;
  placeholder: string;
  label: string;
  required?: boolean;
  onCreateNew: () => void;
  createButtonText: string;
  tagColor?: 'yellow' | 'blue';  // Color de los tags
}

export default function MultiSearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  required = false,
  onCreateNew,
  createButtonText,
  tagColor = 'yellow'
}: MultiSearchableSelectProps) {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filtrar opciones según búsqueda
  const filteredOptions = options.filter(option =>
    option.searchText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter(id => id !== optionId));
    } else {
      onChange([...value, optionId]);
    }
  };

  const handleRemove = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(id => id !== optionId));
  };

  // Obtener labels de los seleccionados
  const selectedItems = value
    .map(id => options.find(opt => opt.id === id))
    .filter(Boolean);

  const tagColors = {
    yellow: theme === 'light' ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-900/30 text-yellow-300',
    blue: theme === 'light' ? 'bg-blue-100 text-blue-800' : 'bg-blue-900/30 text-blue-300'
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className={`block text-sm font-medium mb-1 ${
        theme === 'light' ? 'text-gray-700' : 'text-gray-300'
      }`}>
        {label} {required && '*'}
      </label>
      
      <div className="relative">
        <div
          onClick={() => setIsOpen(true)}
          className={`min-h-[42px] px-3 py-2 pr-8 border rounded-lg cursor-pointer ${
            theme === 'light'
              ? 'border-gray-300 bg-white'
              : 'border-gray-600 bg-gray-700'
          }`}
        >
          <div className="flex flex-wrap gap-1">
            {selectedItems.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              selectedItems.map((item: any) => (
                <span
                  key={item.id}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${tagColors[tagColor]}`}
                >
                  {item.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(item.id, e)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
        <ChevronDown className={`absolute right-3 top-3 w-4 h-4 pointer-events-none transition-transform ${
          isOpen ? 'rotate-180' : ''
        } ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg ${
          theme === 'light'
            ? 'bg-white border-gray-300'
            : 'bg-gray-700 border-gray-600'
        }`}>
          {/* Búsqueda */}
          <div className="p-2 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-600 text-gray-100'
              }`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Botón Crear Nuevo */}
          <button
            type="button"
            onClick={() => {
              onCreateNew();
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left flex items-center space-x-2 border-b transition-colors ${
              theme === 'light'
                ? 'hover:bg-yellow-50 text-yellow-600 border-gray-200'
                : 'hover:bg-gray-600 text-yellow-400 border-gray-600'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">{createButtonText}</span>
          </button>

          {/* Opciones filtradas */}
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleToggle(option.id)}
                  className={`w-full px-3 py-2 text-left flex items-center space-x-2 transition-colors ${
                    theme === 'light'
                      ? 'hover:bg-gray-100 text-gray-900'
                      : 'hover:bg-gray-600 text-gray-100'
                  } ${value.includes(option.id) ? (theme === 'light' ? 'bg-yellow-50' : 'bg-gray-600') : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(option.id)}
                    onChange={() => {}}
                    className="rounded text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-sm">{option.label}</span>
                </button>
              ))
            ) : (
              <div className={`px-3 py-2 text-sm ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
