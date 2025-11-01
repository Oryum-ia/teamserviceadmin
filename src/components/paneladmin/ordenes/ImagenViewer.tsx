"use client";

import React, { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { X, ChevronLeft, ChevronRight, Download, Trash2, Upload } from 'lucide-react';

interface ImagenViewerProps {
  imagenes: string[];
  onEliminar?: (url: string, index: number) => void;
  onDescargar?: (url: string, index: number) => void;
  puedeEditar?: boolean;
  onFilesDropped?: (files: File[]) => void;
  isUploading?: boolean;
  onReordenar?: (nuevasImagenes: string[]) => void; // Nueva prop
}

export default function ImagenViewer({ imagenes, onEliminar, onDescargar, puedeEditar = true, onFilesDropped, isUploading = false, onReordenar }: ImagenViewerProps) {
  const { theme } = useTheme();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = React.useRef(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const abrirLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const cerrarLightbox = () => {
    setLightboxOpen(false);
  };

  const siguiente = () => {
    setCurrentIndex((prev) => (prev + 1) % imagenes.length);
  };

  const anterior = () => {
    setCurrentIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  const handleEliminar = (e: React.MouseEvent, url: string, index: number) => {
    e.stopPropagation();
    if (onEliminar) {
      onEliminar(url, index);
    }
  };

  const handleDescargar = (url: string, index: number) => {
    if (onDescargar) {
      onDescargar(url, index);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!lightboxOpen) return;
    
    if (e.key === 'ArrowRight') siguiente();
    if (e.key === 'ArrowLeft') anterior();
    if (e.key === 'Escape') cerrarLightbox();
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // Bloquear scroll del body cuando el lightbox está abierto
  React.useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen]);

  const handleDragEnter = (e: React.DragEvent) => {
    // Solo manejar si estamos arrastrando archivos desde fuera, no imágenes internas
    if (!puedeEditar || isUploading || !onFilesDropped || draggedIndex !== null) return;
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) {
        setIsDraggingOver(true);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Solo prevenir default si es drag de archivos externos
    if (!puedeEditar || isUploading || draggedIndex !== null) return;
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!puedeEditar || isUploading || !onFilesDropped || draggedIndex !== null) return;
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDraggingOver(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    // Solo manejar si son archivos externos, no drag interno de imágenes
    if (draggedIndex !== null) return;
    
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);

    if (!puedeEditar || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0 && onFilesDropped) {
      onFilesDropped(imageFiles);
    }
  };

  // Handlers para reordenar imágenes
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    if (!puedeEditar || !onReordenar) return;
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    if (!puedeEditar || !onReordenar || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    // Delay para evitar que el click se dispare después del drag
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!puedeEditar || !onReordenar || draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const nuevasImagenes = [...imagenes];
    const [imagenArrastrada] = nuevasImagenes.splice(draggedIndex, 1);
    nuevasImagenes.splice(dropIndex, 0, imagenArrastrada);
    onReordenar(nuevasImagenes);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (imagenes.length === 0) {
    return null;
  }

  return (
    <>
      {/* Grid de miniaturas con drop zone */}
      <div 
        className={`relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 rounded-lg transition-all ${
          isDraggingOver && puedeEditar && !isUploading
            ? 'ring-2 ring-yellow-500 ring-offset-2 bg-yellow-50 dark:bg-yellow-900/20 p-4'
            : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Overlay cuando se arrastra imagen */}
        {isDraggingOver && puedeEditar && !isUploading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-yellow-400/90 dark:bg-yellow-500/90 rounded-lg border-4 border-dashed border-yellow-600 dark:border-yellow-300">
            <div className="text-center">
              <div className="text-white text-xl font-bold mb-2">Suelta para subir</div>
              <div className="text-white/90 text-sm">Las imágenes se añadirán aquí</div>
            </div>
          </div>
        )}
        {imagenes.map((url, index) => (
          <div
            key={index}
            draggable={puedeEditar && onReordenar ? true : false}
            onDragStart={(e) => handleImageDragStart(e, index)}
            onDragOver={(e) => handleImageDragOver(e, index)}
            onDragEnd={handleImageDragEnd}
            onDrop={(e) => handleImageDrop(e, index)}
            className={`relative aspect-square rounded-lg border transition-all group select-none ${
              draggedIndex === index
                ? 'opacity-40 scale-95 cursor-grabbing'
                : dragOverIndex === index
                ? 'ring-4 ring-yellow-500 scale-105 shadow-lg'
                : puedeEditar && onReordenar
                ? 'cursor-grab active:cursor-grabbing hover:shadow-md'
                : 'cursor-pointer'
            } ${
              theme === 'light' ? 'border-gray-200 hover:border-yellow-500' : 'border-gray-700 hover:border-yellow-400'
            }`}
            onClick={(e) => {
              if (!isDragging) {
                abrirLightbox(index);
              }
            }}
          >
            <img
              src={url}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            
            {/* Overlay con botones */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                {puedeEditar && onEliminar && (
                  <button
                    onClick={(e) => handleEliminar(e, url, index)}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Contador y badge de portada */}
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
              {index + 1}/{imagenes.length}
            </div>
            {index === 0 && imagenes.length > 1 && (
              <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-bold rounded ${
                theme === 'light' ? 'bg-yellow-500 text-white' : 'bg-yellow-400 text-black'
              }`}>
                Portada
              </div>
            )}
            {puedeEditar && onReordenar && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Arrastra para reordenar
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <div className="text-white text-sm">
              Foto {currentIndex + 1} de {imagenes.length}
            </div>
            <div className="flex items-center gap-2">
              {onDescargar && (
                <button
                  onClick={() => handleDescargar(imagenes[currentIndex], currentIndex)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Descargar"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              {puedeEditar && onEliminar && (
                <button
                  onClick={(e) => {
                    handleEliminar(e, imagenes[currentIndex], currentIndex);
                    if (imagenes.length === 1) {
                      cerrarLightbox();
                    } else if (currentIndex === imagenes.length - 1) {
                      setCurrentIndex(currentIndex - 1);
                    }
                  }}
                  className="p-2 text-white hover:bg-red-600 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={cerrarLightbox}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Cerrar (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navegación izquierda */}
          {imagenes.length > 1 && (
            <button
              onClick={anterior}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              title="Anterior (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Imagen principal */}
          <div className="max-w-7xl max-h-[85vh] p-4">
            <img
              src={imagenes[currentIndex]}
              alt={`Foto ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Navegación derecha */}
          {imagenes.length > 1 && (
            <button
              onClick={siguiente}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              title="Siguiente (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Miniaturas inferiores */}
          {imagenes.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                {imagenes.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-yellow-500 scale-110'
                        : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Miniatura ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
