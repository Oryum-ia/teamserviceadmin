
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string;

    if (!file || !bucket || !path) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: file, bucket, path' }, 
        { status: 400 }
      );
    }

    console.log(`📤 [API Storage] Subiendo archivo a ${bucket}/${path} (Size: ${file.size})`);

    // Convertir File a Buffer para subida nodejs
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir usando credenciales de Admin (Bypass RLS)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      console.error('❌ [API Storage] Error en upload:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    // Obtener URL Pública
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

    console.log('✅ [API Storage] Subida exitosa:', urlData.publicUrl);
    return NextResponse.json({ publicUrl: urlData.publicUrl });

  } catch (error: any) {
    console.error('❌ [API Storage] Error interno:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
