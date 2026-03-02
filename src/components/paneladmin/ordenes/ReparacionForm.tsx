"use client";

import React, { useState } from 'react';
import { Save, Loader2, Upload, X, Download, MessageCircle } from 'lucide-react';
import { notificarCambioFaseWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { formatearFechaColombiaLarga, crearTimestampColombia } from '@/lib/utils/dateUtils';
import { subirMultiplesImagenes, eliminarImagenOrden, descargarImagen, actualizarFotosReparacion } from '@/lib/services/imagenService';
import ImagenViewer from './ImagenViewer';
import DropZoneImagenes from './DropZoneImagenes';
import { ejecutarConReintentos, validarArchivos, guardarFotosConReintentos } from '@/lib/utils/saveHelpers';
import { updateOrdenFields } from '@/lib/ordenLocalStorage';

interface ReparacionFormProps {
  orden: any;
  onSuccess: () => void;
  faseIniciada?: boolean;
}

export default function ReparacionForm({ orden, onSuccess, faseIniciada = true }: ReparacionFormProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fechas automáticas (solo lectura)
  const fechaInicio = orden.fecha_inicio_reparacion || null;
  const fechaFin = orden.fecha_fin_reparacion || null;

  // Usuarios técnicos
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [selectedTecnicoId, setSelectedTecnicoId] = useState(orden.tecnico_repara || '');
  const [usuarioReparacionNombre, setUsuarioReparacionNombre] = useState('');

  // Fotos de reparación
  const [fotos, setFotos] = useState<string[]>(orden.fotos_reparacion || []);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  
  // Refs y estados para guardado automático de comentarios
  const comentariosTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [guardandoComentarios, setGuardandoComentarios] = useState(false);

  // Cargar técnicos y usuario actual
  React.useEffect(() => {
    const cargarDatos = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { obtenerUsuariosPorRol } = await import('@/lib/services/usuarioService');

        // Cargar lista de técnicos
        const listaTecnicos = await obtenerUsuariosPorRol('tecnico');
        setTecnicos(listaTecnicos || []);

        // Si ya hay un técnico asignado, buscar su nombre
        if (orden.tecnico_repara) {
          const tecnico = listaTecnicos.find(t => t.id === orden.tecnico_repara);
          if (tecnico) {
            setUsuarioReparacionNombre(tecnico.nombre);
            setSelectedTecnicoId(orden.tecnico_repara);
          } else {
            // Si no está en la lista (ej. inactivo), buscarlo individualmente
            const { data } = await supabase.from('usuarios').select('nombre').eq('id', orden.tecnico_repara).single();
            setUsuarioReparacionNombre(data?.nombre || 'Desconocido');
          }
        } else {
          // Si no hay técnico asignado, intentar pre-seleccionar al usuario actual si es técnico
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            const esTecnico = listaTecnicos.find(t => t.id === authData.user?.id);
            if (esTecnico) {
              setSelectedTecnicoId(authData.user.id);
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    cargarDatos();
  }, [orden.tecnico_repara]);

  const [formData, setFormData] = useState({
    comentarios: orden.comentarios_reparacion || ''
  });

  const formDataRef = React.useRef(formData);
  const selectedTecnicoIdRef = React.useRef(selectedTecnicoId);
  const fotosRef = React.useRef(fotos);

  React.useEffect(() => { formDataRef.current = formData; }, [formData]);
  React.useEffect(() => { selectedTecnicoIdRef.current = selectedTecnicoId; }, [selectedTecnicoId]);
  React.useEffect(() => { fotosRef.current = fotos; }, [fotos]);

  // Sincronizar estado local cuando llegan cambios remotos/locales de la orden
  React.useEffect(() => {
    setFormData({ comentarios: orden.comentarios_reparacion || '' });
    setFotos(Array.isArray(orden.fotos_reparacion) ? orden.fotos_reparacion : []);
    setSelectedTecnicoId(orden.tecnico_repara || '');
  }, [orden.id, orden.comentarios_reparacion, orden.fotos_reparacion, orden.tecnico_repara]);

  // Guardar datos sin validaciones (solo para botón Guardar)
  React.useEffect(() => {
    (window as any).guardarDatosReparacion = async () => {
      try {
        // Cancelar debounce de comentarios pendiente
        if (comentariosTimeoutRef.current) {
          clearTimeout(comentariosTimeoutRef.current);
        }
        
        const { supabase } = await import('@/lib/supabaseClient');
        
        const currentFormData = formDataRef.current;
        const currentTecnicoId = selectedTecnicoIdRef.current;
        const currentFotos = fotosRef.current;

        // Guardar datos básicos (sin validaciones)
        const updateData = {
          tecnico_repara: currentTecnicoId || null,
          comentarios_reparacion: currentFormData.comentarios || '',
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
          'guardar datos de reparación'
        );

        await guardarFotosConReintentos(orden.id, currentFotos, 'reparacion', actualizarFotosReparacion);
        updateOrdenFields({ ...updateData, fotos_reparacion: currentFotos } as any);
        
        console.log('✅ Datos de reparación guardados (sin validaciones):', updateData);
        
        return updateData;
      } catch (error) {
        console.error('Error al guardar datos de reparación:', error);
        throw error;
      }
    };

    return () => {
      delete (window as any).guardarDatosReparacion;
    };
  }, [orden.id]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
        const comentarioActual = formDataRef.current.comentarios;
        await ejecutarConReintentos(
          async () => {
            const { error } = await supabase
              .from('ordenes')
              .update({
                comentarios_reparacion: comentarioActual,
                ultima_actualizacion: crearTimestampColombia()
              })
              .eq('id', orden.id);
            if (error) throw error;
          },
          3,
          'autoguardado comentarios reparación'
        );
        console.log('✅ Comentarios de reparación guardados automáticamente');
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
        const currentComentarios = formDataRef.current.comentarios;
        if (currentComentarios !== undefined) {
          (async () => {
            try {
              const { supabase } = await import('@/lib/supabaseClient');
              await supabase
                .from('ordenes')
                .update({
                  comentarios_reparacion: currentComentarios,
                  ultima_actualizacion: crearTimestampColombia()
                })
                .eq('id', orden.id);
              console.log('💾 Flush de comentarios reparación al desmontar');
            } catch (err) {
              console.error('❌ Error flush comentarios reparación al desmontar:', err);
            }
          })();
        }
      }
    };
  }, [orden.id]);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    // Validar archivos
    const MAX_SIZE = 300 * 1024 * 1024; // 300MB
    const archivosValidos: File[] = [];
    const archivosInvalidos: string[] = [];

    files.forEach(file => {
      // Validar tipo
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        archivosInvalidos.push(`${file.name} (Tipo no válido)`);
        return;
      }
      
      // Validar tamaño
      if (file.size > MAX_SIZE) {
        archivosInvalidos.push(`${file.name} (Excede 300MB)`);
        return;
      }

      archivosValidos.push(file);
    });

    if (archivosInvalidos.length > 0) {
      toast.error(`Algunos archivos no se pudieron subir:\n${archivosInvalidos.join('\n')}`);
    }

    if (archivosValidos.length === 0) return;

    setSubiendoFotos(true);
    const fotosActuales = [...fotosRef.current];
    const fotosAnteriores = [...fotosActuales];
    try {
      const urls = await subirMultiplesImagenes(orden.id, archivosValidos, 'reparacion');
      const nuevasFotos = [...fotosActuales, ...urls];
      setFotos(nuevasFotos);
      fotosRef.current = nuevasFotos;

      // Guardar en la base de datos inmediatamente con reintentos
      await guardarFotosConReintentos(orden.id, nuevasFotos, 'reparacion', actualizarFotosReparacion);
      updateOrdenFields({ fotos_reparacion: nuevasFotos } as any);

      toast.success(`${archivosValidos.length} archivo(s) subido(s) exitosamente`);
    } catch (error) {
      console.error('Error al subir archivos:', error);
      toast.error('Error al subir los archivos. Verifique su conexión.');
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
      // Eliminar del storage
      await eliminarImagenOrden(url);

      // Actualizar estado local
      const nuevasFotos = fotosActuales.filter((_, i) => i !== index);
      setFotos(nuevasFotos);
      fotosRef.current = nuevasFotos;

      // Actualizar en la base de datos con reintentos
      await guardarFotosConReintentos(orden.id, nuevasFotos, 'reparacion', actualizarFotosReparacion);
      updateOrdenFields({ fotos_reparacion: nuevasFotos } as any);

      toast.success('Foto eliminada');
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      toast.error('Error al eliminar la foto');
      setFotos(fotosAnteriores);
      fotosRef.current = fotosAnteriores;
    }
  };

  const handleDescargarFoto = async (url: string, index: number) => {
    try {
      const nombreArchivo = `reparacion-${orden.codigo}-foto-${index + 1}.jpg`;
      await descargarImagen(url, nombreArchivo);
      toast.success('Foto descargada');
    } catch (error) {
      console.error('Error al descargar foto:', error);
      toast.error('Error al descargar la foto');
    }
  };

  const puedeEditar = orden.estado_actual === 'Reparación' && faseIniciada;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Reparación
          </h2>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            {puedeEditar
              ? 'Registre el proceso de reparación del equipo'
              : 'Reparación completada - Solo lectura'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => notificarCambioFaseWhatsApp(orden.id, 'Reparación')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm"
        >
          <MessageCircle className="w-5 h-5" />
          <span>WhatsApp</span>
        </button>
      </div>

      {!faseIniciada && orden.estado_actual === 'Reparación' && (
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/20 border-amber-800'
        }`}>
          <p className={`text-sm font-medium ${
            theme === 'light' ? 'text-amber-800' : 'text-amber-300'
          }`}>
            ⚠️ Debe presionar "Iniciar Fase" para comenzar a trabajar en esta reparación.
          </p>
        </div>
      )}

      {orden.estado_actual !== 'Reparación' && (
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'
        }`}>
          <p className={`text-sm ${
            theme === 'light' ? 'text-blue-800' : 'text-blue-300'
          }`}>
            Esta reparación ya fue completada y la orden avanzó a la siguiente fase.
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
            Período de Reparación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={`text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-blue-700' : 'text-blue-400'
              }`}>
                Fecha inicio de reparación
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
                Fecha fin de reparación
              </p>
              <p className={`text-sm ${
                theme === 'light' ? 'text-blue-900' : 'text-blue-200'
              }`}>
                {fechaFin ? formatearFechaColombiaLarga(fechaFin) : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>

        {/* Usuario que repara (Select de técnicos) */}
        <div className={`rounded-lg border p-4 ${
          theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-full">
              <p className={`text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Usuario que repara <span className="text-red-500">*</span>
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
                  {tecnicos.map((tecnico) => (
                    <option key={tecnico.id} value={tecnico.id}>
                      {tecnico.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={`text-sm font-medium ${
                  theme === 'light' ? 'text-gray-900' : 'text-gray-200'
                }`}>
                  {usuarioReparacionNombre || 'No asignado'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Fotos de reparación */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Evidencia (Fotos y Videos) {fotos.length > 0 && `(${fotos.length})`}
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
                <span>{subiendoFotos ? 'Subiendo...' : 'Subir evidencia'}</span>
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

        {/* Comentarios de reparación */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Comentarios de reparación
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
              placeholder="Comentarios de reparación"
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
