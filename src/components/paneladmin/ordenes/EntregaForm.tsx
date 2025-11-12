"use client";

import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { subirMultiplesImagenes, eliminarImagenOrden, descargarImagen, actualizarFotosEntrega } from '@/lib/services/imagenService';
import ImagenViewer from './ImagenViewer';
import DropZoneImagenes from './DropZoneImagenes';
import { FirmaDisplay } from '@/components/FirmaPad';
import { updateOrdenFields } from '@/lib/ordenLocalStorage';

interface EntregaFormProps {
  orden: any;
  onSuccess: () => void;
}

export default function EntregaForm({ orden, onSuccess }: EntregaFormProps) {
  const { theme } = useTheme();
  const toast = useToast();

  // Fotos de entrega
  const [fotos, setFotos] = useState<string[]>(orden.fotos_entrega || []);
  const [subiendoFotos, setSubiendoFotos] = useState(false);

  // Usuario automático (usuario actual de la sesión)
  const [usuarioEntrega, setUsuarioEntrega] = useState('');

  // Obtener usuario actual de la sesión
  useEffect(() => {
    const obtenerUsuarioActual = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');

        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData?.user) {
          console.error('Error al obtener usuario:', authError);
          setUsuarioEntrega('Usuario no identificado');
          return;
        }

        const userId = authData.user.id;

        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('nombre, email')
          .eq('id', userId)
          .single();

        if (userError) {
          console.warn('No se encontró usuario en la tabla usuarios, usando email');
          setUsuarioEntrega(authData.user.email || 'Usuario no identificado');
          return;
        }

        const nombreUsuario = userData?.nombre || userData?.email || authData.user.email || 'Usuario no identificado';
        setUsuarioEntrega(nombreUsuario);
      } catch (error) {
        console.error('Error en obtenerUsuarioActual:', error);
        setUsuarioEntrega('Usuario no identificado');
      }
    };

    obtenerUsuarioActual();
  }, []);

// Helper para formatear fecha en formato compatible con input datetime-local (hora local)
const formatForInput = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const tipoEntregaInicial = orden.entrega?.tipo_entrega
  ? orden.entrega.tipo_entrega
  : orden.aprobado_cliente === true
    ? 'Reparado'
    : 'Devuelto';

