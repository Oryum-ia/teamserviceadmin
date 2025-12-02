"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, Trash2, Loader2, Upload, X, Download } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { formatearFechaColombiaLarga } from '@/lib/utils/dateUtils';
import { actualizarDiagnostico, avanzarACotizacion } from '@/lib/services/ordenService';
import { obtenerRepuestosDelModelo, guardarRepuestosDiagnostico, obtenerRepuestosDiagnostico } from '@/lib/services/repuestoService';
import { subirMultiplesImagenes, eliminarImagenOrden, actualizarFotosDiagnostico, descargarImagen } from '@/lib/services/imagenService';
import ImagenViewer from './ImagenViewer';
import DropZoneImagenes from './DropZoneImagenes';

interface Repuesto {
  codigo: string;
  descripcion: string;
  cantidad: string | number;
  pieza_causante: string;
}

interface DiagnosticoFormProps {
  orden: any;
  onSuccess: () => void;
  faseIniciada?: boolean;
}

export default function DiagnosticoForm({ orden, onSuccess, faseIniciada = true }: DiagnosticoFormProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Fechas automáticas (solo lectura)
  const fechaInicio = orden.fecha_inicio_diagnostico || orden.fecha_creacion;
  const fechaFin = orden.fecha_fin_diagnostico || null;
  
  // Usuario automático (usuario actual de la sesión)
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [selectedTecnicoId, setSelectedTecnicoId] = useState(orden.tecnico_diagnostico || '');
  const [usuarioDiagnosticoNombre, setUsuarioDiagnosticoNombre] = useState('');
  
  // Obtener usuario actual de la sesión
  React.useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { obtenerUsuariosPorRol } = await import('@/lib/services/usuarioService');

        const listaTecnicos = await obtenerUsuariosPorRol('tecnico');
        setTecnicos(listaTecnicos || []);

        if (orden.tecnico_diagnostico) {
          const tecnico = listaTecnicos?.find((t: any) => t.id === orden.tecnico_diagnostico);
          if (tecnico) {
            setUsuarioDiagnosticoNombre(tecnico.nombre);
            setSelectedTecnicoId(orden.tecnico_diagnostico);
            return;
          }

          const { data } = await supabase
            .from('usuarios')
            .select('nombre')
            .eq('id', orden.tecnico_diagnostico)
            .single();
          setUsuarioDiagnosticoNombre(data?.nombre || 'Desconocido');
        } else {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            const esTecnico = listaTecnicos?.find((t: any) => t.id === authData.user.id);
            if (esTecnico) {
              setSelectedTecnicoId(authData.user.id);
              setUsuarioDiagnosticoNombre(esTecnico.nombre);
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar técnicos de diagnóstico:', error);
      }
    };

    cargarDatos();
  }, [orden.tecnico_diagnostico]);
  
  const [formData, setFormData] = useState({
    descripcion_problema: orden.diagnostico?.descripcion_problema || '',
    estado_general: orden.diagnostico?.estado_general || '',
    observaciones: orden.diagnostico?.observaciones || '',
    comentarios: orden.comentarios_diagnostico || orden.diagnostico?.comentarios || '',
    notas_internas: orden.diagnostico?.notas_internas?.join('\n') || ''
  });
  
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [repuestosCargados, setRepuestosCargados] = useState(false);
  
  const [fotos, setFotos] = useState<string[]>(orden.fotos_diagnostico || []);
  const [cargandoRepuestos, setCargandoRepuestos] = useState(false);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const comentariosTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [guardandoComentarios, setGuardandoComentarios] = React.useState(false);

  // Cargar repuestos guardados o del modelo
  useEffect(() => {
    const cargarRepuestos = async () => {
      if (repuestosCargados) return;

      console.log('🔍 Cargando repuestos...');
      setCargandoRepuestos(true);
      
      try {
        // Primero intentar cargar repuestos guardados
        const repuestosGuardados = await obtenerRepuestosDiagnostico(orden.id);
        
        if (repuestosGuardados && repuestosGuardados.length > 0) {
          console.log('✅ Repuestos guardados encontrados:', repuestosGuardados.length);
          setRepuestos(repuestosGuardados);
          setRepuestosCargados(true);
          return;
        }

        // Si no hay guardados, cargar del modelo
        if (!orden.equipo?.modelo_id) {
          console.log('⚠️ No hay modelo_id en el equipo');
          setRepuestosCargados(true);
          return;
        }

        console.log('🔍 Cargando repuestos del modelo:', orden.equipo.modelo_id);
        const repuestosModelo = await obtenerRepuestosDelModelo(orden.equipo.modelo_id);
        console.log('✅ Repuestos del modelo recibidos:', repuestosModelo);
        
        if (repuestosModelo && repuestosModelo.length > 0) {
          const repuestosMapeados = repuestosModelo.map((r: any) => ({
            codigo: r.codigo || '',
            descripcion: r.descripcion || '',
            cantidad: r.cantidad || 1,
            pieza_causante: r.causante || ''
          }));
          setRepuestos(repuestosMapeados);
          // Guardar inmediatamente los repuestos del modelo
          await guardarRepuestosDiagnostico(orden.id, repuestosMapeados);
        } else {
          console.log('⚠️ No se encontraron repuestos para el modelo');
        }
      } catch (error) {
        console.error('❌ Error al cargar repuestos:', error);
      } finally {
        setCargandoRepuestos(false);
        setRepuestosCargados(true);
      }
    };

    cargarRepuestos();
  }, [orden.id, orden.equipo?.modelo_id, repuestosCargados]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Guardar comentarios con debounce de 3 segundos
  const guardarComentariosConDebounce = (comentarios: string) => {
    if (comentariosTimeoutRef.current) {
      clearTimeout(comentariosTimeoutRef.current);
    }
    
    comentariosTimeoutRef.current = setTimeout(async () => {
      try {
        setGuardandoComentarios(true);
        const { supabase } = await import('@/lib/supabaseClient');
        await supabase
          .from('ordenes')
          .update({ 
            comentarios_diagnostico: comentarios,
            ultima_actualizacion: new Date().toISOString()
          })
          .eq('id', orden.id);
        console.log('✅ Comentarios de diagnóstico guardados automáticamente');
      } catch (error) {
        console.error('Error al guardar comentarios:', error);
      } finally {
        setGuardandoComentarios(false);
      }
    }, 3000);
  };

  // Limpiar timeout de comentarios al desmontar
  React.useEffect(() => {
    return () => {
      if (comentariosTimeoutRef.current) {
        clearTimeout(comentariosTimeoutRef.current);
      }
    };
  }, []);

  // Guardar con debounce optimizado
  const guardarConDebounce = (nuevosRepuestos: Repuesto[]) => {
    // Limpiar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Crear nuevo timeout de 2 segundos
    saveTimeoutRef.current = setTimeout(async () => {
      await guardarRepuestosDiagnostico(orden.id, nuevosRepuestos);
      console.log('✅ Repuestos guardados automáticamente');
    }, 2000);
  };

  // Guardar cambios pendientes antes de desmontar
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Guardar inmediatamente antes de desmontar
        guardarRepuestosDiagnostico(orden.id, repuestos).catch(console.error);
      }
    };
  }, [repuestos, orden.id]);

  const agregarRepuesto = async () => {
    const nuevosRepuestos = [...repuestos, { codigo: '', descripcion: '', cantidad: '1', pieza_causante: '' }];
    setRepuestos(nuevosRepuestos);
    // Guardar inmediatamente al agregar (sin debounce)
    await guardarRepuestosDiagnostico(orden.id, nuevosRepuestos);
    console.log('✅ Nuevo repuesto agregado y guardado');
  };

  const eliminarRepuesto = async (index: number) => {
    const nuevosRepuestos = repuestos.filter((_, i) => i !== index);
    setRepuestos(nuevosRepuestos);
    // Guardar inmediatamente al eliminar
    await guardarRepuestosDiagnostico(orden.id, nuevosRepuestos);
  };

  const actualizarRepuesto = (index: number, campo: keyof Repuesto, valor: any) => {
    const nuevosRepuestos = [...repuestos];
    nuevosRepuestos[index] = { ...nuevosRepuestos[index], [campo]: valor };
    setRepuestos(nuevosRepuestos);
    guardarConDebounce(nuevosRepuestos);
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setSubiendoFotos(true);
    try {
      const urls = await subirMultiplesImagenes(orden.id, files, 'diagnostico');
      const nuevasFotos = [...fotos, ...urls];
      setFotos(nuevasFotos);
      
      // Guardar en la base de datos inmediatamente
      await actualizarFotosDiagnostico(orden.id, nuevasFotos);
      
      toast.success(`${files.length} foto(s) subida(s) exitosamente`);
    } catch (error) {
      console.error('Error al subir fotos:', error);
      toast.error('Error al subir las fotos');
    } finally {
      setSubiendoFotos(false);
    }
  };

  const handleEliminarFoto = async (url: string, index: number) => {
    try {
      // Eliminar del storage
      await eliminarImagenOrden(url);
      
      // Actualizar estado local
      const nuevasFotos = fotos.filter((_, i) => i !== index);
      setFotos(nuevasFotos);
      
      // Actualizar en la base de datos
      await actualizarFotosDiagnostico(orden.id, nuevasFotos);
      
      toast.success('Foto eliminada');
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      toast.error('Error al eliminar la foto');
    }
  };

  const handleDescargarFoto = async (url: string, index: number) => {
    try {
      const nombreArchivo = `diagnostico-${orden.codigo}-foto-${index + 1}.jpg`;
      await descargarImagen(url, nombreArchivo);
      toast.success('Foto descargada');
    } catch (error) {
      console.error('Error al descargar foto:', error);
      toast.error('Error al descargar la foto');
    }
  };


  // Guardar datos al avanzar de fase (exponer función para que sea llamada desde el botón avanzar)
  React.useEffect(() => {
    // Agregar función al objeto orden para que pueda ser llamada desde page.tsx
    if (orden && typeof window !== 'undefined') {
      (window as any).guardarDatosDiagnostico = async () => {
        if (!selectedTecnicoId) {
          toast.error('Debe seleccionar un técnico responsable del diagnóstico');
          return null;
        }

        const { supabase } = await import('@/lib/supabaseClient');
        
        const updateData: any = {
          comentarios_diagnostico: formData.comentarios,
          tecnico_diagnostico: selectedTecnicoId,
          ultima_actualizacion: new Date().toISOString()
        };
        
        await supabase
          .from('ordenes')
          .update(updateData)
          .eq('id', orden.id);
        
        console.log('✅ Datos de diagnóstico guardados:', updateData);
        
        return updateData;
      };
    }
    
    // Limpiar al desmontar
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).guardarDatosDiagnostico;
      }
    };
  }, [formData.comentarios, orden?.id, selectedTecnicoId, toast]);

  const handleAvanzarACotizacion = async () => {
    setIsLoading(true);
    try {
      // IMPORTANTE: Guardar repuestos antes de avanzar
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      await guardarRepuestosDiagnostico(orden.id, repuestos);
      
      const now = new Date().toISOString();
      
      // Importar supabase
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Obtener usuario actual
      const { data: authData } = await supabase.auth.getUser();
      const tecnicoId = authData?.user?.id || null;
      
      // Actualizar todo en una sola operación
      const updateData = {
        estado_actual: 'Cotización',
        comentarios_diagnostico: formData.comentarios,
        fecha_fin_diagnostico: now,
        tecnico_diagnostico: tecnicoId,
        fecha_cotizacion: now,
        ultima_actualizacion: now
      };
      
      const { error } = await supabase
        .from('ordenes')
        .update(updateData)
        .eq('id', orden.id);
        
      if (error) throw error;
      
      toast.success('Avanzado a fase de cotización');
      onSuccess();
    } catch (error) {
      console.error('Error al avanzar a cotización:', error);
      toast.error(error instanceof Error ? error.message : 'Error al avanzar a cotización');
    } finally {
      setIsLoading(false);
    }
  };

  const puedeEditar = orden.estado_actual === 'Diagnóstico' && faseIniciada;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Diagnóstico Técnico
        </h2>
        <p className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {puedeEditar 
            ? 'Complete el diagnóstico del equipo para avanzar a cotización'
            : 'Diagnóstico completado - Solo lectura'}
        </p>
      </div>

      {!faseIniciada && orden.estado_actual === 'Diagnóstico' && (
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/20 border-amber-800'
        }`}>
          <p className={`text-sm font-medium ${
            theme === 'light' ? 'text-amber-800' : 'text-amber-300'
          }`}>
            ⚠️ Debe presionar "Iniciar Fase" para comenzar a trabajar en este diagnóstico.
          </p>
        </div>
      )}

      {orden.estado_actual !== 'Diagnóstico' && (
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'
        }`}>
          <p className={`text-sm ${
            theme === 'light' ? 'text-blue-800' : 'text-blue-300'
          }`}>
            Este diagnóstico ya fue completado y la orden avanzó a la siguiente fase.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Fechas automáticas (solo visualización) */}
        <div className={`rounded-lg border p-4 ${
          theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'
        }`}>
          <h3 className={`text-sm font-medium mb-3 ${
            theme === 'light' ? 'text-blue-900' : 'text-blue-300'
          }`}>
            Período de Diagnóstico
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={`text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-blue-700' : 'text-blue-400'
              }`}>
                Fecha de inicio
              </p>
              <p className={`text-sm ${
                theme === 'light' ? 'text-blue-900' : 'text-blue-200'
              }`}>
                {fechaInicio ? formatearFechaColombiaLarga(fechaInicio) : 'No registrada'}
              </p>
            </div>
            <div>
              <p className={`text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-blue-700' : 'text-blue-400'
              }`}>
                Fecha de finalización
              </p>
              <p className={`text-sm ${
                theme === 'light' ? 'text-blue-900' : 'text-blue-200'
              }`}>
                {fechaFin ? formatearFechaColombiaLarga(fechaFin) : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>

        {/* Usuario que diagnostica (automático, solo lectura) */}
        <div className={`rounded-lg border p-4 ${
          theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-full">
              <p className={`text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Técnico responsable del diagnóstico <span className="text-red-500">*</span>
              </p>
              {puedeEditar ? (
                <select
                  value={selectedTecnicoId}
                  onChange={(e) => setSelectedTecnicoId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-gray-100'
                  }`}
                >
                  <option value="">Seleccionar técnico...</option>
                  {tecnicos.map((tecnico: any) => (
                    <option key={tecnico.id} value={tecnico.id}>
                      {tecnico.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={`text-sm font-medium ${
                  theme === 'light' ? 'text-gray-900' : 'text-gray-200'
                }`}>
                  {usuarioDiagnosticoNombre || 'No asignado'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de Repuestos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className={`text-sm font-medium ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Repuestos Necesarios
              </label>
              {repuestos.length > 0 && (
                <p className={`text-xs mt-1 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {repuestos.length} repuesto(s) {cargandoRepuestos ? 'cargando...' : 'del modelo'}
                </p>
              )}
            </div>
            {puedeEditar && (
              <button
                type="button"
                onClick={agregarRepuesto}
                disabled={cargandoRepuestos}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Plus className="w-4 h-4" />
                Agregar más
              </button>
            )}
          </div>
          
          {repuestos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={`w-full border rounded-lg ${
                theme === 'light' ? 'border-gray-200' : 'border-gray-700'
              }`}>
                <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}>
                  <tr>
                    <th className={`px-3 py-2 text-left text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>Código</th>
                    <th className={`px-3 py-2 text-left text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>Descripción</th>
                    <th className={`px-3 py-2 text-left text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>Cantidad</th>
                    <th className={`px-3 py-2 text-left text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>Justificación</th>
                    {puedeEditar && (
                      <th className={`px-3 py-2 text-center text-xs font-medium ${
                        theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>Acción</th>
                    )}
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
                }`}>
                  {repuestos.map((repuesto, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={repuesto.codigo}
                          onChange={(e) => actualizarRepuesto(index, 'codigo', e.target.value)}
                          disabled={!puedeEditar}
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            theme === 'light'
                              ? 'border-gray-300 bg-white text-gray-900'
                              : 'border-gray-600 bg-gray-700 text-gray-100'
                          } disabled:opacity-50`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={repuesto.descripcion}
                          onChange={(e) => actualizarRepuesto(index, 'descripcion', e.target.value)}
                          disabled={!puedeEditar}
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            theme === 'light'
                              ? 'border-gray-300 bg-white text-gray-900'
                              : 'border-gray-600 bg-gray-700 text-gray-100'
                          } disabled:opacity-50`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={repuesto.cantidad}
                          onChange={(e) => actualizarRepuesto(index, 'cantidad', e.target.value)}
                          disabled={!puedeEditar}
                          className={`w-20 px-2 py-1 border rounded text-sm ${
                            theme === 'light'
                              ? 'border-gray-300 bg-white text-gray-900'
                              : 'border-gray-600 bg-gray-700 text-gray-100'
                          } disabled:opacity-50`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={repuesto.pieza_causante}
                          onChange={(e) => actualizarRepuesto(index, 'pieza_causante', e.target.value)}
                          disabled={!puedeEditar}
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            theme === 'light'
                              ? 'border-gray-300 bg-white text-gray-900'
                              : 'border-gray-600 bg-gray-700 text-gray-100'
                          } disabled:opacity-50`}
                        />
                      </td>
                      {puedeEditar && (
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => eliminarRepuesto(index)}
                            className="p-1 text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`p-4 text-center border-2 border-dashed rounded-lg ${
              theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-700'
            }`}>
              <p className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                No hay repuestos agregados
              </p>
            </div>
          )}
        </div>

        {/* Fotos almacenadas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Fotos de diagnóstico {fotos.length > 0 && `(${fotos.length})`}
            </label>
            
            {/* Botón de subir fotos */}
            {puedeEditar && (
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                subiendoFotos
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60'
                  : theme === 'light'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black'
              }`}>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      handleFilesSelected(files);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                  disabled={subiendoFotos || !puedeEditar}
                />
                <Upload className="w-4 h-4" />
                <span>{subiendoFotos ? 'Subiendo...' : 'Subir fotos'}</span>
              </label>
            )}
          </div>
          
          {/* Visualizador de imágenes con drag & drop integrado */}
          {fotos.length > 0 ? (
            <ImagenViewer 
              imagenes={fotos}
              onEliminar={puedeEditar ? handleEliminarFoto : undefined}
              onDescargar={handleDescargarFoto}
              puedeEditar={puedeEditar}
              onFilesDropped={puedeEditar ? handleFilesSelected : undefined}
              isUploading={subiendoFotos}
            />
          ) : (
            puedeEditar && (
              <DropZoneImagenes 
                onFilesSelected={handleFilesSelected}
                isUploading={subiendoFotos}
                disabled={!puedeEditar}
              />
            )
          )}
        </div>

        {/* Comentarios de diagnóstico (opcionales) */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Comentarios de diagnóstico
          </label>
          <div className="relative">
            <textarea
              name="comentarios"
              value={formData.comentarios}
              onChange={(e) => {
                handleChange(e);
                if (puedeEditar) {
                  guardarComentariosConDebounce(e.target.value);
                }
              }}
              rows={6}
              placeholder="Describa detalladamente el diagnóstico realizado al equipo..."
              disabled={!puedeEditar}
              spellCheck={true}
              lang="es"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {guardandoComentarios && (
              <span className={`absolute bottom-2 right-2 text-xs ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Guardando...
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
