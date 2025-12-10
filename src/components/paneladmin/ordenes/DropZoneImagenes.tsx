"use client";

import React, { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { Upload, ImageIcon } from 'lucide-react';
import EnterpriseMediaCapture from './EnterpriseMediaCapture';

interface DropZoneImagenesProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export default function DropZoneImagenes({ onFilesSelected, isUploading = false, disabled = false }: DropZoneImagenesProps) {
  const { theme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    // Aceptar imágenes y videos
    const mediaFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (mediaFiles.length > 0) {
      onFilesSelected(mediaFiles);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Aceptar imágenes y videos
    const mediaFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (mediaFiles.length > 0) {
      onFilesSelected(mediaFiles);
    }
    
    // Limpiar el input para permitir subir las mismas imágenes
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Botones de cámara enterprise */}
      <div className="flex justify-center">
        <EnterpriseMediaCapture 
          onCapture={(file) => onFilesSelected([file])}
          onError={(error) => console.error('Media capture error:', error)}
          disabled={disabled || isUploading}
          mode="both"
          autoCompress={true}
          maxSizeMB={10}
          showCompressionInfo={true}
        />
      </div>
      
      {/* Zona de arrastrar y soltar */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
        isDragging
          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 scale-[1.02]'
          : isUploading || disabled
          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
          : theme === 'light'
          ? 'border-gray-300 bg-gray-50 hover:border-yellow-500 hover:bg-yellow-50'
          : 'border-gray-600 bg-gray-800 hover:border-yellow-400 hover:bg-gray-700'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div className="flex flex-col items-center justify-center space-y-3">
        {isUploading ? (
          <>
            <Upload className={`w-12 h-12 animate-bounce ${
              theme === 'light' ? 'text-yellow-500' : 'text-yellow-400'
            }`} />
            <p className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Subiendo archivos...
            </p>
          </>
        ) : (
          <>
            <div className={`p-4 rounded-full ${
              isDragging
                ? 'bg-yellow-100 dark:bg-yellow-900/30'
                : theme === 'light'
                ? 'bg-gray-200'
                : 'bg-gray-700'
            }`}>
              <ImageIcon className={`w-8 h-8 ${
                isDragging
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : theme === 'light'
                  ? 'text-gray-500'
                  : 'text-gray-400'
              }`} />
            </div>
            
            <div>
              <p className={`text-base font-medium mb-1 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                {isDragging ? 'Suelta las imágenes/videos aquí' : 'Arrastra imágenes o videos aquí'}
              </p>
              <p className={`text-sm ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                o haz clic para seleccionar archivos
              </p>
            </div>

            <div className={`flex items-center gap-2 text-xs ${
              theme === 'light' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span>PNG, JPG, GIF, MP4, WEBM hasta 50MB</span>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
