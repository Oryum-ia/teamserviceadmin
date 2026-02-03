"use client";

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropper({ 
  imageSrc, 
  onCropComplete, 
  onCancel,
  aspectRatio = 16 / 9,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.82
}: ImageCropperProps) {
  const { theme } = useTheme();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionQuality, setCompressionQuality] = useState(quality);
  const [estimatedSize, setEstimatedSize] = useState<string>('');

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    quality = 0.82
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No se pudo obtener el contexto del canvas');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    // Calcular dimensiones finales con límite máximo
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;
    
    let finalWidth = pixelCrop.width;
    let finalHeight = pixelCrop.height;

    // Redimensionar si excede los límites
    if (finalWidth > MAX_WIDTH || finalHeight > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / finalWidth, MAX_HEIGHT / finalHeight);
      finalWidth = Math.round(finalWidth * ratio);
      finalHeight = Math.round(finalHeight * ratio);
    }

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    // Aplicar suavizado para mejor calidad al redimensionar
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Dibujar la imagen recortada y redimensionada
    ctx.drawImage(
      canvas,
      Math.round(safeArea / 2 - image.width * 0.5 - pixelCrop.x),
      Math.round(safeArea / 2 - image.height * 0.5 - pixelCrop.y),
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      finalWidth,
      finalHeight
    );

    // Crear un canvas temporal para el recorte
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      throw new Error('No se pudo obtener el contexto del canvas temporal');
    }

    tempCanvas.width = safeArea;
    tempCanvas.height = safeArea;

    tempCtx.translate(safeArea / 2, safeArea / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.translate(-safeArea / 2, -safeArea / 2);

    tempCtx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      tempCanvas,
      Math.round(safeArea / 2 - image.width * 0.5 - pixelCrop.x),
      Math.round(safeArea / 2 - image.height * 0.5 - pixelCrop.y),
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      finalWidth,
      finalHeight
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Error al crear el blob de la imagen'));
        }
      }, 'image/jpeg', quality);
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        compressionQuality
      );
      onCropComplete(croppedImageBlob);
    } catch (error) {
      console.error('Error al recortar la imagen:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Calcular tamaño estimado cuando cambia la calidad o el área de recorte
  const updateEstimatedSize = async () => {
    if (!croppedAreaPixels) return;
    
    try {
      const blob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        compressionQuality
      );
      const sizeInKB = (blob.size / 1024).toFixed(0);
      const sizeInMB = (blob.size / 1024 / 1024).toFixed(2);
      
      if (blob.size > 1024 * 1024) {
        setEstimatedSize(`${sizeInMB} MB`);
      } else {
        setEstimatedSize(`${sizeInKB} KB`);
      }
    } catch (error) {
      console.error('Error al calcular tamaño:', error);
    }
  };

  // Actualizar tamaño estimado cuando cambia la calidad
  React.useEffect(() => {
    if (croppedAreaPixels) {
      const timer = setTimeout(() => {
        updateEstimatedSize();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [compressionQuality, croppedAreaPixels]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 ${
        theme === 'light' ? 'bg-white border-b border-gray-200' : 'bg-gray-800 border-b border-gray-700'
      }`}>
        <h2 className={`text-lg font-semibold ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Recortar Imagen
        </h2>
        <button
          onClick={onCancel}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'light' ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-700 text-gray-400'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Cropper Area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspectRatio}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
          style={{
            containerStyle: {
              backgroundColor: '#000',
            },
            cropAreaStyle: {
              border: '2px solid #EAB308',
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className={`p-4 space-y-4 ${
        theme === 'light' ? 'bg-white border-t border-gray-200' : 'bg-gray-800 border-t border-gray-700'
      }`}>
        {/* Zoom Control */}
        <div className="flex items-center gap-3">
          <ZoomOut className={`w-5 h-5 flex-shrink-0 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Zoom
              </span>
              <span className={`text-xs ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {zoom.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
          <ZoomIn className={`w-5 h-5 flex-shrink-0 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`} />
        </div>

        {/* Compression Quality Control */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium flex-shrink-0 ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Calidad
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {compressionQuality < 0.6 ? 'Baja' : compressionQuality < 0.8 ? 'Media' : 'Alta'}
              </span>
              <span className={`text-xs font-medium ${
                estimatedSize ? (theme === 'light' ? 'text-yellow-600' : 'text-yellow-400') : ''
              }`}>
                {estimatedSize || 'Calculando...'}
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={0.95}
              step={0.05}
              value={compressionQuality}
              onChange={(e) => setCompressionQuality(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Info sobre compresión */}
        <div className={`text-xs p-2 rounded ${
          theme === 'light' ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/20 text-blue-300'
        }`}>
          💡 Menor calidad = archivo más pequeño. Recomendado: 70-85% para web
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleRotate}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'light'
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            Rotar 90°
          </button>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isProcessing}
            >
              <Check className="w-4 h-4" />
              {isProcessing ? 'Procesando...' : 'Aplicar Recorte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
