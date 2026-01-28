"use client";

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { getThumbnailUrl, getPreviewUrl } from '@/lib/utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  mode?: 'thumbnail' | 'preview' | 'original';
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
}

/**
 * Componente de imagen optimizada con lazy loading y placeholder
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  mode = 'thumbnail',
  onLoad,
  onError,
  onClick,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determinar URL optimizada según el modo
  const optimizedSrc = React.useMemo(() => {
    if (mode === 'thumbnail') return getThumbnailUrl(src);
    if (mode === 'preview') return getPreviewUrl(src);
    return src; // original
  }, [src, mode]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {/* Placeholder mientras carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}

      {/* Imagen con error */}
      {hasError && (
        <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-xs text-red-600 dark:text-red-400">Error al cargar</p>
          </div>
        </div>
      )}

      {/* Imagen real */}
      <img
        src={optimizedSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
