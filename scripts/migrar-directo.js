// Script para ejecutar migración directamente usando pg
const https = require('https');

const SUPABASE_URL = 'https://tscotizacion.tscosta.com.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkyMjUxMjIsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.15HDbRRpkiq7vVgZyML89A4b46N4SAz3GrZiLJhzlms';

function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, raw: true });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function ejecutarSQL(sql) {
  console.log('📝 Ejecutando SQL:', sql);
  
  // Intentar con RPC exec_sql si existe
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  const options = {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  
  const postData = JSON.stringify({ sql: sql });
  
  try {
    const response = await makeRequest(url, options, postData);
    console.log('📊 Respuesta:', response.status);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ SQL ejecutado exitosamente');
      return true;
    } else {
      console.log('⚠️  Respuesta:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Intentando ejecutar migración directamente\n');
  
  const queries = [
    'ALTER TABLE producto_tienda ADD COLUMN IF NOT EXISTS sub_marca TEXT;',
    'ALTER TABLE producto_tienda ADD COLUMN IF NOT EXISTS codigo TEXT;'
  ];
  
  let exito = false;
  
  for (const query of queries) {
    const resultado = await ejecutarSQL(query);
    if (resultado) {
      exito = true;
    }
    console.log('');
  }
  
  if (!exito) {
    console.log('⚠️  No se pudo ejecutar la migración automáticamente');
    console.log('');
    console.log('Por favor, ejecuta manualmente en el SQL Editor:');
    console.log('https://tscotizacion.tscosta.com.co/project/default/sql');
    console.log('');
    console.log('SQL:');
    console.log('--------------------------------------------------');
    queries.forEach(q => console.log(q));
    console.log('--------------------------------------------------');
  }
}

main().catch(console.error);
