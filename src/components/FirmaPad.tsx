'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check, Pen } from 'lucide-react';

interface FirmaPadProps {
  onSave: (firmaBase64: string) => void;
  onCancel: () => void;
  firmaExistente?: string;
  titulo?: string;
  subtitulo?: string;
}

/**
 * Componente de Firma Digital con Canvas
 * Guarda la firma como Base64 para almacenar en la DB
 */
export default function FirmaPad({
  onSave,
  onCancel,
  firmaExistente,
  titulo = 'Firma Digital',
  subtitulo = 'Dibuje su firma en el recuadro'
}: FirmaPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    canvas.width = 600;
    canvas.height = 300;

    // Configurar estilo de dibujo
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setContext(ctx);

    // Cargar firma existente si hay
    if (firmaExistente) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIsEmpty(false);
      };
      img.src = firmaExistente;
    }
  }, [firmaExistente]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = 'touches' in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = 'touches' in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;

    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const saveFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Convertir canvas a Base64
    const firmaBase64 = canvas.toDataURL('image/png');
    onSave(firmaBase64);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Pen className="w-6 h-6" />
              {titulo}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitulo}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Canvas */}
        <div className="mb-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-auto cursor-crosshair touch-none"
              style={{ maxHeight: '300px' }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            💡 Dibuje con el mouse o use su dedo en dispositivos táctiles
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={clearCanvas}
            disabled={isEmpty}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              bg-gray-100 hover:bg-gray-200 text-gray-700
              dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Limpiar
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors
                bg-gray-100 hover:bg-gray-200 text-gray-700
                dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={saveFirma}
              disabled={isEmpty}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-colors
                bg-green-600 hover:bg-green-700 text-white
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Guardar Firma
            </button>
          </div>
        </div>

        {/* Advertencia */}
        {!isEmpty && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              ✓ Firma capturada. Haga clic en "Guardar Firma" para confirmar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente para mostrar firma guardada
 */
export function FirmaDisplay({ 
  firmaBase64, 
  titulo = 'Firma del Cliente',
  className = ''
}: { 
  firmaBase64: string | null | undefined;
  titulo?: string;
  className?: string;
}) {
  if (!firmaBase64) {
    return (
      <div className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center ${className}`}>
        <Pen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {titulo} no disponible
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {titulo}
      </p>
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white">
        <img 
          src={firmaBase64} 
          alt={titulo}
          className="w-full h-auto max-h-40 object-contain"
        />
      </div>
    </div>
  );
}
