"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Image as ImageIcon, ArrowUp, ArrowDown, X } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { CarruselImagen } from '@/types/database.types';
import { 
  obtenerTodasLasImagenes, 
  eliminarImagen, 
  toggleActivoImagen,
  crearImagenCarrusel,
  actualizarImagen,
  subirImagenCarrusel,
  actualizarOrdenImagenes
} from '@/lib/services/carruselService';
import DropZoneImagenes from './ordenes/DropZoneImagenes';
import ImagenViewer from './ordenes/ImagenViewer';

export default function Carrusel() {
  const { theme } = useTheme();
  const toast = useToast();
  
  const [imagenes, setImagenes] = useState<CarruselImagen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImagen, setSelectedImagen] = useState<CarruselImagen | null>(null);

  useEffect(() => {
    cargarImagenes();
  }, []);

  const cargarImagenes = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerTodasLasImagenes();
      setImagenes(data);
    } catch (err) {
      console.error('Error al cargar imágenes:', err);
      toast.error('Error al cargar las imágenes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`¿Está seguro de eliminar "${titulo || 'esta imagen'}"?`)) {
      return;
    }

    try {
      await eliminarImagen(id);
      toast.success('Imagen eliminada exitosamente');
      cargarImagenes();
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
      toast.error('Error al eliminar la imagen');
    }
  };

  const handleToggleActivo = async (id: string, activo: boolean) => {
    try {
      await toggleActivoImagen(id, !activo);
      toast.success(`Imagen ${!activo ? 'activada' : 'desactivada'} exitosamente`);
      cargarImagenes();
    } catch (err) {
      console.error('Error al cambiar estado de la imagen:', err);
      toast.error('Error al cambiar el estado de la imagen');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const newImagenes = [...imagenes];
    [newImagenes[index - 1], newImagenes[index]] = [newImagenes[index], newImagenes[index - 1]];
    
    try {
      const updates = newImagenes.map((img, idx) => ({ id: img.id, orden: idx }));
      await actualizarOrdenImagenes(updates);
      setImagenes(newImagenes);
      toast.success('Orden actualizado');
    } catch (err) {
      console.error('Error al actualizar orden:', err);
      toast.error('Error al actualizar el orden');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === imagenes.length - 1) return;
    
    const newImagenes = [...imagenes];
    [newImagenes[index], newImagenes[index + 1]] = [newImagenes[index + 1], newImagenes[index]];
    
    try {
      const updates = newImagenes.map((img, idx) => ({ id: img.id, orden: idx }));
      await actualizarOrdenImagenes(updates);
      setImagenes(newImagenes);
      toast.success('Orden actualizado');
    } catch (err) {
      console.error('Error al actualizar orden:', err);
      toast.error('Error al actualizar el orden');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Carrusel de Imágenes
          </h1>
          <p className={`text-sm ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            Gestiona las imágenes del carrusel de la landing page
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedImagen(null);
            setIsModalOpen(true);
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
            theme === 'light'
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
              : 'bg-yellow-400 hover:bg-yellow-500 text-black'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Imagen</span>
        </button>
      </div>

      {/* Grid de imágenes */}
      {imagenes.length === 0 ? (
        <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
          theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-800'
        }`}>
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
            No hay imágenes en el carrusel
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imagenes.map((imagen, index) => (
            <div
              key={imagen.id}
              className={`rounded-lg overflow-hidden shadow-lg transition-all ${
                theme === 'light' ? 'bg-white' : 'bg-gray-800'
              }`}
            >
              {/* Imagen */}
              <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                {imagen.imagen_url ? (
                  <img
                    src={imagen.imagen_url}
                    alt={imagen.titulo || 'Imagen del carrusel'}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      setSelectedImagen(imagen);
                      setIsModalOpen(true);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {/* Badge de orden */}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    theme === 'light' ? 'bg-yellow-500 text-white' : 'bg-yellow-400 text-black'
                  }`}>
                    #{index + 1}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h3 className={`font-semibold mb-2 truncate ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  {imagen.titulo || 'Sin título'}
                </h3>
                
                {imagen.descripcion && (
                  <p className={`text-sm mb-3 line-clamp-2 ${
                    theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {imagen.descripcion}
                  </p>
                )}

                {/* Acciones */}
                <div className="flex items-center justify-between mt-4">
                  {/* Toggle activo */}
                  <button
                    onClick={() => handleToggleActivo(imagen.id, imagen.activo ?? false)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      imagen.activo ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        imagen.activo ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  {/* Botones de orden */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        theme === 'light'
                          ? 'hover:bg-gray-100 text-gray-600'
                          : 'hover:bg-gray-700 text-gray-400'
                      }`}
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === imagenes.length - 1}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        theme === 'light'
                          ? 'hover:bg-gray-100 text-gray-600'
                          : 'hover:bg-gray-700 text-gray-400'
                      }`}
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(imagen.id, imagen.titulo || '')}
                      className="p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CarruselModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedImagen(null);
        }}
        onSuccess={() => {
          cargarImagenes();
          setIsModalOpen(false);
          setSelectedImagen(null);
        }}
        imagen={selectedImagen}
        ordenActual={imagenes.length}
      />
    </div>
  );
}

// Modal para crear/editar imagen del carrusel
interface CarruselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  imagen?: CarruselImagen | null;
  ordenActual: number;
}

function CarruselModal({ isOpen, onClose, onSuccess, imagen, ordenActual }: CarruselModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    imagen_url: '',
    orden: 0,
    activo: true
  });

  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (imagen) {
      setFormData({
        titulo: imagen.titulo || '',
        descripcion: imagen.descripcion || '',
        imagen_url: imagen.imagen_url,
        orden: imagen.orden ?? 0,
        activo: imagen.activo ?? true
      });
      setImagePreview(imagen.imagen_url);
    } else {
      setFormData({
        titulo: '',
        descripcion: '',
        imagen_url: '',
        orden: ordenActual,
        activo: true
      });
      setImagePreview('');
    }
  }, [imagen, isOpen, ordenActual]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await subirImagenCarrusel(file);
      setFormData(prev => ({ ...prev, imagen_url: imageUrl }));
      setImagePreview(imageUrl);
      toast.success('Imagen cargada exitosamente');
    } catch (err) {
      console.error('Error al subir imagen:', err);
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEliminarImagen = () => {
    setFormData(prev => ({ ...prev, imagen_url: '' }));
    setImagePreview('');
    toast.success('Imagen eliminada');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.imagen_url) {
        toast.error('Debes cargar una imagen');
        setIsLoading(false);
        return;
      }

      const imagenData = {
        titulo: formData.titulo || undefined,
        descripcion: formData.descripcion || undefined,
        imagen_url: formData.imagen_url,
        orden: formData.orden,
        activo: formData.activo
      };

      if (imagen) {
        await actualizarImagen(imagen.id, imagenData);
        toast.success('Imagen actualizada exitosamente');
      } else {
        await crearImagenCarrusel(imagenData);
        toast.success('Imagen creada exitosamente');
      }

      onSuccess();
    } catch (err) {
      console.error('Error al guardar imagen:', err);
      toast.error('Error al guardar la imagen');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className={`relative w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
        theme === 'light' ? 'bg-white' : 'bg-gray-800'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        }`}>
          <h2 className={`text-xl font-semibold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {imagen ? 'Editar Imagen' : 'Nueva Imagen'}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${
            theme === 'light' ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-700 text-gray-400'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Imagen */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Imagen *
              </label>
              
              {imagePreview ? (
                <ImagenViewer
                  imagenes={[imagePreview]}
                  onEliminar={handleEliminarImagen}
                  puedeEditar={true}
                  onFilesDropped={handleImageUpload}
                  isUploading={uploadingImage}
                />
              ) : (
                <DropZoneImagenes
                  onFilesSelected={handleImageUpload}
                  isUploading={uploadingImage}
                />
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Título
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
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
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
              />
              <span className={`text-sm font-medium ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Activo
              </span>
            </label>
          </div>

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
              disabled={isLoading || uploadingImage}
            >
              {isLoading ? 'Guardando...' : imagen ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
