"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Paperclip } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { Cliente } from '@/types/database.types';
import { crearOrden } from '@/lib/services/ordenService';
import { obtenerTodosLosClientes } from '@/lib/services/clienteService';
import { obtenerTodosLosEquipos, obtenerEquipoPorId } from '@/lib/services/equipoService';
import { obtenerTodosLosModelos } from '@/lib/services/modeloService';
import SearchableSelect from './SearchableSelect';
import ClienteModal from '../ClienteModal';
import EquipoModal from './EquipoModal';
import ModeloModal from './ModeloModal';
import { useToast } from '@/contexts/ToastContext';

interface OrdenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrdenModal({ isOpen, onClose, onSuccess }: OrdenModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClientes, setIsLoadingClientes] = useState(true);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modelos, setModelos] = useState<Array<any>>([]);
  const [equipos, setEquipos] = useState<Array<any>>([]);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showModeloModal, setShowModeloModal] = useState(false);
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [prefilledClienteData, setPrefilledClienteData] = useState<{identificacion?: string; nombre?: string}>({});
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    equipo_id: '',
    cliente_id: '',
    codigo_qr: '',
    modelo: '',
    serie_pieza: '',
    tipo: '',
    tipo_orden: 'Reparación',
    descripcion_problema: ''
  });

  // Cargar clientes, modelos y equipos
  useEffect(() => {
    if (isOpen) {
      cargarClientes();
      cargarModelos();
      cargarEquipos();
    }
  }, [isOpen]);

  const cargarClientes = async () => {
    setIsLoadingClientes(true);
    try {
      const data = await obtenerTodosLosClientes();
      setClientes(data);
    } catch (err) {
      console.error('❌ Error al cargar clientes:', err);
      setError('Error al cargar la lista de clientes');
    } finally {
      setIsLoadingClientes(false);
    }
  };

  const cargarModelos = async () => {
    try {
      const data = await obtenerTodosLosModelos();
      console.log('✅ Modelos cargados en OrdenModal:', data);
      setModelos(data || []);
    } catch (err) {
      console.error('❌ Error al cargar modelos:', err);
      toast.error('Error al cargar modelos');
    }
  };

  const cargarEquipos = async () => {
    try {
      const data = await obtenerTodosLosEquipos();
      setEquipos(data);
    } catch (err) {
      console.error('❌ Error al cargar equipos:', err);
    }
  };

  // Manejar selección de equipo y precargar datos
  const handleEquipoChange = async (equipoId: string) => {
    setFormData(prev => ({ ...prev, equipo_id: equipoId }));

    if (!equipoId) return;

    try {
      const { equipo, ultimaOrden } = await obtenerEquipoPorId(equipoId);
      
      // Precargar datos del equipo
      setFormData(prev => ({
        ...prev,
        equipo_id: equipoId,
        cliente_id: equipo.cliente_id || '',
        modelo: equipo.modelo_id || '',  // Usar el ID del modelo, no el nombre
        serie_pieza: equipo.serie_pieza || '',
        tipo: equipo.modelo?.equipo || '',
        // Si hay orden previa, cargar algunos datos (excepto comentarios ni código)
        tipo_orden: ultimaOrden?.tipo_orden || prev.tipo_orden
      }));

      console.log('✅ Datos precargados desde equipo:', equipo);
      console.log('🔍 Modelo ID precargado:', equipo.modelo_id);
      if (ultimaOrden) {
        console.log('📋 Orden previa encontrada:', ultimaOrden.codigo);
      }
    } catch (err) {
      console.error('❌ Error al cargar datos del equipo:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    try {
      // Mostrar nombre del archivo
      setUploadedFileName(file.name);
      
      // TODO: Aquí deberías implementar la lógica para:
      // 1. Subir la imagen a Supabase Storage
      // 2. Procesar el QR con una librería como jsQR
      // 3. Extraer el código y actualizar formData.codigo_qr
      
      toast.info('Procesando código QR...');
      console.log('📷 Imagen seleccionada:', file.name);
      
      // Placeholder: Por ahora solo mostramos el nombre del archivo
      // Cuando implementes el lector de QR, reemplaza esto con el código extraído
      // setFormData(prev => ({ ...prev, codigo_qr: 'Código_Extraído' }));
    } catch (err) {
      console.error('Error al procesar imagen:', err);
      toast.error('Error al procesar la imagen');
      setUploadedFileName('');
    }
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

      // Validación de tipo_orden opcional

      await crearOrden(formData);
      toast.success('Orden creada exitosamente');

      // Reset form
      setFormData({
        equipo_id: '',
        cliente_id: '',
        codigo_qr: '',
        modelo: '',
        serie_pieza: '',
        tipo: '',
        tipo_orden: 'Reparación',
        descripcion_problema: ''
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al crear orden:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al crear la orden';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
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
            Nueva Orden de Servicio
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

            {/* Equipo - PRIMERO para precargar datos */}
            <SearchableSelect
              value={formData.equipo_id}
              onChange={handleEquipoChange}
              options={equipos.map(e => ({
                id: e.id,
                label: `${e.serie_pieza || 'Sin serie'} - ${e.modelo?.equipo || 'Sin modelo'} - ${e.cliente?.identificacion || 'Sin cliente'}`,
                searchText: `${e.serie_pieza || ''} ${e.modelo?.equipo || ''} ${e.modelo?.marca || ''} ${e.cliente?.identificacion || ''} ${e.cliente?.nombre_comercial || ''}`
              }))}
              placeholder="Buscar equipo por serie, modelo o cliente"
              label="Equipo"
              required={false}
              onCreateNew={() => setShowEquipoModal(true)}
              createButtonText="Crear nuevo equipo"
            />

            {/* Cliente */}
            {isLoadingClientes ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cargando clientes...</span>
              </div>
            ) : (
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
                onCreateNew={() => {
                  // Detectar si es número o texto para precargar
                  const input = '';
                  setPrefilledClienteData({});
                  setShowClienteModal(true);
                }}
                createButtonText="Crear nuevo cliente"
              />
            )}

            {/* Código QR */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Escanear código QR
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="codigo_qr"
                  value={uploadedFileName || formData.codigo_qr}
                  onChange={handleChange}
                  onClick={() => fileInputRef.current?.click()}
                  placeholder="Click para subir imagen o escanear QR"
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                  readOnly
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors pointer-events-none ${
                    theme === 'light'
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}
                  title="Subir imagen de código QR"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid de Modelo y Serie/Pieza */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchableSelect
                value={formData.modelo}
                onChange={(value) => setFormData(prev => ({ ...prev, modelo: value }))}
                options={modelos.map(m => ({
                  id: m.id,
                  label: `${m.equipo || 'Sin nombre'} - ${m.marca || ''} ${m.referencia || ''}`.trim(),
                  searchText: `${m.equipo || ''} ${m.marca || ''} ${m.referencia || ''} ${m.serial || ''}`
                }))}
                placeholder="Buscar modelo"
                label="Modelo"
                required
                onCreateNew={() => setShowModeloModal(true)}
                createButtonText="Crear nuevo modelo"
              />

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
                  placeholder="Número de serie o pieza"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Tipo *
              </label>
              <input
                type="text"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                placeholder="Tipo de equipo"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
                required
              />
            </div>

            {/* Descripción del problema */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Descripción del Problema
              </label>
              <textarea
                name="descripcion_problema"
                value={formData.descripcion_problema}
                onChange={handleChange}
                rows={4}
                placeholder="Describa el problema reportado por el cliente..."
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
                  <span>Creando...</span>
                </span>
              ) : (
                'Crear Orden'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Crear Cliente */}
      <ClienteModal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSuccess={() => {
          cargarClientes();
          setShowClienteModal(false);
        }}
      />

      {/* Modal de Crear Equipo */}
      <EquipoModal
        isOpen={showEquipoModal}
        onClose={() => setShowEquipoModal(false)}
        clientes={clientes}
        onClientesChange={cargarClientes}
        onSuccess={async (equipoCreado) => {
          // Recargar equipos
          await cargarEquipos();
          // Seleccionar el equipo recién creado y precargar datos
          await handleEquipoChange(equipoCreado.id);
          setShowEquipoModal(false);
        }}
      />

      {/* Modal de Crear Modelo */}
      <ModeloModal
        isOpen={showModeloModal}
        onClose={() => setShowModeloModal(false)}
        onSuccess={async (modeloCreado) => {
          await cargarModelos();
          setFormData(prev => ({ ...prev, modelo: modeloCreado.id }));
          setShowModeloModal(false);
        }}
      />
    </div>
  );
}
