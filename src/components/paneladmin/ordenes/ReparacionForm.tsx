"use client";

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { subirMultiplesImagenes, eliminarImagenOrden, descargarImagen, actualizarFotosReparacion } from '@/lib/services/imagenService';
import ImagenViewer from './ImagenViewer';
import DropZoneImagenes from './DropZoneImagenes';

interface ReparacionFormProps {
  orden: any;
  onSuccess: () => void;
}

export default function ReparacionForm({ orden, onSuccess }: ReparacionFormProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fechas automáticas (solo lectura)
  const fechaInicio = orden.fecha_inicio_reparacion || null;
  const fechaFin = orden.fecha_fin_reparacion || null;

  // Usuario automático (usuario actual de la sesión)
  const [usuarioReparacion, setUsuarioReparacion] = React.useState('');

  // Fotos de reparación
  const [fotos, setFotos] = useState<string[]>(orden.fotos_reparacion || []);
  const [subiendoFotos, setSubiendoFotos] = useState(false);

  // Obtener usuario actual de la sesión
  React.useEffect(() => {
    const obtenerUsuarioActual = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');

        // Primero obtener el usuario autenticado
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData?.user) {
          console.error('Error al obtener usuario:', authError);
          setUsuarioReparacion('Usuario no identificado');
          return;
        }

        const userId = authData.user.id;

        // Buscar el nombre en la tabla usuarios
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('nombre, email')
          .eq('id', userId)
          .single();

        if (userError) {
          console.warn('No se encontró usuario en la tabla usuarios, usando email');
          setUsuarioReparacion(authData.user.email || 'Usuario no identificado');
          return;
        }

        const nombreUsuario = userData?.nombre || userData?.email || authData.user.email || 'Usuario no identificado';
        setUsuarioReparacion(nombreUsuario);
      } catch (error) {
        console.error('Error en obtenerUsuarioActual:', error);
        setUsuarioReparacion('Usuario no identificado');
      }
    };

    obtenerUsuarioActual();
  }, []);

  const [formData, setFormData] = useState({
    comentarios: orden.comentarios_reparacion || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setSubiendoFotos(true);
    try {
      const urls = await subirMultiplesImagenes(orden.id, files, 'reparacion');
      const nuevasFotos = [...fotos, ...urls];
      setFotos(nuevasFotos);

      // Guardar en la base de datos inmediatamente
      await actualizarFotosReparacion(orden.id, nuevasFotos);

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
      await actualizarFotosReparacion(orden.id, nuevasFotos);

      toast.success('Foto eliminada');
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      toast.error('Error al eliminar la foto');
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

  const puedeEditar = orden.estado_actual === 'Reparación';

  return (
    <div className="p-6">
      <div className="mb-6">
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

      {!puedeEditar && (
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
                {fechaInicio ? new Date(fechaInicio).toLocaleString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'No registrada'}
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
                {fechaFin ? new Date(fechaFin).toLocaleString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'En proceso'}
              </p>
            </div>
          </div>
        </div>

        {/* Usuario que repara (automático, solo lectura, REQUERIDO) */}
        <div className={`rounded-lg border p-4 ${
          theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Usuario que repara <span className="text-red-500">*</span>
              </p>
              <p className={`text-sm font-medium ${
                theme === 'light' ? 'text-gray-900' : 'text-gray-200'
              }`}>
                {usuarioReparacion || 'Cargando...'}
              </p>
            </div>
          </div>
        </div>

        {/* Fotos de reparación */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Fotos de reparación {fotos.length > 0 && `(${fotos.length})`}
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

        {/* Comentarios de reparación */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Comentarios de reparación
          </label>
          <textarea
            name="comentarios"
            value={formData.comentarios}
            onChange={handleChange}
            rows={6}
            placeholder="Comentarios de reparación"
            disabled={!puedeEditar}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              theme === 'light'
                ? 'border-gray-300 bg-white text-gray-900'
                : 'border-gray-600 bg-gray-700 text-gray-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        </div>
      </div>
    </div>
  );
}
