"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { Cliente } from '@/types/database.types';
import { crearOrden } from '@/lib/services/ordenService';
import { obtenerTodosLosClientes } from '@/lib/services/clienteService';
import { obtenerTodosLosModelos } from '@/lib/services/modeloService';
import { notificarOrdenCreadaWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';
import SearchableSelect from './SearchableSelect';
import ClienteModal from '../ClienteModal';
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
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showModeloModal, setShowModeloModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    cliente_id: '',
    codigo_qr: '',
    modelo: '',
    serie_pieza: '',

    tipo_orden: 'Reparación',
    descripcion_problema: '',
    es_retrabajo: false
  });
  
  // Estado para el valor de revisión del modelo seleccionado
  const [valorRevision, setValorRevision] = useState(0);
  const [valorRevisionInput, setValorRevisionInput] = useState('');
  const [editandoValorRevision, setEditandoValorRevision] = useState(false);

  // Cargar clientes y modelos
  useEffect(() => {
    if (isOpen) {
      cargarClientes();
      cargarModelos();
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

      // Validación de tipo_orden opcional

      // Pre-abrir WhatsApp para evitar bloqueo del navegador
      let whatsappPopup: Window | null = null;
      try {
        whatsappPopup = window.open('about:blank', '_blank');
      } catch (e) {
        // seguir sin popup pre-abierto si el navegador lo impide
      }
      
      // Crear la orden con el valor de revisión
      const ordenCreada = await crearOrden({
        ...formData,
        valor_revision: valorRevision
      });
      toast.success('Orden creada exitosamente');
      
      // Enviar notificación por WhatsApp (usa la ventana pre-abierta)
      try {
        await notificarOrdenCreadaWhatsApp(ordenCreada.id, whatsappPopup);
      } catch (whatsappError) {
        console.error('⚠️ Error al abrir WhatsApp:', whatsappError);
        if (whatsappPopup) try { whatsappPopup.close(); } catch {}
        // No afecta el flujo, la orden ya fue creada
      }

      // Reset form
      setFormData({
        cliente_id: '',
        codigo_qr: '',
        modelo: '',
        serie_pieza: '',

        tipo_orden: 'Reparación',
        descripcion_problema: '',
        es_retrabajo: false
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
                onCreateNew={() => setShowClienteModal(true)}
                createButtonText="Crear nuevo cliente"
              />
            )}

            {/* Grid de Modelo y Serie/Pieza */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchableSelect
                value={formData.modelo}
                onChange={(value) => setFormData(prev => ({ ...prev, modelo: value }))}
                options={modelos.map(m => ({
                  id: m.id,
                  label: `${m.equipo || 'Sin nombre'} - ${m.marca?.nombre || m.marca || ''}`.trim(),
                  searchText: `${m.equipo || ''} ${m.marca?.nombre || m.marca || ''} ${m.referencia || ''} ${m.serial || ''}`
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

            {/* Valor de Revisión */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Valor de Revisión
              </label>
              <input
                type="text"
                value={editandoValorRevision ? valorRevisionInput : (valorRevision === 0 ? '' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valorRevision))}
                onFocus={() => {
                  setEditandoValorRevision(true);
                  setValorRevisionInput(valorRevision === 0 ? '' : valorRevision.toString());
                }}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Permitir solo números
                  const cleaned = inputValue.replace(/[^0-9]/g, '');
                  setValorRevisionInput(cleaned);
                }}
                onBlur={() => {
                  const valor = valorRevisionInput === '' ? 0 : Number(valorRevisionInput);
                  setValorRevision(valor);
                  setEditandoValorRevision(false);
                  setValorRevisionInput('');
                }}
                placeholder="$0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
              <p className={`text-xs mt-1 ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Solo se cobra si el cliente rechaza la cotización
              </p>
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

            {/* Checkbox Es Retrabajo */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="es_retrabajo"
                checked={formData.es_retrabajo}
                onChange={(e) => setFormData(prev => ({ ...prev, es_retrabajo: e.target.checked }))}
                className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
              />
              <label
                htmlFor="es_retrabajo"
                className={`ml-2 text-sm ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}
              >
                Es retrabajo (cotización sin costo)
              </label>
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
