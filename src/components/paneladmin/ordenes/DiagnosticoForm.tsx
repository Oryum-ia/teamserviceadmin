"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, Trash2, Loader2, Upload, X, Download, MessageCircle } from 'lucide-react';
import { notificarCambioFaseWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { formatearFechaColombiaLarga, crearTimestampColombia } from '@/lib/utils/dateUtils';
import { actualizarDiagnostico, avanzarACotizacion } from '@/lib/services/ordenService';
import { subirMultiplesImagenes, eliminarImagenOrden, actualizarFotosDiagnostico, descargarImagen } from '@/lib/services/imagenService';
import ImagenViewer from './ImagenViewer';
import DropZoneImagenes from './DropZoneImagenes';
import { ejecutarConReintentos, validarArchivos, guardarFotosConReintentos } from '@/lib/utils/saveHelpers';
import { updateOrdenFields } from '@/lib/ordenLocalStorage';
import { useRepuestosOrden, type RepuestoBase } from '@/hooks/useRepuestosOrden';

interface DiagnosticoFormProps {
  orden: any;
  onSuccess: () => void;
  faseIniciada?: boolean;
}

export default function DiagnosticoForm({ orden, onSuccess, faseIniciada = true }: DiagnosticoFormProps) {
  const { theme } = useTheme();
  const toast = useToast();

  
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
  
  const [repuestos, setRepuestos] = useState<RepuestoBase[]>([]);
  const [repuestosCargados, setRepuestosCargados] = useState(false);
  
  const [fotos, setFotos] = useState<string[]>(orden.fotos_diagnostico || []);
  const [cargandoRepuestos, setCargandoRepuestos] = useState(false);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const comentariosTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [guardandoComentarios, setGuardandoComentarios] = React.useState(false);

  // ============================================================================
  // Hook centralizado de repuestos (fuente única de verdad)
  // ============================================================================
  const {
    repuestosBase,
    cargando: cargandoRepuestosHook,
    repuestosBaseRef,
    agregarRepuesto: agregarRepuestoHook,
    eliminarRepuesto: eliminarRepuestoHook,
    actualizarRepuestoBase,
    flushRepuestos,
  } = useRepuestosOrden({
    ordenId: orden.id,
    modeloId: orden.equipo?.modelo_id,
    orden,
  });

  // ============================================================================
  // REFS para evitar stale closures en debounce y cleanup
  // ============================================================================
  const formDataRef = React.useRef(formData);
  const selectedTecnicoIdRef = React.useRef(selectedTecnicoId);
  const fotosRef = React.useRef(fotos);

  React.useEffect(() => { formDataRef.current = formData; }, [formData]);
  React.useEffect(() => { selectedTecnicoIdRef.current = selectedTecnicoId; }, [selectedTecnicoId]);
  React.useEffect(() => { fotosRef.current = fotos; }, [fotos]);

  // Sincronizar fotos con incoming orden updates
  React.useEffect(() => {
    if (orden.fotos_diagnostico) {
      console.log(`📸 Sincronizando ${orden.fotos_diagnostico.length} fotos de diagnóstico desde la orden`);
      setFotos(orden.fotos_diagnostico);
    }
  }, [orden.id, orden.fotos_diagnostico]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      formDataRef.current = next;
      return next;
    });
  };

  // Guardar con debounce optimizado — ahora delegado al hook useRepuestosOrden

  // Flush de datos pendientes y limpiar timeouts al desmontar
  React.useEffect(() => {
    return () => {
      // Flush comentarios pendientes
      if (comentariosTimeoutRef.current) {
        clearTimeout(comentariosTimeoutRef.current);
        const currentComentarios = formDataRef.current.comentarios;
        if (currentComentarios !== undefined) {
          (async () => {
            try {
              const { supabase } = await import('@/lib/supabaseClient');
              await supabase
                .from('ordenes')
                .update({
                  comentarios_diagnostico: currentComentarios,
                  ultima_actualizacion: crearTimestampColombia()
                })
                .eq('id', orden.id);
              console.log('💾 Flush de comentarios diagnóstico al desmontar');
            } catch (err) {
              console.error('❌ Error flush comentarios diagnóstico al desmontar:', err);
            }
          })();
        }
      }
    };
  }, [orden.id]);

  const agregarRepuesto = agregarRepuestoHook;
  const eliminarRepuesto = eliminarRepuestoHook;

  const actualizarRepuesto = (index: number, campo: keyof RepuestoBase, valor: any) => {
    actualizarRepuestoBase(index, campo, valor);
  };

  // Guardar comentarios con debounce de 2 segundos
  const guardarComentariosConDebounce = (comentarios: string) => {
    if (comentariosTimeoutRef.current) {
      clearTimeout(comentariosTimeoutRef.current);
    }
    
    comentariosTimeoutRef.current = setTimeout(async () => {
      try {
        setGuardandoComentarios(true);
        const currentComentarios = formDataRef.current.comentarios;
        const { supabase } = await import('@/lib/supabaseClient');
        const { error } = await supabase
          .from('ordenes')
          .update({ 
            comentarios_diagnostico: currentComentarios,
            ultima_actualizacion: crearTimestampColombia()
          })
          .eq('id', orden.id);
        if (error) {
          console.error('❌ Error al guardar comentarios, reintentando...', error);
          await new Promise(r => setTimeout(r, 1000));
          await supabase
            .from('ordenes')
            .update({ 
              comentarios_diagnostico: formDataRef.current.comentarios,
              ultima_actualizacion: crearTimestampColombia()
            })
            .eq('id', orden.id);
        }
        updateOrdenFields({
          comentarios_diagnostico: currentComentarios,
          ultima_actualizacion: crearTimestampColombia()
        } as any);
        console.log('✅ Comentarios de diagnóstico guardados automáticamente');
      } catch (error) {
        console.error('Error al guardar comentarios:', error);
      } finally {
        setGuardandoComentarios(false);
      }
    }, 2000);
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    // Validar archivos con helper
    const { validos, invalidos } = validarArchivos(files);

    if (invalidos.length > 0) {
      toast.error(`Algunos archivos no se pudieron subir:\n${invalidos.join('\n')}`);
    }

    if (validos.length === 0) return;

    setSubiendoFotos(true);
    const fotosActuales = [...fotosRef.current];
    const fotosAnteriores = [...fotosActuales];
    
    try {
      console.log(`📤 Subiendo ${validos.length} archivo(s) de diagnóstico...`);
      
      const urls = await subirMultiplesImagenes(orden.id, validos, 'diagnostico');
      console.log(`✅ ${urls.length} archivo(s) subido(s) al storage`);
      
      const nuevasFotos = [...fotosActuales, ...urls];
      setFotos(nuevasFotos);
      fotosRef.current = nuevasFotos;
      
      // Guardar en BD con reintentos
      await guardarFotosConReintentos(orden.id, nuevasFotos, 'diagnostico', actualizarFotosDiagnostico);
      
      // Actualizar localStorage
      updateOrdenFields({ fotos_diagnostico: nuevasFotos } as any);
      
      toast.success(`${validos.length} archivo(s) subido(s) y guardado(s) exitosamente`);
    } catch (error) {
      console.error('❌ Error al subir fotos:', error);
      toast.error('Error al subir las fotos. Por favor, intente nuevamente.');
      setFotos(fotosAnteriores);
      fotosRef.current = fotosAnteriores;
    } finally {
      setSubiendoFotos(false);
    }
  };

  const handleEliminarFoto = async (url: string, index: number) => {
    const fotosActuales = [...fotosRef.current];
    const fotosAnteriores = [...fotosActuales];
    try {
      console.log(`🗑️ Eliminando foto ${index + 1} de diagnóstico...`);
      
      const nuevasFotos = fotosActuales.filter((_, i) => i !== index);
      setFotos(nuevasFotos);
      fotosRef.current = nuevasFotos;
      
      // Intentar eliminar del storage
      try {
        await eliminarImagenOrden(url);
        console.log('✅ Foto eliminada del storage');
      } catch (storageError) {
        console.warn('⚠️ Error al eliminar del storage:', storageError);
      }
      
      // Actualizar en BD con reintentos
      await guardarFotosConReintentos(orden.id, nuevasFotos, 'diagnostico', actualizarFotosDiagnostico);
      
      // Actualizar localStorage
      updateOrdenFields({ fotos_diagnostico: nuevasFotos } as any);
      
      toast.success('Foto eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error al eliminar foto:', error);
      toast.error('Error al eliminar la foto. Por favor, intente nuevamente.');
      setFotos(fotosAnteriores);
      fotosRef.current = fotosAnteriores;
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


  // Guardar datos sin validaciones (solo para botón Guardar)
  // Usa REFS para siempre tener los datos más actuales (sin stale closures)
  React.useEffect(() => {
    if (orden && typeof window !== 'undefined') {
      (window as any).guardarDatosDiagnostico = async () => {
        try {
          console.log('💾 Guardando datos de diagnóstico...');
          
          // Cancelar debounces pendientes
          if (comentariosTimeoutRef.current) {
            clearTimeout(comentariosTimeoutRef.current);
          }

          const currentFormData = formDataRef.current;
          const currentRepuestos = repuestosBaseRef.current;
          const currentTecnicoId = selectedTecnicoIdRef.current;
          const currentFotos = fotosRef.current;
          
          // Guardar fotos si hay cambios
          if (currentFotos.length > 0) {
            console.log(`📸 Verificando guardado de ${currentFotos.length} fotos de diagnóstico`);
            await guardarFotosConReintentos(orden.id, currentFotos, 'diagnostico', actualizarFotosDiagnostico);
          }
          
          const { supabase } = await import('@/lib/supabaseClient');
          
          const updateData: any = {
            comentarios_diagnostico: currentFormData.comentarios || '',
            tecnico_diagnostico: currentTecnicoId || null,
            ultima_actualizacion: crearTimestampColombia()
          };
          
          await ejecutarConReintentos(
            async () => {
              const { error } = await supabase
                .from('ordenes')
                .update(updateData)
                .eq('id', orden.id);
              if (error) throw error;
            },
            3,
            'guardar datos de diagnóstico'
          );

          updateOrdenFields(updateData);
          
          // Flush repuestos via hook centralizado
          await flushRepuestos();

          updateOrdenFields({
            ...updateData,
            repuestos_diagnostico: currentRepuestos
          } as any);
          
          console.log('✅ Datos de diagnóstico guardados exitosamente');
          console.log('✅ Repuestos guardados:', currentRepuestos.length);
          
          return updateData;
        } catch (error) {
          console.error('❌ Error al guardar datos de diagnóstico:', error);
          throw error;
        }
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).guardarDatosDiagnostico;
      }
    };
  }, [orden?.id, flushRepuestos]);

  const puedeEditar = orden.estado_actual === 'Diagnóstico' && faseIniciada;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
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
        <button
          type="button"
          onClick={() => notificarCambioFaseWhatsApp(orden.id, 'Diagnóstico')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm"
        >
          <MessageCircle className="w-5 h-5" />
          <span>WhatsApp</span>
        </button>
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
                  onChange={(e) => {
                    selectedTecnicoIdRef.current = e.target.value;
                    setSelectedTecnicoId(e.target.value);
                  }}
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
              {repuestosBase.length > 0 && (
                <p className={`text-xs mt-1 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {repuestosBase.length} repuesto(s) {cargandoRepuestosHook ? 'cargando...' : 'del modelo'}
                </p>
              )}
            </div>
            {puedeEditar && (
              <button
                type="button"
                onClick={agregarRepuesto}
                disabled={cargandoRepuestosHook}
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
          
          {repuestosBase.length > 0 ? (
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
                  {repuestosBase.map((repuesto, index) => (
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
