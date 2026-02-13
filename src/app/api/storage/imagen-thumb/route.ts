import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

/**
 * API Route proxy para generar thumbnails ultra-livianos de imágenes de Supabase Storage.
 * Descarga la imagen original del servidor (sin CORS), la redimensiona y comprime con sharp.
 * 
 * GET /api/storage/imagen-thumb?url=<supabase_public_url>&w=120&q=30
 * 
 * Parámetros:
 *   url: URL pública de Supabase Storage (requerido)
 *   w: ancho máximo en px (default: 120)
 *   q: calidad 1-100 (default: 30)
 * 
 * Retorna: imagen WebP comprimida (~2-8KB en vez de 400KB+)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const width = parseInt(searchParams.get('w') || '120', 10);
    const quality = parseInt(searchParams.get('q') || '30', 10);

    if (!url) {
      return NextResponse.json({ error: 'Parámetro url requerido' }, { status: 400 });
    }

    // Validar que sea una URL de Supabase Storage
    if (!url.includes('supabase') && !url.includes('storage')) {
      return NextResponse.json({ error: 'URL no válida' }, { status: 400 });
    }

    // Descargar imagen original desde Supabase (server-side, sin CORS)
    const response = await fetch(url, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error descargando imagen: ${response.status}` },
        { status: response.status }
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Redimensionar y comprimir con sharp → WebP
    const thumbnail = await sharp(buffer)
      .resize(width, width, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    // Retornar imagen comprimida con cache de 1 hora
    return new NextResponse(new Uint8Array(thumbnail), {
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': thumbnail.length.toString(),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error en imagen-thumb:', error);
    return NextResponse.json(
      { error: 'Error procesando imagen' },
      { status: 500 }
    );
  }
}
