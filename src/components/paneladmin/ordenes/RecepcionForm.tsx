"use client";

import React, { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { Loader2, Info, Plus, Trash2, Upload, FileText, Check, X, AlertCircle, MessageCircle } from 'lucide-react';
import { updateOrdenFields } from '@/lib/ordenLocalStorage';
import ImagenViewer from './ImagenViewer';
import DropZoneImagenes from './DropZoneImagenes';
import { FirmaDisplay } from '@/components/FirmaPad';
import { crearTimestampColombia, formatearFechaColombiaLarga } from '@/lib/utils/dateUtils';
import { notificarOrdenCreadaWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';

interface RecepcionFormProps {
  orden: any;
  onSuccess: () => void;
}

export default function RecepcionForm({ orden, onSuccess }: RecepcionFormProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cargandoAccesorios, setCargandoAccesorios] = useState(false);
  
  type EstadoAccesorio = 'bueno' | 'regular' | 'malo';
  interface Accesorio { nombre: string; estado: EstadoAccesorio; }
  const [accesorios, setAccesorios] = useState<Accesorio[]>(orden.esta_accesorios || []);
  const [nuevoAccesorio, setNuevoAccesorio] = useState('');

  const [fotos, setFotos] = useState<string[]>(orden.fotos_recepcion || []);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  
  // Sincronizar con cambios en la orden (para actualizar términos y firma en tiempo real)
  const [terminosAceptados, setTerminosAceptados] = useState(orden.terminos_aceptados || false);
  const [firmaCliente, setFirmaCliente] = useState(orden.firma_cliente || null);
  const [fechaAceptacion, setFechaAceptacion] = useState(orden.fecha_aceptacion_terminos || null);
  const [fechaFirma, setFechaFirma] = useState(orden.fecha_firma_cliente || null);
  
  React.useEffect(() => {
    console.log('🔄 Actualizando RecepcionForm con datos de orden:', {
      terminos_aceptados: orden.terminos_aceptados,
      firma_cliente: orden.firma_cliente ? 'Sí' : 'No',
      fecha_aceptacion: orden.fecha_aceptacion_terminos,
      fecha_firma: orden.fecha_firma_cliente
    });
    setTerminosAceptados(orden.terminos_aceptados || false);
    setFirmaCliente(orden.firma_cliente || null);
    setFechaAceptacion(orden.fecha_aceptacion_terminos || null);
    setFechaFirma(orden.fecha_firma_cliente || null);
  }, [orden.terminos_aceptados, orden.firma_cliente, orden.fecha_aceptacion_terminos, orden.fecha_firma_cliente]);

  // Sincronizar fotos con incoming orden updates (socket/http)
  React.useEffect(() => {
    if (orden.fotos_recepcion) {
      setFotos(orden.fotos_recepcion);
    }
  }, [orden.fotos_recepcion]);

  // Cargar accesorios del modelo al montar el componente
  React.useEffect(() => {
    const cargarAccesoriosModelo = async () => {
      // Solo cargar si no hay accesorios guardados y existe equipo con modelo
      if (orden.esta_accesorios && orden.esta_accesorios.length > 0) return;
      if (!orden.equipo?.modelo_id) return;

      setCargandoAccesorios(true);
      try {
        const { obtenerAccesoriosDelModelo } = await import('@/lib/services/accesorioService');
        const accesoriosModelo = await obtenerAccesoriosDelModelo(orden.equipo.modelo_id);
        
        if (accesoriosModelo && accesoriosModelo.length > 0) {
          const accesoriosConEstado: Accesorio[] = accesoriosModelo.map((acc: any) => ({
            nombre: acc.descripcion,
            estado: 'bueno' as EstadoAccesorio
          }));
          setAccesorios(accesoriosConEstado);
          // Guardar automáticamente (sin toast)
          await guardarAccesorios(accesoriosConEstado, { showToast: false });
        }
      } catch (error) {
        console.error('Error al cargar accesorios del modelo:', error);
        // No mostrar error al usuario, solo en consola
      } finally {
        setCargandoAccesorios(false);
      }
    };

    cargarAccesoriosModelo();
  }, []);

  // Extraer datos de recepción desde el equipo (con join a modelos) o comentarios_recepcion como fallback
  const datosRecepcion = React.useMemo(() => {
    // Priorizar datos del equipo con join a modelos
    if (orden.equipo) {
      const marca = orden.equipo.modelo?.marca?.nombre || '';
      const modelo = orden.equipo.modelo?.equipo || '';
      const modeloCompleto = marca && modelo ? `${marca} ${modelo}` : modelo || marca || 'N/A';
      
      // Usar serie_pieza del schema de equipos
      const serie = orden.equipo.serie_pieza || 'N/A';
      
      // El tipo de equipo viene del modelo (campo 'equipo' en la tabla modelos)
      const tipo = orden.equipo.modelo?.equipo || 'N/A';
      
      return {
        modelo: modeloCompleto,
        serie: serie,
        tipo: tipo,
        referencia: orden.equipo.modelo?.referencia || 'N/A',
        descripcion: orden.equipo.descripcion || orden.descripcion_problema || 'N/A'
      };
    }
    
    // Fallback: extraer desde comentarios_recepcion si no hay equipo
    const comentarios = orden.comentarios_recepcion || '';
    const modeloMatch = comentarios.match(/Modelo:\s*(.+)/);
    const serieMatch = comentarios.match(/Serie\/Pieza:\s*(.+)/);
    const tipoMatch = comentarios.match(/Tipo:\s*(.+)/);
    const descripcionMatch = comentarios.match(/Descripción:\s*(.+)/);

    return {
      modelo: modeloMatch?.[1]?.trim() || 'N/A',
      serie: serieMatch?.[1]?.trim() || 'N/A',
      tipo: tipoMatch?.[1]?.trim() || 'N/A',
      referencia: 'N/A',
      descripcion: descripcionMatch?.[1]?.trim() || 'N/A'
    };
  }, [orden.equipo, orden.comentarios_recepcion, orden.descripcion_problema]);

  const guardarAccesorios = async (items: Accesorio[], options?: { showToast?: boolean }) => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { error } = await supabase
        .from('ordenes')
        .update({ esta_accesorios: items, updated_at: crearTimestampColombia() })
        .eq('id', orden.id);
      if (error) throw error;
      updateOrdenFields({ esta_accesorios: items });
      if (options?.showToast !== false) {
        toast.success('Accesorios guardados');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar accesorios');
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    setSubiendoFotos(true);
    try {
      const { subirMultiplesImagenes, actualizarFotosRecepcion } = await import('@/lib/services/imagenService');
      const urls = await subirMultiplesImagenes(orden.id, files, 'recepcion');
      const nuevas = [...fotos, ...urls];
      setFotos(nuevas);
      await actualizarFotosRecepcion(orden.id, nuevas);
      toast.success(`${files.length} foto(s) subida(s)`);
    } catch (err) {
      console.error(err);
      toast.error('Error al subir fotos');
    } finally {
      setSubiendoFotos(false);
    }
  };

  const handleAvanzarADiagnostico = async () => {
    // Validar términos y condiciones
    if (!orden.terminos_aceptados) {
      toast.error('❌ El cliente debe aceptar los términos y condiciones antes de avanzar');
      return;
    }
    
    // Validar firma del cliente
    if (!orden.firma_cliente) {
      toast.error('❌ Debe haber una firma del cliente antes de avanzar');
      return;
    }
    
    setIsLoading(true);
    try {
      // Importar dinámicamente para evitar error de referencia circular
      const { supabase } = await import('@/lib/supabaseClient');
      
      const now = crearTimestampColombia();
      
      // Obtener usuario actual
      const { data: authData } = await supabase.auth.getUser();
      const tecnicoId = authData?.user?.id || null;
      
      // Actualizar la fase de la orden a diagnóstico con fechas automáticas
      const updateData = {
        estado_actual: 'Diagnóstico',
        fecha_fin_recepcion: now,
        tecnico_recepcion: tecnicoId,
        fecha_inicio_diagnostico: now,
        updated_at: now
      };
      
      const { data, error } = await supabase
        .from('ordenes')
        .update(updateData)
        .eq('id', orden.id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("No se pudo actualizar la orden. Verifique que tenga permisos para editar esta orden.");
      }

      if (error) throw error;
      
      // Actualizar localStorage
      updateOrdenFields(updateData);

      toast.success('Orden avanzada a fase de diagnóstico');
      onSuccess();
    } catch (error) {
      console.error('Error al avanzar a diagnóstico:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al avanzar a diagnóstico: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const puedeAvanzar = orden.estado_actual === 'Recepción';
  const puedeEditar = orden.estado_actual === 'Recepción';

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Recepción de Orden
          </h2>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Información registrada al momento de crear la orden
          </p>
        </div>
        
        {/* Botón WhatsApp */}
        <button
          onClick={async () => {
            try {
              await notificarOrdenCreadaWhatsApp(orden.id);
              toast.success('Abriendo WhatsApp...');
            } catch (error) {
              console.error('Error al abrir WhatsApp:', error);
              toast.error('Error al abrir WhatsApp');
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            theme === 'light'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          title="Reenviar mensaje de WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>
      </div>

      {/* Información del equipo */}
      <div className={`rounded-lg border p-4 mb-6 ${
        theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'
      }`}>
        <div className="flex items-start space-x-3">
          <Info className={`w-5 h-5 mt-0.5 ${
            theme === 'light' ? 'text-blue-600' : 'text-blue-400'
          }`} />
          <div>
            <h3 className={`font-medium mb-2 ${
              theme === 'light' ? 'text-blue-900' : 'text-blue-300'
            }`}>
              Datos del Equipo Recibido
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className={`text-xs font-medium mb-1 ${
                  theme === 'light' ? 'text-blue-700' : 'text-blue-400'
                }`}>
                  Tipo de Equipo
                </p>
                <p className={theme === 'light' ? 'text-blue-900' : 'text-blue-200'}>
                  {datosRecepcion.tipo}
                </p>
              </div>
              <div>
                <p className={`text-xs font-medium mb-1 ${
                  theme === 'light' ? 'text-blue-700' : 'text-blue-400'
                }`}>
                  Modelo
                </p>
                <p className={theme === 'light' ? 'text-blue-900' : 'text-blue-200'}>
                  {datosRecepcion.modelo}
                </p>
              </div>
              <div>
                <p className={`text-xs font-medium mb-1 ${
                  theme === 'light' ? 'text-blue-700' : 'text-blue-400'
                }`}>
                  Fecha de Recepción
                </p>
                <p className={theme === 'light' ? 'text-blue-900' : 'text-blue-200'}>
                  {formatearFechaColombiaLarga(orden.fecha_creacion)}
                </p>
              </div>
              <div>
                <p className={`text-xs font-medium mb-1 ${
                  theme === 'light' ? 'text-blue-700' : 'text-blue-400'
                }`}>
                  Referencia
                </p>
                <p className={theme === 'light' ? 'text-blue-900' : 'text-blue-200'}>
                  {datosRecepcion.referencia}
                </p>
              </div>
              <div>
                <p className={`text-xs font-medium mb-1 ${
                  theme === 'light' ? 'text-blue-700' : 'text-blue-400'
                }`}>
                  Serie/Pieza
                </p>
                <p className={theme === 'light' ? 'text-blue-900' : 'text-blue-200'}>
                  {datosRecepcion.serie}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accesorios y estado */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
          <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            Accesorios {cargandoAccesorios && <span className="text-sm font-normal ml-2 text-gray-500">(Cargando...)</span>}
          </h3>
          {puedeEditar && (
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
              <input
                type="text"
                value={nuevoAccesorio}
                onChange={(e) => setNuevoAccesorio(e.target.value)}
                placeholder="Agregar accesorio..."
                className={`w-full sm:w-64 px-3 py-2 border rounded-lg text-sm ${theme === 'light' ? 'border-gray-300 bg-white text-gray-900' : 'border-gray-600 bg-gray-700 text-gray-100'}`}
              />
              <button
                onClick={() => {
                  if (!nuevoAccesorio.trim()) return;
                  const items = [...accesorios, { nombre: nuevoAccesorio.trim(), estado: 'bueno' as EstadoAccesorio }];
                  setAccesorios(items);
                  setNuevoAccesorio('');
                  guardarAccesorios(items);
                }}
                className={`w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${theme === 'light' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-yellow-400 hover:bg-yellow-500 text-black'}`}
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
          )}
        </div>

        {accesorios.length > 0 ? (
          <div className="overflow-x-auto">
            <table className={`w-full border rounded-lg ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
              <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}>
                <tr>
                  <th className={`px-3 py-2 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Descripción</th>
                  <th className={`px-3 py-2 text-center text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Estado</th>
                  {puedeEditar && <th className={`px-3 py-2 text-center text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Acción</th>}
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'}`}>
                {accesorios.map((acc, idx) => (
                  <tr key={`${acc.nombre}-${idx}`}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={acc.nombre}
                        onChange={(e) => {
                          const items = [...accesorios];
                          items[idx].nombre = e.target.value;
                          setAccesorios(items);
                        }}
                        onBlur={() => guardarAccesorios(accesorios)}
                        disabled={!puedeEditar}
                        className={`w-full px-2 py-1 border rounded text-sm ${theme === 'light' ? 'border-gray-300 bg-white text-gray-900' : 'border-gray-600 bg-gray-700 text-gray-100'} disabled:opacity-50`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 justify-center">
                        {(['bueno','regular','malo'] as EstadoAccesorio[]).map(op => (
                          <button
                            key={op}
                            onClick={() => { const items = [...accesorios]; items[idx].estado = op; setAccesorios(items); guardarAccesorios(items, { showToast: false }); }}
                            disabled={!puedeEditar}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              acc.estado === op
                                ? op === 'bueno' ? 'bg-green-500 text-white' : op === 'regular' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                                : theme === 'light' ? 'bg-gray-200 text-gray-700' : 'bg-gray-600 text-gray-300'
                            } disabled:opacity-50`}
                          >
                            {op.charAt(0).toUpperCase() + op.slice(1)}
                          </button>
                        ))}
                      </div>
                    </td>
                    {puedeEditar && (
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => { const items = accesorios.filter((_,i)=>i!==idx); setAccesorios(items); guardarAccesorios(items); }} className="p-1 text-red-600 hover:text-red-700">
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
          <div className={`p-4 text-center border-2 border-dashed rounded-lg ${theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-700'}`}>
            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>No hay accesorios agregados</p>
          </div>
        )}
      </div>

      {/* Fotos de recepción */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className={`text-sm font-medium ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Fotos de recepción {Array.isArray(fotos) && fotos.length > 0 && `(${fotos.length})`}
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
                    void handleFilesSelected(files);
                  }
                  e.currentTarget.value = '';
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
        {Array.isArray(fotos) && fotos.length > 0 ? (
          <ImagenViewer 
            imagenes={fotos}
            onEliminar={puedeEditar ? async (url, index) => {
              try {
                const { eliminarImagenOrden, actualizarFotosRecepcion } = await import('@/lib/services/imagenService');
                await eliminarImagenOrden(url);
                const nuevas = fotos.filter((_, i) => i !== index);
                setFotos(nuevas);
                await actualizarFotosRecepcion(orden.id, nuevas);
                toast.success('Foto eliminada');
              } catch (e) {
                console.error(e);
                toast.error('Error al eliminar foto');
              }
            } : undefined}
            onDescargar={async (url, index) => {
              try {
                const { descargarImagen } = await import('@/lib/services/imagenService');
                const nombreArchivo = `recepcion-${orden.codigo}-foto-${index + 1}.jpg`;
                await descargarImagen(url, nombreArchivo);
                toast.success('Foto descargada');
              } catch (e) {
                console.error(e);
                toast.error('Error al descargar foto');
              }
            }}
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

      {/* Descripción del problema */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Descripción del Problema Reportado
        </h3>
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
        }`}>
          <p className={theme === 'light' ? 'text-gray-900' : 'text-gray-200'}>
            {datosRecepcion.descripcion}
          </p>
        </div>
      </div>

      {/* Información del cliente */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Información del Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className={`text-xs font-medium mb-1 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Nombre/Razón Social
            </p>
            <p className={theme === 'light' ? 'text-gray-900' : 'text-gray-200'}>
              {orden.cliente?.es_juridica 
                ? orden.cliente?.razon_social 
                : orden.cliente?.nombre_comercial || orden.cliente?.razon_social}
            </p>
          </div>
          <div>
            <p className={`text-xs font-medium mb-1 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Identificación
            </p>
            <p className={theme === 'light' ? 'text-gray-900' : 'text-gray-200'}>
              {orden.cliente?.identificacion}
            </p>
          </div>
          <div>
            <p className={`text-xs font-medium mb-1 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Teléfono
            </p>
            <p className={theme === 'light' ? 'text-gray-900' : 'text-gray-200'}>
              {orden.cliente?.telefono || 'No registrado'}
            </p>
          </div>
          <div>
            <p className={`text-xs font-medium mb-1 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Email
            </p>
            <p className={theme === 'light' ? 'text-gray-900' : 'text-gray-200'}>
              {orden.cliente?.correo_electronico || 'No registrado'}
            </p>
          </div>
        </div>
      </div>

      {/* Términos y Condiciones */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Términos y Condiciones
        </h3>
        <div className={`rounded-lg border p-4 ${
          terminosAceptados
            ? theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-800'
            : theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-800'
        }`}>
          <div className="flex items-center gap-3">
            {terminosAceptados ? (
              <>
                <Check className={`w-6 h-6 ${
                  theme === 'light' ? 'text-green-600' : 'text-green-400'
                }`} />
                <div className="flex-1">
                  <p className={`font-medium ${
                    theme === 'light' ? 'text-green-900' : 'text-green-300'
                  }`}>
                    Términos aceptados
                  </p>
                  {fechaAceptacion && (
                    <p className={`text-sm mt-1 ${
                      theme === 'light' ? 'text-green-700' : 'text-green-400'
                    }`}>
                      Fecha: {formatearFechaColombiaLarga(fechaAceptacion)}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle className={`w-6 h-6 ${
                  theme === 'light' ? 'text-red-600' : 'text-red-400'
                }`} />
                <div className="flex-1">
                  <p className={`font-medium ${
                    theme === 'light' ? 'text-red-900' : 'text-red-300'
                  }`}>
                    Términos NO aceptados
                  </p>
                  <p className={`text-sm mt-1 ${
                    theme === 'light' ? 'text-red-700' : 'text-red-400'
                  }`}>
                    El cliente debe aceptar los términos desde la página web
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Firma del Cliente */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Firma del Cliente
        </h3>
        {firmaCliente ? (
          <div>
            <FirmaDisplay 
              firmaBase64={firmaCliente}
              titulo="Firma del Cliente - Recepción"
              className=""
            />
            {fechaFirma && (
              <p className={`text-sm mt-2 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Fecha de firma: {formatearFechaColombiaLarga(fechaFirma)}
              </p>
            )}
          </div>
        ) : (
          <div className={`rounded-lg border p-6 text-center ${
            theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-800'
          }`}>
            <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${
              theme === 'light' ? 'text-red-400' : 'text-red-500'
            }`} />
            <p className={`font-medium mb-1 ${
              theme === 'light' ? 'text-red-900' : 'text-red-300'
            }`}>
              Sin firma del cliente
            </p>
            <p className={`text-sm ${
              theme === 'light' ? 'text-red-700' : 'text-red-400'
            }`}>
              El cliente debe firmar desde la página web al entregar el equipo
            </p>
          </div>
        )}
      </div>

      {/* Información de la orden */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Detalles de la Orden
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className={`text-xs font-medium mb-1 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Tipo de Orden
            </p>
            <p className={theme === 'light' ? 'text-gray-900' : 'text-gray-200'}>
              {orden.tipo_orden || 'Reparación'}
            </p>
          </div>
          <div>
            <p className={`text-xs font-medium mb-1 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Prioridad
            </p>
            <p className={theme === 'light' ? 'text-gray-900' : 'text-gray-200'}>
              {orden.prioridad || 'Normal'}
            </p>
          </div>
          <div>
            <p className={`text-xs font-medium mb-1 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Responsable
            </p>
            <p className={theme === 'light' ? 'text-gray-900' : 'text-gray-200'}>
              {orden.responsable || 'No asignado'}
            </p>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className={`rounded-lg border p-4 mb-6 ${
        theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900/20 border-yellow-800'
      }`}>
        <p className={`text-sm ${
          theme === 'light' ? 'text-yellow-800' : 'text-yellow-300'
        }`}>
          <strong>Nota:</strong> En recepción puedes registrar accesorios y evidencias fotográficas. Avanza a diagnóstico cuando termines.
        </p>
      </div>

      {/* Botón Avanzar a Diagnóstico */}
      {puedeAvanzar && (
        <div className="flex justify-end">
          <button
            onClick={handleAvanzarADiagnostico}
            disabled={isLoading || !orden.terminos_aceptados || !orden.firma_cliente}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={
              !orden.terminos_aceptados 
                ? 'El cliente debe aceptar los términos y condiciones' 
                : !orden.firma_cliente 
                  ? 'Debe haber una firma del cliente' 
                  : 'Avanzar a la siguiente fase'
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Avanzando...
              </>
            ) : (
              <>
                <span>Avanzar a Diagnóstico</span>
                <Check className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
