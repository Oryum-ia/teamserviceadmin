"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { Cliente } from '@/types/database.types';
import { crearEquipo } from '@/lib/services/equipoService';
import { obtenerTodosLosClientes } from '@/lib/services/clienteService';
import { obtenerTodosLosModelos } from '@/lib/services/modeloService';
import SearchableSelect from './SearchableSelect';
import ClienteModal from '../ClienteModal';
import ModeloModal from './ModeloModal';
import { useToast } from '@/contexts/ToastContext';

interface EquipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (equipo: any) => void;
  clientes: Cliente[];
  onClientesChange: () => void;
  equipoEditar?: any | null;
}

export default function EquipoModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  clientes,
  onClientesChange,
  equipoEditar
}: EquipoModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showModeloModal, setShowModeloModal] = useState(false);
  const [modelos, setModelos] = useState<Array<any>>([]);

  // Form state
  const [formData, setFormData] = useState({
    cliente_id: '',
    modelo_id: '',
    serie_pieza: '',
    fecha_compra: '',
    descripcion: '',
    soporte_garantia: 'factura',
    estado: 'Habilitado',
    comentarios: ''
  });

  // Cargar modelos al abrir
  useEffect(() => {
    if (isOpen) {
      cargarModelos();
      if (equipoEditar) {
        setFormData({
          cliente_id: equipoEditar.cliente_id || '',
          modelo_id: equipoEditar.modelo_id || '',
          serie_pieza: equipoEditar.serie_pieza || '',
          fecha_compra: equipoEditar.fecha_compra || '',
          descripcion: equipoEditar.descripcion || '',
          soporte_garantia: equipoEditar.soporte_garantia || 'factura',
          estado: equipoEditar.estado || 'Habilitado',
          comentarios: equipoEditar.comentarios || ''
        });
      } else {
        setFormData({
          cliente_id: '',
          modelo_id: '',
          serie_pieza: '',
          fecha_compra: '',
          descripcion: '',
          soporte_garantia: 'factura',
          estado: 'Habilitado',
          comentarios: ''
        });
      }
      setError('');
      setShowClienteModal(false);
      setShowModeloModal(false);
    } else {
      setShowClienteModal(false);
      setShowModeloModal(false);
    }
  }, [isOpen, equipoEditar]);

  const cargarModelos = async () => {
    try {
      const data = await obtenerTodosLosModelos();
      console.log('✅ Modelos cargados en EquipoModal:', data);
      setModelos(data || []);
    } catch (err) {
      console.error('❌ Error al cargar modelos:', err);
      toast.error('Error al cargar modelos');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones
      if (!formData.cliente_id) {
        setError('Debe seleccionar un cliente');
        setIsLoading(false);
        return;
      }

      if (!formData.serie_pieza) {
        setError('La serie/pieza es requerida');
        setIsLoading(false);
        return;
      }

      let equipoResult;
      if (equipoEditar?.id) {
        // Editar
        const payload: any = {
          cliente_id: formData.cliente_id,
          modelo_id: formData.modelo_id || null,
          serie_pieza: formData.serie_pieza,
          fecha_compra: formData.fecha_compra || null,
          descripcion: formData.descripcion || null,
          soporte_garantia: formData.soporte_garantia,
          estado: formData.estado,
          comentarios: formData.comentarios || null
        };
        const { actualizarEquipo } = await import('@/lib/services/equipoService');
        equipoResult = await actualizarEquipo(equipoEditar.id, payload);
        toast.success('Equipo actualizado exitosamente');
      } else {
        // Crear
        equipoResult = await crearEquipo({
          cliente_id: formData.cliente_id,
          modelo_id: formData.modelo_id || undefined,
          serie_pieza: formData.serie_pieza,
          fecha_compra: formData.fecha_compra || undefined,
          descripcion: formData.descripcion || undefined,
          soporte_garantia: formData.soporte_garantia,
          estado: formData.estado,
          comentarios: formData.comentarios || undefined
        });
        toast.success('Equipo creado exitosamente');
      }

      // Llamar onSuccess con el equipo resultante
      onSuccess(equipoResult);
      onClose();
    } catch (err) {
      console.error('Error al crear equipo:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al crear el equipo';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
        <div className={`relative w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}>
            <h2 className={`text-xl font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              {equipoEditar?.id ? 'Editar Equipo' : 'Crear Nuevo Equipo'}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light'
                  ? 'hover:bg-gray-100 text-gray-500'
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Error message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Cliente */}
              <SearchableSelect
                value={formData.cliente_id}
                onChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}
                options={clientes.map(c => ({
                  id: c.id,
                  label: `${c.identificacion} - ${c.es_juridica ? c.razon_social : c.nombre_comercial}`,
                  searchText: `${c.identificacion} ${c.razon_social || ''} ${c.nombre_comercial || ''}`
                }))}
                placeholder="Buscar por cédula o nombre"
                label="Cliente"
                required
                onCreateNew={() => setShowClienteModal(true)}
                createButtonText="Crear nuevo cliente"
              />

              {/* Modelo */}
              <SearchableSelect
                value={formData.modelo_id}
                onChange={(value) => setFormData(prev => ({ ...prev, modelo_id: value }))}
                options={modelos.map(m => ({
                  id: m.id,
                  label: `${m.equipo || 'Sin nombre'} - ${m.marca || ''} ${m.referencia || ''}`.trim(),
                  searchText: `${m.equipo || ''} ${m.marca || ''} ${m.referencia || ''} ${m.serial || ''}`
                }))}
                placeholder="Buscar modelo (opcional)"
                label="Modelo"
                required={false}
                onCreateNew={() => setShowModeloModal(true)}
                createButtonText="Crear nuevo modelo"
              />

              {/* Serie/Pieza */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Serie/Pieza *
                </label>
                <input
                  type="text"
                  name="serie_pieza"
                  value={formData.serie_pieza}
                  onChange={handleChange}
                  placeholder="Número de serie o identificador"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                  required
                />
              </div>

              {/* Grid: Fecha compra y Soporte garantía */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Fecha de Compra
                  </label>
                  <input
                    type="date"
                    name="fecha_compra"
                    value={formData.fecha_compra}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Soporte Garantía
                  </label>
                  <select
                    name="soporte_garantia"
                    value={formData.soporte_garantia}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                  >
                    <option value="factura">Factura</option>
                    <option value="poliza">Póliza</option>
                  </select>
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                >
                  <option value="Habilitado">Habilitado</option>
                  <option value="Deshabilitado">Deshabilitado</option>
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Descripción del Equipo
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe las características del equipo..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                />
              </div>

              {/* Comentarios */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Comentarios
                </label>
                <textarea
                  name="comentarios"
                  value={formData.comentarios}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Comentarios adicionales..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end space-x-3 p-6 border-t ${
              theme === 'light' ? 'border-gray-200' : 'border-gray-700'
            }`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{equipoEditar?.id ? 'Guardando...' : 'Creando...'}</span>
                </span>
              ) : (
                equipoEditar?.id ? 'Guardar Cambios' : 'Crear Equipo'
              )}
            </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal anidado de Cliente */}
      <ClienteModal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSuccess={() => {
          onClientesChange();
          setShowClienteModal(false);
        }}
      />

      {/* Modal anidado de Modelo */}
      <ModeloModal
        isOpen={showModeloModal}
        onClose={() => setShowModeloModal(false)}
        onSuccess={async (modeloCreado) => {
          await cargarModelos();
          setFormData(prev => ({ ...prev, modelo_id: modeloCreado.id }));
          setShowModeloModal(false);
        }}
      />
    </>
  );
}
