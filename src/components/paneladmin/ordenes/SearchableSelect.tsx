"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string; searchText: string }>;
  placeholder: string;
  label: string;
  required?: boolean;
  onCreateNew: () => void;
  createButtonText: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  required = false,
  onCreateNew,
  createButtonText
}: SearchableSelectProps) {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
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

  // Actualizar label cuando cambia el value
  useEffect(() => {
    const selected = options.find(opt => opt.id === value);
    setSelectedLabel(selected ? selected.label : '');
  }, [value, options]);

  const handleSelect = (optionId: string, optionLabel: string) => {
    onChange(optionId);
    setSelectedLabel(optionLabel);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className={`block text-sm font-medium mb-1 ${
        theme === 'light' ? 'text-gray-700' : 'text-gray-300'
      }`}>
        {label} {required && '*'}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : selectedLabel}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
            theme === 'light'
              ? 'border-gray-300 bg-white text-gray-900'
              : 'border-gray-600 bg-gray-700 text-gray-100'
          }`}
          required={required}
        />
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
          theme === 'light' ? 'text-gray-400' : 'text-gray-500'
        }`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-lg border shadow-lg ${
          theme === 'light'
            ? 'bg-white border-gray-300'
            : 'bg-gray-700 border-gray-600'
        }`}>
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
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id, option.label)}
                className={`w-full px-3 py-2 text-left transition-colors ${
                  theme === 'light'
                    ? 'hover:bg-gray-100 text-gray-900'
                    : 'hover:bg-gray-600 text-gray-100'
                } ${value === option.id ? (theme === 'light' ? 'bg-yellow-50' : 'bg-gray-600') : ''}`}
              >
                {option.label}
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
      )}
    </div>
  );
}
