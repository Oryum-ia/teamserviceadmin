import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://tscotizacion.tscosta.com.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkyMjUxMjIsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.15HDbRRpkiq7vVgZyML89A4b46N4SAz3GrZiLJhzlms';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ejecutarMigracion() {
  try {
    console.log('🚀 Iniciando migración de producto_tienda...');
    console.log('📄 Agregando columnas sub_marca y codigo...\n');
    
    // Verificar conexión
    const { data: testData, error: testError } = await supabase
      .from('producto_tienda')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión:', testError);
      throw testError;
    }
    
    console.log('✅ Conexión exitosa a Supabase');
    console.log('\n⚠️  IMPORTANTE: Debes ejecutar el siguiente SQL manualmente en el SQL Editor de Supabase:\n');
    console.log('--------------------------------------------------');
    console.log('ALTER TABLE producto_tienda ADD COLUMN IF NOT EXISTS sub_marca TEXT;');
    console.log('ALTER TABLE producto_tienda ADD COLUMN IF NOT EXISTS codigo TEXT;');
    console.log('COMMENT ON COLUMN producto_tienda.sub_marca IS \'Sub-marca o línea del producto\';');
    console.log('COMMENT ON COLUMN producto_tienda.codigo IS \'Código de referencia del producto\';');
    console.log('--------------------------------------------------\n');
    
    console.log('📝 Instrucciones:');
    console.log('1. Ve a: https://tscotizacion.tscosta.com.co/project/default/sql');
    console.log('2. Copia y pega el SQL de arriba');
    console.log('3. Ejecuta la consulta');
    console.log('4. Verifica que las columnas se agregaron correctamente\n');
    
    // Intentar verificar si las columnas ya existen
    const { data: productos, error: productosError } = await supabase
      .from('producto_tienda')
      .select('*')
      .limit(1);
    
    if (!productosError && productos && productos.length > 0) {
      const campos = Object.keys(productos[0]);
      const tieneSubMarca = campos.includes('sub_marca');
      const tieneCodigo = campos.includes('codigo');
      
      if (tieneSubMarca && tieneCodigo) {
        console.log('✅ Las columnas sub_marca y codigo ya existen en la tabla');
      } else {
        console.log('⚠️  Columnas faltantes:');
        if (!tieneSubMarca) console.log('   - sub_marca');
        if (!tieneCodigo) console.log('   - codigo');
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

ejecutarMigracion();
