"use client";

import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { ProductoTienda, Especificacion } from '@/types/database.types';
import { crearProductoTienda, actualizarProducto, subirImagenProducto } from '@/lib/services/productoTiendaService';
import { useToast } from '@/contexts/ToastContext';
import DropZoneImagenes from './ordenes/DropZoneImagenes';
import ImagenViewer from './ordenes/ImagenViewer';
import SearchableSelect from './ordenes/SearchableSelect';
import CategoriaModal from './ordenes/CategoriaModal';
import MarcaModal from './ordenes/MarcaModal';
import { obtenerTodasLasCategorias, type Categoria } from '@/lib/services/categoriaService';
import { obtenerTodasLasMarcas, type Marca } from '@/lib/services/marcaService';

interface ProductoTiendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (producto?: ProductoTienda) => void;
  producto?: ProductoTienda | null;
}

export default function ProductoTiendaModal({ isOpen, onClose, onSuccess, producto }: ProductoTiendaModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showMarcaModal, setShowMarcaModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    descuento: '', // Porcentaje de descuento
    categoria_id: '',
    marca_id: '',
    imagenes: [] as string[],
    tiempo_garantia: '',
    activo: true
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [especificaciones, setEspecificaciones] = useState<Especificacion[]>([]);

  // Cargar categorías y marcas
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [categoriasData, marcasData] = await Promise.all([
          obtenerTodasLasCategorias(),
          obtenerTodasLasMarcas()
        ]);
        setCategorias(categoriasData);
        setMarcas(marcasData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
      }
    };
    cargarDatos();
  }, []);

  // Cargar datos del producto si estamos editando
  useEffect(() => {
    if (producto) {
      // Usar imagenes[] directamente de forma segura
      const imagenesArray = Array.isArray(producto.imagenes) && producto.imagenes.length > 0 
        ? producto.imagenes 
        : [];
      
      // Asegurar que especificaciones sea un array válido
      const especificacionesArray = Array.isArray(producto.especificaciones) && producto.especificaciones.length > 0
        ? producto.especificaciones
        : [];
      
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio ? formatNumber(producto.precio.toString()) : '',
        stock: producto.stock?.toString() || '',
        descuento: producto.descuento ? producto.descuento.toString() : '',
        categoria_id: producto.categoria_id || '',
        marca_id: producto.marca_id || '',
        imagenes: imagenesArray,
        tiempo_garantia: producto.tiempo_garantia || '',
        activo: producto.activo ?? true
      });
      setImagePreviews(imagenesArray);
      setEspecificaciones(especificacionesArray);
    } else {
      // Reset form for new producto
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        descuento: '',
        categoria_id: '',
        marca_id: '',
        imagenes: [],
        tiempo_garantia: '',
        activo: true
      });
      setImagePreviews([]);
      setEspecificaciones([]);
    }
    setError('');
  }, [producto, isOpen]);

  // Formatear números con separador de miles
  const formatNumber = (value: string): string => {
    const num = value.replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(/\./g, ''));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'precio') {
      // Formatear precio con separador de miles
      setFormData(prev => ({ ...prev, [name]: formatNumber(value) }));
    } else if (name === 'descuento') {
      // Solo números para descuento, máximo 100
      const num = value.replace(/\D/g, '');
      if (num === '' || parseInt(num) <= 100) {
        setFormData(prev => ({ ...prev, [name]: num }));
      }
    } else if (name === 'stock') {
      // Solo números para stock
      const num = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: num }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        // Validar tamaño (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} supera los 5MB`);
          continue;
        }
        
        const imageUrl = await subirImagenProducto(file);
        uploadedUrls.push(imageUrl);
      }
      
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          imagenes: [...prev.imagenes, ...uploadedUrls] 
        }));
        setImagePreviews(prev => [...prev, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} imagen(es) cargada(s) exitosamente`);
      }
    } catch (err) {
      console.error('Error al subir imágenes:', err);
      toast.error('Error al subir las imágenes');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEliminarImagen = (url: string, index: number) => {
    try {
      console.log('Eliminando imagen en índice:', index, 'Total:', formData.imagenes.length);
      const nuevasImagenes = formData.imagenes.filter((_, i) => i !== index);
      console.log('Nuevas imágenes:', nuevasImagenes.length);
      setFormData(prev => ({ ...prev, imagenes: nuevasImagenes }));
      setImagePreviews(nuevasImagenes);
      toast.success('Imagen eliminada');
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
      toast.error('Error al eliminar la imagen');
    }
  };

  const handleReordenarImagenes = (nuevasImagenes: string[]) => {
    try {
      setFormData(prev => ({ ...prev, imagenes: nuevasImagenes }));
      setImagePreviews(nuevasImagenes);
    } catch (err) {
      console.error('Error al reordenar imágenes:', err);
      toast.error('Error al reordenar las imágenes');
    }
  };

  // Handlers para especificaciones
  const agregarEspecificacion = () => {
    setEspecificaciones([...especificaciones, { nombre: '', valor: '' }]);
  };

  const eliminarEspecificacion = (index: number) => {
    try {
      console.log('Eliminando especificación en índice:', index, 'Total:', especificaciones.length);
      const nuevasEspecificaciones = especificaciones.filter((_, i) => i !== index);
      console.log('Nuevas especificaciones:', nuevasEspecificaciones.length);
      setEspecificaciones(nuevasEspecificaciones);
      toast.success('Especificación eliminada');
    } catch (err) {
      console.error('Error al eliminar especificación:', err);
      toast.error('Error al eliminar la especificación');
    }
  };

  const actualizarEspecificacion = (index: number, campo: 'nombre' | 'valor', valor: string) => {
    try {
      const nuevas = [...especificaciones];
      if (nuevas[index]) {
        nuevas[index][campo] = valor;
        setEspecificaciones(nuevas);
      }
    } catch (err) {
      console.error('Error al actualizar especificación:', err);
      toast.error('Error al actualizar la especificación');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones básicas
      if (!formData.nombre.trim()) {
        setError('El nombre es requerido');
        setIsLoading(false);
        return;
      }

      // Filtrar especificaciones vacías de forma segura
      const especificacionesValidas = (especificaciones || []).filter(
        e => e && e.nombre && e.valor && e.nombre.trim() !== '' && e.valor.trim() !== ''
      );

      const descuentoNum = formData.descuento ? parseInt(formData.descuento) : 0;
      
      // Asegurar que imagenes sea un array válido
      const imagenesArray = Array.isArray(formData.imagenes) ? formData.imagenes : [];
      
      const productoData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        precio: formData.precio ? parseNumber(formData.precio) : undefined,
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        descuento: descuentoNum, // Porcentaje de descuento
        categoria_id: formData.categoria_id || undefined,
        marca_id: formData.marca_id || undefined,
        imagenes: imagenesArray,
        especificaciones: especificacionesValidas,
        tiempo_garantia: formData.tiempo_garantia.trim() || undefined,
        promocion: descuentoNum > 0, // Si hay descuento > 0, hay promoción
        activo: formData.activo
      };

      let productoGuardado;
      if (producto) {
        // Actualizar producto existente
        productoGuardado = await actualizarProducto(producto.id, productoData);
        toast.success('Producto actualizado exitosamente');
      } else {
        // Crear nuevo producto
        productoGuardado = await crearProductoTienda(productoData);
        toast.success('Producto creado exitosamente');
      }

      // Cerrar modal primero
      onClose();
      // Luego notificar éxito con el producto guardado
      onSuccess(productoGuardado);
    } catch (err) {
      console.error('Error al guardar producto:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el producto';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className={`relative w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
        theme === 'light' ? 'bg-white' : 'bg-gray-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        }`}>
          <h2 className={`text-xl font-semibold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
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

            {/* Imágenes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Imágenes del producto {imagePreviews.length > 0 && `(${imagePreviews.length})`}
                </label>
                
                {/* Botón de subir imágenes */}
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  uploadingImage
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
                        handleImageUpload(files);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <Upload className="w-4 h-4" />
                  <span>{uploadingImage ? 'Subiendo...' : 'Subir imágenes'}</span>
                </label>
              </div>
              
              {imagePreviews.length > 0 && (
                <p className={`text-xs mb-2 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  La primera imagen es la portada. Arrastra para reordenar.
                </p>
              )}
              
              {/* Visualizador de imágenes con drag & drop integrado */}
              {imagePreviews.length > 0 ? (
                <ImagenViewer
                  imagenes={imagePreviews}
                  onEliminar={handleEliminarImagen}
                  puedeEditar={true}
                  onFilesDropped={handleImageUpload}
                  isUploading={uploadingImage}
                  onReordenar={handleReordenarImagenes}
                />
              ) : (
                <DropZoneImagenes
                  onFilesSelected={handleImageUpload}
                  isUploading={uploadingImage}
                />
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Nombre del producto *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
                required
              />
            </div>

            {/* Descripción */}
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

            {/* Categoría y Marca */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchableSelect
                value={formData.categoria_id}
                onChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}
                options={categorias.map(c => ({
                  id: c.id,
                  label: c.nombre,
                  searchText: `${c.nombre} ${c.descripcion || ''}`
                }))}
                placeholder="Seleccionar categoría"
                label="Categoría"
                required={false}
                onCreateNew={() => setShowCategoriaModal(true)}
                createButtonText="Crear nueva categoría"
              />

              <SearchableSelect
                value={formData.marca_id}
                onChange={(value) => setFormData(prev => ({ ...prev, marca_id: value }))}
                options={marcas.map(m => ({
                  id: m.id,
                  label: m.nombre,
                  searchText: `${m.nombre} ${m.pais_origen || ''}`
                }))}
                placeholder="Seleccionar marca"
                label="Marca"
                required={false}
                onCreateNew={() => setShowMarcaModal(true)}
                createButtonText="Crear nueva marca"
              />
            </div>

            {/* Precio, Stock y Descuento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Precio
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    $
                  </span>
                  <input
                    type="text"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    placeholder="0"
                    className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Stock
                </label>
                <input
                  type="text"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
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
                  Descuento
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="descuento"
                    value={formData.descuento}
                    onChange={handleChange}
                    placeholder="0"
                    maxLength={3}
                    className={`w-full pl-3 pr-7 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                  />
                  <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Tiempo de garantía */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Tiempo de garantía
              </label>
              <input
                type="text"
                name="tiempo_garantia"
                value={formData.tiempo_garantia}
                onChange={handleChange}
                placeholder="Ej: 1 año, 6 meses"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
            </div>

            {/* Especificaciones */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Especificaciones {especificaciones.length > 0 && `(${especificaciones.length})`}
                </label>
                <button
                  type="button"
                  onClick={agregarEspecificacion}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  Agregar
                </button>
              </div>

              {especificaciones.length > 0 ? (
                <div className="space-y-2">
                  {especificaciones.map((esp, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        type="text"
                        placeholder="Nombre (ej: Color)"
                        value={esp.nombre}
                        onChange={(e) => actualizarEspecificacion(index, 'nombre', e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${
                          theme === 'light'
                            ? 'border-gray-300 bg-white text-gray-900'
                            : 'border-gray-600 bg-gray-700 text-gray-100'
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Valor (ej: Rojo)"
                        value={esp.valor}
                        onChange={(e) => actualizarEspecificacion(index, 'valor', e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm ${
                          theme === 'light'
                            ? 'border-gray-300 bg-white text-gray-900'
                            : 'border-gray-600 bg-gray-700 text-gray-100'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          eliminarEspecificacion(index);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar especificación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-4 border-2 border-dashed rounded-lg ${
                  theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-700'
                }`}>
                  <p className={`text-sm ${
                    theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    No hay especificaciones. Click en "Agregar" para añadir.
                  </p>
                </div>
              )}
            </div>

            {/* Estado activo */}
            <div>
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
                  Producto activo (visible en la tienda)
                </span>
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
              disabled={isLoading || uploadingImage}
            >
              {isLoading ? 'Guardando...' : producto ? 'Actualizar' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Categoría */}
      <CategoriaModal
        isOpen={showCategoriaModal}
        onClose={() => setShowCategoriaModal(false)}
        onSuccess={async (nuevaCategoria) => {
          // Recargar categorías
          try {
            const data = await obtenerTodasLasCategorias();
            setCategorias(data);
            // Seleccionar la categoría recién creada
            setFormData(prev => ({ ...prev, categoria_id: nuevaCategoria.id }));
          } catch (err) {
            console.error('Error al recargar categorías:', err);
          }
          setShowCategoriaModal(false);
        }}
      />

      {/* Modal de Marca */}
      <MarcaModal
        isOpen={showMarcaModal}
        onClose={() => setShowMarcaModal(false)}
        onSuccess={async (nuevaMarca) => {
          // Recargar marcas
          try {
            const data = await obtenerTodasLasMarcas();
            setMarcas(data);
            // Seleccionar la marca recién creada
            setFormData(prev => ({ ...prev, marca_id: nuevaMarca.id }));
          } catch (err) {
            console.error('Error al recargar marcas:', err);
          }
          setShowMarcaModal(false);
        }}
      />
    </div>
  );
}