const [formData, setFormData] = useState({
  tipo_entrega: tipoEntregaInicial,
  fecha_entrega: orden.fecha_entrega ? formatForInput(new Date(orden.fecha_entrega)) : formatForInput(new Date()),
  fecha_proximo_mantenimiento: orden.fecha_proximo_mantenimiento || '',
  calificacion: (orden.entrega?.calificacion ?? orden.calificacion) || '',
  comentarios_cliente: (orden.entrega?.comentarios_cliente ?? orden.comentarios_cliente) || ''
});

  useEffect(() => {
    const tipoEntrega = orden.entrega?.tipo_entrega
      ? orden.entrega.tipo_entrega
      : orden.aprobado_cliente === true
        ? 'Reparado'
        : 'Devuelto';

    setFormData(prev => ({
      ...prev,
      tipo_entrega: tipoEntrega,
      fecha_entrega: orden.fecha_entrega
        ? formatForInput(new Date(orden.fecha_entrega))
        : prev.fecha_entrega || formatForInput(new Date()),
      fecha_proximo_mantenimiento: orden.fecha_proximo_mantenimiento || '',
      calificacion: (orden.entrega?.calificacion ?? orden.calificacion) || '',
      comentarios_cliente: (orden.entrega?.comentarios_cliente ?? orden.comentarios_cliente) || ''
    }));
  }, [
    orden.id,
    orden.entrega?.tipo_entrega,
    orden.aprobado_cliente,
    orden.fecha_entrega,
    orden.fecha_proximo_mantenimiento,
    orden.entrega?.calificacion,
    orden.entrega?.comentarios_cliente,
    orden.calificacion,
    orden.comentarios_cliente
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setSubiendoFotos(true);
    try {
      const urls = await subirMultiplesImagenes(orden.id, files, 'entrega');
      const nuevasFotos = [...fotos, ...urls];
      setFotos(nuevasFotos);

      // Guardar en la base de datos inmediatamente
      await actualizarFotosEntrega(orden.id, nuevasFotos);

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
      await actualizarFotosEntrega(orden.id, nuevasFotos);

      toast.success('Foto eliminada');
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      toast.error('Error al eliminar la foto');
    }
  };

  const handleDescargarFoto = async (url: string, index: number) => {
    try {
      const nombreArchivo = `entrega-${orden.codigo}-foto-${index + 1}.jpg`;
      await descargarImagen(url, nombreArchivo);
      toast.success('Foto descargada');
    } catch (error) {
      console.error('Error al descargar foto:', error);
      toast.error('Error al descargar la foto');
    }
  };

  // Mostrar firma proveniente de otro lugar (solo lectura)
  const [firmaEntrega, setFirmaEntrega] = useState<string | null>(orden.firma_entrega || null);
  const [fechaFirmaEntrega, setFechaFirmaEntrega] = useState<string | null>(orden.fecha_firma_entrega || null);

  useEffect(() => {
    setFirmaEntrega(orden.firma_entrega || null);
    setFechaFirmaEntrega(orden.fecha_firma_entrega || null);
  }, [orden.firma_entrega, orden.fecha_firma_entrega]);

  const puedeEditar = orden.estado_actual === 'Entrega';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Entrega
        </h2>
        <p className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          Finalice y entregue la orden al cliente
        </p>
      </div>

      {/* Mensaje de devolución por no aceptación */}
      {!orden.aprobado_cliente && (
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className={`text-sm font-medium ${
              theme === 'light' ? 'text-red-800' : 'text-red-300'
            }`}>
              El cliente no aceptó la cotización. Este equipo será devuelto sin reparación.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Grid de campos principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de entrega */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Tipo de entrega <span className="text-red-500">*</span>
            </label>
            <div className={`w-full px-4 py-3 border rounded-lg ${
              theme === 'light'
                ? 'border-gray-300 bg-gray-100 text-gray-600'
                : 'border-gray-600 bg-gray-800 text-gray-400'
            }`}>
              {formData.tipo_entrega === 'Reparado' ? 'Reparado' : 'Devuelto (cliente no aceptó reparación)'}
            </div>
          </div>

          {/* Usuario que entrega */}
          <div className={`rounded-lg border p-4 ${
            theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
          }`}>
            <p className={`text-xs font-medium mb-1 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Usuario que entrega
            </p>
            <p className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-200'
            }`}>
              {usuarioEntrega || 'Cargando...'}
            </p>
          </div>

{/* Fecha de entrega (editable) */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Fecha de entrega
            </label>
            <input
              type="datetime-local"
              name="fecha_entrega"
              value={formData.fecha_entrega}
              onChange={handleChange}
              onBlur={async () => {
                try {
                  const { supabase } = await import('@/lib/supabaseClient');
                  const iso = new Date(formData.fecha_entrega).toISOString();
                  const { error } = await supabase
                    .from('ordenes')
                    .update({ fecha_entrega: iso, ultima_actualizacion: new Date().toISOString() })
                    .eq('id', orden.id);
                  if (error) throw error;
                  updateOrdenFields({ fecha_entrega: iso } as any);
                  toast.success('Fecha de entrega actualizada');
                } catch (e) {
                  console.error(e);
                  toast.error('Error al actualizar la fecha de entrega');
                }
              }}
              disabled={!puedeEditar}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>

          {/* Fecha próximo mantenimiento - Solo si fue reparado */}
          {orden.aprobado_cliente && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Fecha próximo mantenimiento
              </label>
              <input
                type="date"
                name="fecha_proximo_mantenimiento"
                value={formData.fecha_proximo_mantenimiento}
                onChange={handleChange}
                onBlur={async () => {
                  if (!formData.fecha_proximo_mantenimiento) return;
                  try {
                    const { supabase } = await import('@/lib/supabaseClient');
                    const { error } = await supabase
                      .from('ordenes')
                      .update({ 
                        fecha_proximo_mantenimiento: formData.fecha_proximo_mantenimiento,
                        ultima_actualizacion: new Date().toISOString() 
                      })
                      .eq('id', orden.id);
                    if (error) throw error;
                    toast.success('Fecha de mantenimiento actualizada');
                  } catch (e) {
                    console.error(e);
                    toast.error('Error al actualizar la fecha de mantenimiento');
                  }
                }}
                disabled={!puedeEditar}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {formData.fecha_proximo_mantenimiento && (
                <p className={`text-xs mt-1 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  🔔 Se enviará un recordatorio automático un día antes
                </p>
              )}
            </div>
          )}
        </div>

        {/* Fotos de entrega */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Fotos de entrega {fotos.length > 0 && `(${fotos.length})`}
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

        {/* Cuidados de Uso del Modelo */}
        {orden.equipo?.modelo?.cuidado_uso && (
          <div className={`rounded-lg border p-6 ${
            theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-700'
          }`}>
            <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
              theme === 'light' ? 'text-blue-900' : 'text-blue-300'
            }`}>
              <AlertCircle className="w-5 h-5" />
              Cuidados de Uso - {orden.equipo?.modelo?.equipo || 'Equipo'}
            </h3>
            <div className={`text-sm whitespace-pre-wrap ${
              theme === 'light' ? 'text-blue-800' : 'text-blue-200'
            }`}>
              {orden.equipo.modelo.cuidado_uso}
            </div>
            <p className={`text-xs mt-3 italic ${
              theme === 'light' ? 'text-blue-600' : 'text-blue-400'
            }`}>
              💡 Esta información se mostrará al cliente en la página de seguimiento
            </p>
          </div>
        )}

        {/* Firma de Entrega (solo visualización) */}
        <div>
          <h3 className={`text-lg font-semibold mb-3 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Firma de Entrega
          </h3>
          {firmaEntrega ? (
            <div>
              <FirmaDisplay 
                firmaBase64={firmaEntrega}
                titulo="Firma del Cliente - Entrega"
                className=""
              />
              {fechaFirmaEntrega && (
                <p className={`text-sm mt-2 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Fecha de firma: {new Date(fechaFirmaEntrega).toLocaleString('es-CO')}
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
                Sin firma de entrega
              </p>
              <p className={`text-sm ${
                theme === 'light' ? 'text-red-700' : 'text-red-400'
              }`}>
                El cliente debe firmar desde la página web
              </p>
            </div>
          )}
        </div>

        {/* Calificación de la orden */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Calificación de la orden
          </label>
          <input
            type="number"
            name="calificacion"
            value={formData.calificacion}
            onChange={handleChange}
            min="1"
            max="5"
            step="0.1"
            placeholder="Calificación (1-5)"
            disabled
            className={`w-full px-4 py-3 border rounded-lg ${
              theme === 'light'
                ? 'border-gray-300 bg-gray-100 text-gray-600'
                : 'border-gray-600 bg-gray-800 text-gray-400'
            }`}
          />
        </div>

        {/* Comentarios del cliente */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Comentarios del cliente
          </label>
          <textarea
            name="comentarios_cliente"
            value={formData.comentarios_cliente || orden.comentarios_cliente}
            onChange={handleChange}
            rows={4}
            placeholder="Comentarios del cliente sobre el servicio..."
            disabled
            className={`w-full px-4 py-3 border rounded-lg ${
              theme === 'light'
                ? 'border-gray-300 bg-gray-100 text-gray-600'
                : 'border-gray-600 bg-gray-800 text-gray-400'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
