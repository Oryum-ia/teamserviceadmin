"use client";

import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Upload, AlertCircle } from 'lucide-react';
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

const [formData, setFormData] = useState({
  tipo_entrega: orden.entrega?.tipo_entrega || 'Reparada',
  fecha_entrega: orden.fecha_entrega ? formatForInput(new Date(orden.fecha_entrega)) : formatForInput(new Date()),
  fecha_proximo_mantenimiento: orden.entrega?.fecha_proximo_mantenimiento || '',
  calificacion: orden.entrega?.calificacion || '',
  comentarios_cliente: orden.entrega?.comentarios_cliente || ''
});

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
            <select
              name="tipo_entrega"
              value={formData.tipo_entrega}
              onChange={handleChange}
              disabled={!puedeEditar}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="Reparada">Reparada</option>
              <option value="Sin reparar">Sin reparar</option>
              <option value="Reparación parcial">Reparación parcial</option>
              <option value="Reemplazo">Reemplazo</option>
            </select>
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

          {/* Fecha próximo mantenimiento */}
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
              disabled={!puedeEditar}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>
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
                  accept="image/*"
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
            value={formData.comentarios_cliente}
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

        {/* Botones de acción */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        </div>
      </div>
    </div>
  );
}
