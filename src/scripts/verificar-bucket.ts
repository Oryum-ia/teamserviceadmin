/**
 * Script para verificar y crear el bucket de imágenes en Supabase
 * 
 * Ejecutar desde la consola del navegador o desde Node.js
 */

import { getSupabase } from '@/lib/supabaseClient';

const BUCKET_NAME = 'ordenes-imagenes';

export async function verificarYCrearBucket() {
  const supabase = getSupabase();
  if (!supabase) {
    console.error('❌ Cliente Supabase no disponible. Faltan variables de entorno.');
    return { success: false, error: 'Cliente Supabase no disponible' };
  }

  try {
    console.log('🔍 Verificando bucket:', BUCKET_NAME);
    
    // Verificar si el bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error al listar buckets:', listError);
      return { success: false, error: listError };
    }
    
    console.log('📦 Buckets disponibles:', buckets?.map(b => b.name));
    
    const bucketExiste = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (bucketExiste) {
      console.log('✅ El bucket ya existe:', BUCKET_NAME);
      
      // Verificar permisos
      const { data: testUpload, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload('test-verification.txt', new Blob(['test']), {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('❌ Error al probar subida (verificar permisos):', uploadError);
        return { 
          success: false, 
          error: uploadError,
          message: 'El bucket existe pero no tiene permisos de escritura'
        };
      }
      
      // Eliminar archivo de prueba
      await supabase.storage.from(BUCKET_NAME).remove(['test-verification.txt']);
      
      console.log('✅ El bucket tiene permisos correctos');
      return { success: true, message: 'Bucket verificado correctamente' };
    }
    
    // Si no existe, intentar crearlo
    console.log('📝 Intentando crear bucket:', BUCKET_NAME);
    
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true, // Hacer público para acceder a las URLs
      fileSizeLimit: 10485760, // 10MB máximo por archivo
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });
    
    if (createError) {
      console.error('❌ Error al crear bucket:', createError);
      console.log('ℹ️ Posible solución: Crea el bucket manualmente en el panel de Supabase');
      console.log('   1. Ve a Storage en tu dashboard de Supabase');
      console.log('   2. Crea un bucket llamado "recepcion-imagenes"');
      console.log('   3. Marca "Public bucket"');
      console.log('   4. Configura los permisos necesarios');
      return { 
        success: false, 
        error: createError,
        message: 'No se pudo crear el bucket automáticamente. Créalo manualmente.'
      };
    }
    
    console.log('✅ Bucket creado exitosamente:', newBucket);
    return { success: true, message: 'Bucket creado exitosamente' };
    
  } catch (error) {
    console.error('❌ Error general:', error);
    return { success: false, error };
  }
}

// Instrucciones para crear el bucket manualmente
export function mostrarInstruccionesManules() {
  console.log(`
📋 INSTRUCCIONES PARA CREAR EL BUCKET MANUALMENTE EN SUPABASE:

1. Abre tu dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a "Storage" en el menú lateral
4. Haz clic en "New bucket"
5. Configura el bucket con estos datos:
   - Name: ${BUCKET_NAME}
   - Public: ✅ (marcado)
   - File size limit: 10 MB
   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
6. Haz clic en "Create bucket"
7. Ve a "Policies" y crea las siguientes políticas:

   a) Para subir archivos (INSERT):
      - Name: "Permitir subida de imágenes"
      - Policy definition: true
      - Operation: INSERT
   
   b) Para leer archivos (SELECT):
      - Name: "Permitir lectura pública"
      - Policy definition: true
      - Operation: SELECT
   
   c) Para eliminar archivos (DELETE):
      - Name: "Permitir eliminación"
      - Policy definition: true
      - Operation: DELETE

8. Guarda las políticas
9. ¡Listo! Las imágenes deberían funcionar ahora.
  `);
}

// Si se ejecuta directamente
if (typeof window !== 'undefined') {
  // En el navegador
  console.log('🚀 Para verificar el bucket, ejecuta:');
  console.log('await verificarYCrearBucket()');
  console.log('\n📋 Para ver instrucciones manuales, ejecuta:');
  console.log('mostrarInstruccionesManules()');
}
