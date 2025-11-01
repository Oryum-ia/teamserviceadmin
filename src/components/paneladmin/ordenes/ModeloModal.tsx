"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { crearModelo } from '@/lib/services/modeloService';
import { obtenerTodosLosAccesorios, obtenerAccesoriosDelModelo } from '@/lib/services/accesorioService';
import { obtenerTodosLosRepuestos, obtenerRepuestosDelModelo } from '@/lib/services/repuestoService';
import { obtenerTodasLasMarcas } from '@/lib/services/marcaService';
import { asignarAccesoriosAModelo } from '@/lib/services/accesorioService';
import { asignarRepuestosAModelo } from '@/lib/services/repuestoService';
import MultiSearchableSelect from './MultiSearchableSelect';
import SearchableSelect from './SearchableSelect';
import AccesorioModal from './AccesorioModal';
import RepuestoModal from './RepuestoModal';
import MarcaModal from './MarcaModal';
import { useToast } from '@/contexts/ToastContext';

interface ModeloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (modeloCreado: any) => void;
  modeloEditar?: any;
}

export default function ModeloModal({ isOpen, onClose, onSuccess, modeloEditar }: ModeloModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para marcas
  const [marcas, setMarcas] = useState<Array<any>>([]);
  const [showMarcaModal, setShowMarcaModal] = useState(false);

  // Estados para accesorios
  const [accesorios, setAccesorios] = useState<Array<any>>([]);
  const [accesoriosSeleccionados, setAccesoriosSeleccionados] = useState<string[]>([]);
  const [showAccesorioModal, setShowAccesorioModal] = useState(false);

  // Estados para repuestos
  const [repuestos, setRepuestos] = useState<Array<any>>([]);
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState<string[]>([]);
  const [showRepuestoModal, setShowRepuestoModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    equipo: '',
    marca_id: '',
    referencia: '',
    valor_revision: '',
    serial: ''
  });

  // Cargar marcas, accesorios y repuestos
  useEffect(() => {
    if (isOpen) {
      cargarMarcas();
      cargarAccesorios();
      cargarRepuestos();
    }
  }, [isOpen]);

  const cargarMarcas = async () => {
    try {
      const data = await obtenerTodasLasMarcas();
      console.log('✅ Marcas cargadas:', data);
      setMarcas(data || []);
    } catch (err) {
      console.error('❌ Error al cargar marcas:', err);
      toast.error('Error al cargar marcas');
    }
  };

  const cargarAccesorios = async () => {
    try {
      const data = await obtenerTodosLosAccesorios();
      setAccesorios(data || []);
    } catch (err) {
      console.error('❌ Error al cargar accesorios:', err);
    }
  };

  const cargarRepuestos = async () => {
    try {
      const data = await obtenerTodosLosRepuestos();
      setRepuestos(data || []);
    } catch (err) {
      console.error('❌ Error al cargar repuestos:', err);
    }
  };

  const cargarAccesoriosDelModelo = async (modeloId: string) => {
    try {
      const data = await obtenerAccesoriosDelModelo(modeloId);
      const accesorioIds = data.map((acc: any) => acc.id);
      setAccesoriosSeleccionados(accesorioIds);
      console.log('✅ Accesorios del modelo cargados:', accesorioIds);
    } catch (err) {
      console.error('❌ Error al cargar accesorios del modelo:', err);
    }
  };

  const cargarRepuestosDelModelo = async (modeloId: string) => {
    try {
      const data = await obtenerRepuestosDelModelo(modeloId);
      const repuestoIds = data.map((rep: any) => rep.id);
      setRepuestosSeleccionados(repuestoIds);
      console.log('✅ Repuestos del modelo cargados:', repuestoIds);
    } catch (err) {
      console.error('❌ Error al cargar repuestos del modelo:', err);
    }
  };

  // Reset form cuando se abre o cargar datos para editar
  useEffect(() => {
    if (isOpen) {
      if (modeloEditar) {
        setFormData({
          equipo: modeloEditar.equipo || '',
          marca_id: modeloEditar.marca_id || (typeof modeloEditar.marca === 'object' ? modeloEditar.marca?.id : '') || '',
          referencia: modeloEditar.referencia || '',
          valor_revision: modeloEditar.valor_revision ? modeloEditar.valor_revision.toString() : '',
          serial: modeloEditar.serial || ''
        });
        // Cargar accesorios y repuestos del modelo
        cargarAccesoriosDelModelo(modeloEditar.id);
        cargarRepuestosDelModelo(modeloEditar.id);
      } else {
        setFormData({
          equipo: '',
          marca_id: '',
          referencia: '',
          valor_revision: '',
          serial: ''
        });
        setAccesoriosSeleccionados([]);
        setRepuestosSeleccionados([]);
      }
      setError('');
    }
  }, [isOpen, modeloEditar]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones
      if (!formData.equipo.trim()) {
        setError('El nombre del equipo es requerido');
        setIsLoading(false);
        return;
      }

      if (modeloEditar) {
        // Modo edición
        const { actualizarModelo } = await import('@/lib/services/modeloService');
        const modeloActualizado = await actualizarModelo(modeloEditar.id, {
          equipo: formData.equipo,
          marca_id: formData.marca_id || undefined,
          referencia: formData.referencia || undefined,
          valor_revision: formData.valor_revision ? parseFloat(formData.valor_revision) : undefined,
          serial: formData.serial || undefined
        });

        // Actualizar accesorios y repuestos
        await asignarAccesoriosAModelo(modeloEditar.id, accesoriosSeleccionados);
        await asignarRepuestosAModelo(modeloEditar.id, repuestosSeleccionados);

        toast.success('Modelo actualizado exitosamente');
        onSuccess(modeloActualizado);
      } else {
        // Modo creación
        const modeloCreado = await crearModelo({
          equipo: formData.equipo,
          marca_id: formData.marca_id || undefined,
          referencia: formData.referencia || undefined,
          valor_revision: formData.valor_revision ? parseFloat(formData.valor_revision) : undefined,
          serial: formData.serial || undefined
        });

        // Asignar accesorios y repuestos
        if (accesoriosSeleccionados.length > 0) {
          await asignarAccesoriosAModelo(modeloCreado.id, accesoriosSeleccionados);
        }
        if (repuestosSeleccionados.length > 0) {
          await asignarRepuestosAModelo(modeloCreado.id, repuestosSeleccionados);
        }

        toast.success('Modelo creado exitosamente');
        onSuccess(modeloCreado);
      }
      onClose();
    } catch (err) {
      console.error('Error al guardar modelo:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el modelo';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
        <div className={`relative w-full max-w-md max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}>
            <h2 className={`text-xl font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              {modeloEditar ? 'Editar Modelo' : 'Crear Nuevo Modelo'}
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
            <div className="p-6 space-y-4">
              {/* Error message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Equipo */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Equipo *
                </label>
                <input
                  type="text"
                  name="equipo"
                  value={formData.equipo}
                  onChange={handleChange}
                  placeholder="Ej: Aspiradora, Lavadora"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                  required
                />
              </div>

              {/* Marca con SearchableSelect */}
              <SearchableSelect
                value={formData.marca_id}
                onChange={(value) => setFormData(prev => ({ ...prev, marca_id: value }))}
                options={marcas.map(m => ({
                  id: m.id,
                  label: `${m.nombre}${m.pais_origen ? ` (${m.pais_origen})` : ''}`,
                  searchText: `${m.nombre} ${m.pais_origen || ''} ${m.descripcion || ''}`
                }))}
                placeholder="Buscar marca..."
                label="Marca"
                required={false}
                onCreateNew={() => setShowMarcaModal(true)}
                createButtonText="Crear nueva marca"
              />

              {/* Referencia */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Referencia
                </label>
                <input
                  type="text"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  placeholder="Ej: K4"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                />
              </div>

              {/* Accesorios */}
              <MultiSearchableSelect
                value={accesoriosSeleccionados}
                onChange={setAccesoriosSeleccionados}
                options={accesorios.map(a => ({
                  id: a.id,
                  label: `${a.descripcion}${a.marca ? ` - ${a.marca}` : ''}`,
                  searchText: `${a.descripcion} ${a.marca || ''}`
                }))}
                placeholder="Seleccionar accesorios..."
                label="Accesorios"
                onCreateNew={() => setShowAccesorioModal(true)}
                createButtonText="Crear accesorio"
                tagColor="yellow"
              />

              {/* Repuestos */}
              <MultiSearchableSelect
                value={repuestosSeleccionados}
                onChange={setRepuestosSeleccionados}
                options={repuestos.map(r => ({
                  id: r.id,
                  label: `${r.descripcion || r.codigo || 'Sin descripción'}${r.codigo && r.descripcion ? ` (${r.codigo})` : ''}`,
                  searchText: `${r.descripcion || ''} ${r.codigo || ''}`
                }))}
                placeholder="Seleccionar repuestos..."
                label="Repuestos"
                onCreateNew={() => setShowRepuestoModal(true)}
                createButtonText="Crear repuesto"
                tagColor="blue"
              />

              {/* Grid: Serial y Valor revisión */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Serial
                  </label>
                  <input
                    type="text"
                    name="serial"
                    value={formData.serial}
                    onChange={handleChange}
                    placeholder="Ej: ABC123"
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
                    Valor Revisión
                  </label>
                  <input
                    type="number"
                    name="valor_revision"
                    value={formData.valor_revision}
                    onChange={handleChange}
                    placeholder="Ej: 50000"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                  />
                </div>
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
                  modeloEditar ? 'Actualizar Modelo' : 'Crear Modelo'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Crear Marca */}
      <MarcaModal
        isOpen={showMarcaModal}
        onClose={() => setShowMarcaModal(false)}
        onSuccess={async (marcaCreada) => {
          await cargarMarcas();
          setFormData(prev => ({ ...prev, marca_id: marcaCreada.id }));
          setShowMarcaModal(false);
        }}
      />

      {/* Modal de Crear Accesorio */}
      <AccesorioModal
        isOpen={showAccesorioModal}
        onClose={() => setShowAccesorioModal(false)}
        onSuccess={async (accesorioCreado) => {
          await cargarAccesorios();
          setAccesoriosSeleccionados(prev => [...prev, accesorioCreado.id]);
          setShowAccesorioModal(false);
        }}
      />

      {/* Modal de Crear Repuesto */}
      <RepuestoModal
        isOpen={showRepuestoModal}
        onClose={() => setShowRepuestoModal(false)}
        onSuccess={async (repuestoCreado) => {
          await cargarRepuestos();
          setRepuestosSeleccionados(prev => [...prev, repuestoCreado.id]);
          setShowRepuestoModal(false);
        }}
      />
    </>
  );
}
