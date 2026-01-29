// Script Node.js para ejecutar migración en Supabase
const https = require('https');

const SUPABASE_URL = 'https://tscotizacion.tscosta.com.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkyMjUxMjIsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.15HDbRRpkiq7vVgZyML89A4b46N4SAz3GrZiLJhzlms';

// SQL para agregar las columnas
const SQL_QUERIES = [
  'ALTER TABLE producto_tienda ADD COLUMN IF NOT EXISTS sub_marca TEXT;',
  'ALTER TABLE producto_tienda ADD COLUMN IF NOT EXISTS codigo TEXT;'
];

function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function verificarConexion() {
  console.log('🔍 Verificando conexión a Supabase...');
  
  const url = `${SUPABASE_URL}/rest/v1/producto_tienda?select=id&limit=1`;
  const options = {
    method: 'GET',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(url, options);
    if (response.status === 200) {
      console.log('✅ Conexión exitosa a Supabase\n');
      return true;
    } else {
      console.error('❌ Error de conexión:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

async function verificarColumnas() {
  console.log('🔍 Verificando columnas existentes...');
  
  const url = `${SUPABASE_URL}/rest/v1/producto_tienda?select=*&limit=1`;
  const options = {
    method: 'GET',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(url, options);
    if (response.status === 200 && response.data.length > 0) {
      const campos = Object.keys(response.data[0]);
      const tieneSubMarca = campos.includes('sub_marca');
      const tieneCodigo = campos.includes('codigo');
      
      console.log('📋 Campos actuales:', campos.join(', '));
      console.log('');
      
      if (tieneSubMarca && tieneCodigo) {
        console.log('✅ Las columnas sub_marca y codigo ya existen');
        return true;
      } else {
        console.log('⚠️  Columnas faltantes:');
        if (!tieneSubMarca) console.log('   - sub_marca');
        if (!tieneCodigo) console.log('   - codigo');
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ Error al verificar columnas:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando migración de producto_tienda\n');
  console.log('=' .repeat(60));
  console.log('');
  
  // Verificar conexión
  const conectado = await verificarConexion();
  if (!conectado) {
    console.log('\n❌ No se pudo conectar a Supabase');
    process.exit(1);
  }
  
  // Verificar si las columnas ya existen
  const columnasExisten = await verificarColumnas();
  
  console.log('');
  console.log('=' .repeat(60));
  console.log('');
  
  if (columnasExisten) {
    console.log('✅ Migración no necesaria - Las columnas ya existen');
    console.log('');
    console.log('Puedes usar los campos en tu aplicación:');
    console.log('  - sub_marca: Sub-marca o línea del producto');
    console.log('  - codigo: Código de referencia del producto');
  } else {
    console.log('📝 INSTRUCCIONES PARA COMPLETAR LA MIGRACIÓN:\n');
    console.log('Debes ejecutar el siguiente SQL en el SQL Editor de Supabase:\n');
    console.log('--------------------------------------------------');
    SQL_QUERIES.forEach(query => console.log(query));
    console.log('--------------------------------------------------\n');
    console.log('Pasos:');
    console.log('1. Ve a: https://tscotizacion.tscosta.com.co/project/default/sql');
    console.log('2. Copia y pega el SQL de arriba');
    console.log('3. Haz clic en "Run" para ejecutar');
    console.log('4. Ejecuta este script nuevamente para verificar');
  }
  
  console.log('');
  console.log('=' .repeat(60));
}

main().catch(console.error);
