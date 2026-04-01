import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import crypto from 'crypto';

/**
 * Proxy de thumbnails para imágenes de Supabase Storage.
 * Descarga la imagen original, la redimensiona y comprime con sharp → WebP.
 *
 * GET /api/storage/imagen-thumb?url=<supabase_public_url>&w=400&q=60
 *
 * Parámetros:
 *   url : URL pública de Supabase Storage (requerido)
 *   w   : ancho máximo en px (default: 400, max: 1920)
 *   q   : calidad 1-100   (default: 60,  max: 90)
 *
 * Características:
 *   - Cache en memoria (LRU simple) para evitar re-descargar la misma imagen
 *   - Timeout de 10s en la descarga
 *   - Límite de 20MB en la descarga para proteger la RAM del servidor
 *   - Sanitización de parámetros w y q
 *   - ETag + Cache-Control para que el navegador y CDN cacheen correctamente
 *   - Fallback: si sharp falla, redirige a la URL original (nunca imagen rota)
 *   - Soporte de HEIC/HEIF (fotos iPhone) con conversión automática
 */

// ─── Cache en memoria ────────────────────────────────────────────────────────
// Guarda hasta MAX_CACHE_ENTRIES thumbnails procesados.
// Cuando se llena, elimina la entrada más antigua (FIFO simple).
const MAX_CACHE_ENTRIES = 200;
const MAX_CACHE_BYTES   = 50 * 1024 * 1024; // 50 MB total en RAM

interface CacheEntry {
  buffer: Buffer;
  etag: string;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();
let cacheTotalBytes = 0;

function getCacheKey(url: string, width: number, quality: number): string {
  return `${url}|${width}|${quality}`;
}

function addToCache(key: string, buffer: Buffer): string {
  const etag = `"${crypto.createHash('md5').update(buffer).digest('hex')}"`;

  // Evicción si se supera el límite de entradas o de bytes
  while (
    cache.size >= MAX_CACHE_ENTRIES ||
    cacheTotalBytes + buffer.length > MAX_CACHE_BYTES
  ) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) break;
    const oldEntry = cache.get(oldestKey)!;
    cacheTotalBytes -= oldEntry.buffer.length;
    cache.delete(oldestKey);
  }

  cache.set(key, { buffer, etag, createdAt: Date.now() });
  cacheTotalBytes += buffer.length;
  return etag;
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const DOWNLOAD_TIMEOUT_MS = 10_000;
const MAX_DOWNLOAD_BYTES  = 20 * 1024 * 1024; // 20 MB
const MAX_WIDTH           = 1920;
const MAX_QUALITY         = 90;
const CACHE_MAX_AGE       = 60 * 60; // 1 hora

// ─── Handler ─────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Parámetro url requerido' }, { status: 400 });
  }

  // Validar que sea una URL de Supabase Storage
  if (!url.includes('supabase') && !url.includes('storage')) {
    return NextResponse.json({ error: 'URL no válida' }, { status: 400 });
  }

  // Sanitizar parámetros numéricos
  const width   = Math.min(Math.max(parseInt(searchParams.get('w') || '400', 10), 10), MAX_WIDTH);
  const quality = Math.min(Math.max(parseInt(searchParams.get('q') || '60',  10),  1), MAX_QUALITY);

  const cacheKey = getCacheKey(url, width, quality);

  // ── Servir desde cache si existe ──────────────────────────────────────────
  const cached = cache.get(cacheKey);
  if (cached) {
    // Soporte de ETag / If-None-Match para ahorrar ancho de banda
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === cached.etag) {
      return new NextResponse(null, {
        status: 304,
        headers: buildCacheHeaders(cached.etag),
      });
    }

    return new NextResponse(new Uint8Array(cached.buffer), {
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': cached.buffer.length.toString(),
        ...buildCacheHeaders(cached.etag),
      },
    });
  }

  // ── Descargar imagen original ─────────────────────────────────────────────
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'image/*' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.warn(`⚠️ imagen-thumb: HTTP ${response.status} descargando: ${url.substring(0, 80)}`);
      return NextResponse.redirect(url, 302);
    }

    // Validar Content-Type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      console.warn(`⚠️ imagen-thumb: Content-Type inesperado (${contentType})`);
      return NextResponse.redirect(url, 302);
    }

    // Leer con límite de tamaño para proteger la RAM
    const buffer = await readWithSizeLimit(response, MAX_DOWNLOAD_BYTES);
    if (!buffer) {
      console.warn(`⚠️ imagen-thumb: Imagen supera ${MAX_DOWNLOAD_BYTES / 1024 / 1024}MB, redirigiendo`);
      return NextResponse.redirect(url, 302);
    }

    if (buffer.length < 100) {
      console.warn(`⚠️ imagen-thumb: Buffer muy pequeño (${buffer.length} bytes)`);
      return NextResponse.redirect(url, 302);
    }

    // ── Procesar con sharp ────────────────────────────────────────────────
    const thumbnail = await processWithSharp(buffer, width, quality);
    if (!thumbnail) {
      // sharp falló (ej. HEIC sin soporte nativo, archivo corrupto)
      return NextResponse.redirect(url, 302);
    }

    const etag = addToCache(cacheKey, thumbnail);

    return new NextResponse(new Uint8Array(thumbnail), {
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': thumbnail.length.toString(),
        ...buildCacheHeaders(etag),
      },
    });

  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.warn(`⚠️ imagen-thumb: Timeout (${DOWNLOAD_TIMEOUT_MS}ms) descargando imagen`);
    } else {
      console.error('❌ imagen-thumb: Error inesperado:', error?.message || error);
    }
    // Siempre redirigir a la original — nunca devolver imagen rota
    return NextResponse.redirect(url, 302);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Lee el body de la respuesta con un límite de bytes.
 * Retorna null si se supera el límite.
 */
async function readWithSizeLimit(response: Response, maxBytes: number): Promise<Buffer | null> {
  const reader = response.body?.getReader();
  if (!reader) return Buffer.from(await response.arrayBuffer());

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.length;
    if (totalBytes > maxBytes) {
      reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

/**
 * Procesa la imagen con sharp.
 * Intenta HEIC → JPEG como fallback si el formato no es soportado directamente.
 * Retorna null si no se puede procesar.
 */
async function processWithSharp(buffer: Buffer, width: number, quality: number): Promise<Buffer | null> {
  try {
    return await sharp(buffer)
      .resize(width, width, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  } catch (firstError: any) {
    // Intentar forzar el formato como JPEG antes de convertir (útil para HEIC/HEIF)
    try {
      console.warn(`⚠️ imagen-thumb: sharp falló (${firstError?.message}), intentando con formato forzado`);
      return await sharp(buffer, { failOn: 'none' })
        .resize(width, width, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
    } catch (secondError: any) {
      console.error(`❌ imagen-thumb: sharp no pudo procesar la imagen: ${secondError?.message}`);
      return null;
    }
  }
}

/**
 * Headers de cache comunes para respuestas exitosas y 304.
 */
function buildCacheHeaders(etag: string): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`,
    'ETag': etag,
    'Vary': 'Accept-Encoding',
  };
}
