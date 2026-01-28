/**
 * Utilidades para optimización de imágenes de Supabase Storage
 * Usa la API de transformación de imágenes de Supabase
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Transforma una URL de Supabase Storage para usar renderizado optimizado
 * Ejemplo:
 * - Original: https://xxx.supabase.co/storage/v1/object/public/bucket/path.jpg
 * - Optimizada: https://xxx.supabase.co/storage/v1/render/image/public/bucket/path.jpg?width=400&quality=75
 */
export function optimizeSupabaseImageUrl(
  url: string,
  options: ImageTransformOptions = {}
): string {
  if (!url) return url;

  // Si no es una URL de Supabase Storage, devolver sin cambios
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }

  // No optimizar videos
  if (url.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
    return url;
  }

  try {
    // Convertir de /object/public/ a /render/image/public/
    const optimizedUrl = url.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );

    // Construir query params
    const params = new URLSearchParams();

    if (options.width) {
      params.append('width', options.width.toString());
    }

    if (options.height) {
      params.append('height', options.height.toString());
    }

    if (options.quality) {
      params.append('quality', options.quality.toString());
    }

    if (options.format) {
      params.append('format', options.format);
    }

    // Si no hay parámetros, devolver URL sin transformar
    if (params.toString() === '') {
      return url;
    }

    // Agregar parámetros a la URL
    return `${optimizedUrl}?${params.toString()}`;
  } catch (error) {
    console.error('Error al optimizar URL de imagen:', error);
    return url; // Fallback a URL original
  }
}

/**
 * Genera URL optimizada para miniaturas (thumbnails)
 * Usada en grids y listas
 */
export function getThumbnailUrl(url: string): string {
  return optimizeSupabaseImageUrl(url, {
    width: 400,
    quality: 75,
    format: 'webp'
  });
}

/**
 * Genera URL optimizada para vista previa (medium)
 * Usada en lightbox en móvil
 */
export function getPreviewUrl(url: string): string {
  return optimizeSupabaseImageUrl(url, {
    width: 1280,
    quality: 85,
    format: 'webp'
  });
}

/**
 * Genera URL optimizada para vista completa (large)
 * Usada en lightbox en desktop
 */
export function getFullUrl(url: string): string {
  return optimizeSupabaseImageUrl(url, {
    width: 1920,
    quality: 90,
    format: 'webp'
  });
}

/**
 * Hook de React para detectar si un elemento es visible (lazy loading)
 */
export function isImageVisible(element: HTMLElement | null): boolean {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
