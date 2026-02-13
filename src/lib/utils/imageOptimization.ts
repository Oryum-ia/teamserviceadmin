/**
 * Utilidades para optimización de imágenes de Supabase Storage
 * Usa el proxy /api/storage/imagen-thumb que comprime con sharp en el servidor
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Genera URL optimizada usando el proxy del servidor con sharp.
 * El proxy descarga la imagen original, la redimensiona y comprime a WebP.
 * Resultado: imágenes de 3-15KB en vez de 400KB+.
 * 
 * Si la URL no es de Supabase o es un video, devuelve sin cambios.
 */
export function optimizeSupabaseImageUrl(
  url: string,
  options: ImageTransformOptions = {}
): string {
  if (!url) return url;

  // Si no es una URL de Supabase Storage, devolver sin cambios
  if (!url.includes('supabase') && !url.includes('storage')) {
    return url;
  }

  // No optimizar videos
  if (url.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
    return url;
  }

  try {
    const w = options.width || 400;
    const q = options.quality || 60;
    return `/api/storage/imagen-thumb?url=${encodeURIComponent(url)}&w=${w}&q=${q}`;
  } catch (error) {
    console.error('Error al optimizar URL de imagen:', error);
    return url;
  }
}

/**
 * Genera URL optimizada para miniaturas (thumbnails)
 * Usada en grids y listas — 400px, calidad 50
 */
export function getThumbnailUrl(url: string): string {
  return optimizeSupabaseImageUrl(url, {
    width: 400,
    quality: 50,
  });
}

/**
 * Genera URL optimizada para vista previa (medium)
 * Usada en lightbox en móvil — 800px, calidad 70
 */
export function getPreviewUrl(url: string): string {
  return optimizeSupabaseImageUrl(url, {
    width: 800,
    quality: 70,
  });
}

/**
 * Genera URL optimizada para vista completa (large)
 * Usada en lightbox en desktop — 1200px, calidad 80
 */
export function getFullUrl(url: string): string {
  return optimizeSupabaseImageUrl(url, {
    width: 1200,
    quality: 80,
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
