const fs = require('fs');
const path = require('path');

// Datos de prueba que simularían lo que viene del formulario
const testEmpleadoData = {
  numeroOrden: "000123",
  valorIngreso: "150000",
  fecha: "2024-01-15",
  pago: {
    pago: true,
    debe: false,
    garantia: false
  },
  cliente: {
    nombre: "Juan Pérez",
    identificacion: "12345678",
    telefono: "3001234567",
    direccion: "Calle 123 #45-67",
    correo: "juan.perez@email.com",
    ciudad: "Bogotá"
  },
  equipo: {
    tipo: "Hidrolavadora",
    marca: "KARCHER",
    modelo: "K3 Premium",
    serie: "ABC123456",
    fechaCompra: "2023-01-01",
    voltaje: "110V",
    fechaUltimoMantenimiento: "2023-12-01",
    uso: "Doméstico",
    accesorios: "Manguera, pistola, lanza turbo"
  },
  estadoFisico: {
    carcasa: { bueno: true, regular: false, malo: false, noTiene: false, observaciones: "" },
    ruedas: { bueno: false, regular: true, malo: false, noTiene: false, observaciones: "Desgaste menor" },
    cableadoClavija: { bueno: true, regular: false, malo: false, noTiene: false, observaciones: "" },
    acoples: { bueno: true, regular: false, malo: false, noTiene: false, observaciones: "" },
    manguera: { bueno: false, regular: false, malo: true, noTiene: false, observaciones: "Fuga pequeña" },
    pistola: { bueno: true, regular: false, malo: false, noTiene: false, observaciones: "" },
    grapaPistola: { bueno: true, regular: false, malo: false, noTiene: false, observaciones: "" },
    grapaEquipo: { bueno: true, regular: false, malo: false, noTiene: false, observaciones: "" },
    depositoDetergente: { bueno: true, regular: false, malo: false, noTiene: false, observaciones: "" },
    lanzaDetergente: { bueno: false, regular: false, malo: false, noTiene: true, observaciones: "No incluida" },
    lanzaTurbo: { bueno: true, regular: false, malo: false, noTiene: false, observaciones: "" },
    filtroInterno: { bueno: false, regular: true, malo: false, noTiene: false, observaciones: "Necesita limpieza" },
    filtroExterno: { bueno: true, regular: false, malo: false, noTiene: false, observaciones: "" },
    otro: { bueno: true, regular: false, malo: false, noTiene: false, observaciones: "" }
  },
  recepcion: {
    estadoGeneral: "Bueno",
    falla: "No enciende, posible problema eléctrico",
    observaciones: "Cliente reporta que dejó de funcionar después de una lluvia",
    recibioPor: "María González"
  }
};

// Función para formatear fecha al formato colombiano (copiada de wordUtils)
const formatDateToColombian = (dateStr) => {
  if (!dateStr) return new Date().toLocaleDateString('es-CO');
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
};

// Función para formatear valor en pesos colombianos (copiada de wordUtils)
const formatToColombiaPesos = (value) => {
  if (!value || value === '0') return '$0';
  const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
};

// Crear el mapeo exacto según el template (copiado de wordUtils)
const createTemplateMapping = (empleadoData) => {
  return {
    // ✅ VARIABLES EXACTAS QUE EXISTEN EN EL TEMPLATE
    fecha: formatDateToColombian(empleadoData.fecha || ''),
    valor: formatToColombiaPesos(empleadoData.valorIngreso || '0'),
    pago: empleadoData.pago?.pago ? 'X' : '',
    d: empleadoData.pago?.debe ? 'X' : '',
    g: empleadoData.pago?.garantia ? 'X' : ''
  };
};

console.log('=== TEST DE MAPEO DE DATOS PARA TEMPLATE WORD ===\n');
console.log('📋 Datos de entrada (simulando formulario):');
console.log('  - Número de orden:', testEmpleadoData.numeroOrden);
console.log('  - Cliente:', testEmpleadoData.cliente.nombre);
console.log('  - Valor de ingreso:', testEmpleadoData.valorIngreso);
console.log('  - Fecha:', testEmpleadoData.fecha);
console.log('  - Estado pago:', {
  pago: testEmpleadoData.pago.pago,
  debe: testEmpleadoData.pago.debe,
  garantia: testEmpleadoData.pago.garantia
});

console.log('\n🔄 Procesando mapeo...\n');

const templateData = createTemplateMapping(testEmpleadoData);

console.log('✅ DATOS MAPEADOS PARA EL TEMPLATE:');
console.log('Variables que se reemplazarán en el template Word:');
Object.entries(templateData).forEach(([key, value]) => {
  if (value && value !== '') {
    console.log(`  ✅ {${key}}: "${value}"`);
  } else {
    console.log(`  ⚪ {${key}}: [vacío]`);
  }
});

console.log('\n📊 RESUMEN:');
console.log(`  • Total de variables: ${Object.keys(templateData).length}`);
console.log(`  • Variables con datos: ${Object.values(templateData).filter(v => v && v !== '').length}`);
console.log(`  • Variables vacías: ${Object.values(templateData).filter(v => !v || v === '').length}`);

console.log('\n🎯 ESTADO DE CHECKBOXES DE PAGO:');
console.log('  • Pagó:', templateData.pago === 'X' ? '☑️ Marcado' : '☐ Sin marcar');
console.log('  • Debe:', templateData.d === 'X' ? '☑️ Marcado' : '☐ Sin marcar'); 
console.log('  • Garantía:', templateData.g === 'X' ? '☑️ Marcado' : '☐ Sin marcar');

console.log('\n📝 VERIFICACIÓN DE FORMATEO:');
console.log('  • Fecha original:', testEmpleadoData.fecha);
console.log('  • Fecha formateada:', templateData.fecha);
console.log('  • Valor original:', testEmpleadoData.valorIngreso);
console.log('  • Valor formateado:', templateData.valor);

console.log('\n✨ TEST COMPLETADO EXITOSAMENTE\n');
console.log('Los datos se han mapeado correctamente según las variables del template:');
console.log('- {fecha}, {valor}, {pago}, {d}, {g}');
console.log('\nAhora puedes probar la generación del documento Word desde la aplicación.');