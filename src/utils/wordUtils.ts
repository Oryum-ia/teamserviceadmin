import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
// JSZipUtils se importará dinámicamente para evitar problemas con SSR

// Tipos para los datos del documento
interface PhysicalCondition {
  bueno: boolean;
  regular: boolean;
  malo: boolean;
  noTiene: boolean;
  observaciones: string;
}

interface EmpleadoData {
  numeroOrden: string;
  valorIngreso: string;
  fecha: string;
  pago: {
    pago: boolean;
    debe: boolean;
    garantia: boolean;
  };
  cliente: {
    nombre: string;
    identificacion?: string;
    telefono: string;
    direccion: string;
    correo?: string;
    ciudad: string;
  };
  equipo: {
    tipo: string;
    marca: string;
    modelo: string;
    serie: string;
    fechaCompra?: string;
    voltaje?: string;
    fechaUltimoMantenimiento?: string;
    uso?: string;
    accesorios: string;
  };
  estadoFisico: {
    [key: string]: PhysicalCondition;
  };
  recepcion: {
    estadoGeneral: string;
    falla: string;
    observaciones: string;
    recibioPor: string;
  };
}

interface DocumentData {
  numeroOrden: string;
  fecha: string;
  valorIngreso?: string;
  // Cliente
  nombreCliente: string;
  identificacion?: string;
  telefono: string;
  direccion: string;
  correo?: string;
  ciudad: string;
  // Equipo
  tipoEquipo: string;
  marca: string;
  modelo: string;
  serie: string;
  fechaCompra?: string;
  voltaje?: string;
  fechaUltimoMantenimiento?: string;
  uso?: string;
  accesorios: string;
  // Estado físico
  carcasaEstado?: string;
  carcasaObs?: string;
  ruedasEstado?: string;
  ruedasObs?: string;
  cableadoEstado?: string;
  cableadoObs?: string;
  acoplesEstado?: string;
  acoplesObs?: string;
  mangueraEstado?: string;
  mangueraObs?: string;
  pistolaEstado?: string;
  pistolaObs?: string;
  grapaPistolaEstado?: string;
  grapaPistolaObs?: string;
  grapaEquipoEstado?: string;
  grapaEquipoObs?: string;
  depositoDetengenteEstado?: string;
  depositoDetengenteObs?: string;
  lanzaDetengenteEstado?: string;
  lanzaDetengenteObs?: string;
  lanzaTurboEstado?: string;
  lanzaTurboObs?: string;
  filtroInternoEstado?: string;
  filtroInternoObs?: string;
  filtroExternoEstado?: string;
  filtroExternoObs?: string;
  otroEstado?: string;
  otroObs?: string;
  // Recepción
  estadoGeneral: string;
  falla: string;
  observaciones: string;
  recibioPor: string;
  // Pago
  pago: boolean;
  debe: boolean;
  garantia: boolean;
}

// Función para cargar el template desde el archivo público
const loadTemplate = async (templatePath: string): Promise<ArrayBuffer> => {
  // Importación dinámica de JSZipUtils para evitar problemas con SSR
  const JSZipUtils = await import('jszip-utils');
  
  return new Promise((resolve, reject) => {
    JSZipUtils.default.getBinaryContent(templatePath, (error: Error | null, content: ArrayBuffer) => {
      if (error) {
        reject(error);
      } else {
        resolve(content);
      }
    });
  });
};

// Función para convertir datos del formulario a formato para el template
export const convertFormDataToTemplateData = (empleadoData: EmpleadoData): DocumentData => {
  // Función auxiliar para obtener el estado seleccionado
  const getSelectedState = (estadoFisico: PhysicalCondition) => {
    if (estadoFisico.bueno) return 'Bueno';
    if (estadoFisico.regular) return 'Regular';
    if (estadoFisico.malo) return 'Malo';
    if (estadoFisico.noTiene) return 'No Tiene';
    return '';
  };

  return {
    numeroOrden: empleadoData.numeroOrden,
    fecha: empleadoData.fecha,
    valorIngreso: empleadoData.valorIngreso,
    // Cliente
    nombreCliente: empleadoData.cliente.nombre,
    identificacion: empleadoData.cliente.identificacion,
    telefono: empleadoData.cliente.telefono,
    direccion: empleadoData.cliente.direccion,
    correo: empleadoData.cliente.correo,
    ciudad: empleadoData.cliente.ciudad,
    // Equipo
    tipoEquipo: empleadoData.equipo.tipo,
    marca: empleadoData.equipo.marca,
    modelo: empleadoData.equipo.modelo,
    serie: empleadoData.equipo.serie,
    fechaCompra: empleadoData.equipo.fechaCompra,
    voltaje: empleadoData.equipo.voltaje,
    fechaUltimoMantenimiento: empleadoData.equipo.fechaUltimoMantenimiento,
    uso: empleadoData.equipo.uso,
    accesorios: empleadoData.equipo.accesorios,
    // Estado físico
    carcasaEstado: getSelectedState(empleadoData.estadoFisico.carcasa),
    carcasaObs: empleadoData.estadoFisico.carcasa.observaciones,
    ruedasEstado: getSelectedState(empleadoData.estadoFisico.ruedas),
    ruedasObs: empleadoData.estadoFisico.ruedas.observaciones,
    cableadoEstado: getSelectedState(empleadoData.estadoFisico.cableadoClavija),
    cableadoObs: empleadoData.estadoFisico.cableadoClavija.observaciones,
    acoplesEstado: getSelectedState(empleadoData.estadoFisico.acoples),
    acoplesObs: empleadoData.estadoFisico.acoples.observaciones,
    mangueraEstado: getSelectedState(empleadoData.estadoFisico.manguera),
    mangueraObs: empleadoData.estadoFisico.manguera.observaciones,
    pistolaEstado: getSelectedState(empleadoData.estadoFisico.pistola),
    pistolaObs: empleadoData.estadoFisico.pistola.observaciones,
    grapaPistolaEstado: getSelectedState(empleadoData.estadoFisico.grapaPistola),
    grapaPistolaObs: empleadoData.estadoFisico.grapaPistola.observaciones,
    grapaEquipoEstado: getSelectedState(empleadoData.estadoFisico.grapaEquipo),
    grapaEquipoObs: empleadoData.estadoFisico.grapaEquipo.observaciones,
    depositoDetengenteEstado: getSelectedState(empleadoData.estadoFisico.depositoDetergente),
    depositoDetengenteObs: empleadoData.estadoFisico.depositoDetergente.observaciones,
    lanzaDetengenteEstado: getSelectedState(empleadoData.estadoFisico.lanzaDetergente),
    lanzaDetengenteObs: empleadoData.estadoFisico.lanzaDetergente.observaciones,
    lanzaTurboEstado: getSelectedState(empleadoData.estadoFisico.lanzaTurbo),
    lanzaTurboObs: empleadoData.estadoFisico.lanzaTurbo.observaciones,
    filtroInternoEstado: getSelectedState(empleadoData.estadoFisico.filtroInterno),
    filtroInternoObs: empleadoData.estadoFisico.filtroInterno.observaciones,
    filtroExternoEstado: getSelectedState(empleadoData.estadoFisico.filtroExterno),
    filtroExternoObs: empleadoData.estadoFisico.filtroExterno.observaciones,
    otroEstado: getSelectedState(empleadoData.estadoFisico.otro),
    otroObs: empleadoData.estadoFisico.otro.observaciones,
    // Recepción
    estadoGeneral: empleadoData.recepcion.estadoGeneral,
    falla: empleadoData.recepcion.falla,
    observaciones: empleadoData.recepcion.observaciones,
    recibioPor: empleadoData.recepcion.recibioPor,
    // Estado de pago
    pago: empleadoData.pago.pago,
    debe: empleadoData.pago.debe,
    garantia: empleadoData.pago.garantia
  };
};

// Función createProfessionalWordDocument eliminada - se usa docx-templates ahora

// Función para validar campos requeridos según el template MTR específico
const validateRequiredFields = (empleadoData: EmpleadoData): string[] => {
  const errors: string[] = [];
  
  // Campos básicos del documento - valor de ingreso requerido, fecha y número de orden no
  if (!empleadoData.valorIngreso || empleadoData.valorIngreso.trim() === '') {
    errors.push('Valor de ingreso es requerido');
  }
  
  // Datos del cliente - solo los campos requeridos especificados
  if (!empleadoData.cliente.nombre.trim()) {
    errors.push('Cliente es requerido');
  }
  if (!empleadoData.cliente.identificacion || empleadoData.cliente.identificacion.trim() === '') {
    errors.push('NIT o C.C. es requerido');
  }
  if (!empleadoData.cliente.telefono.trim()) {
    errors.push('Teléfono es requerido');
  }
  if (!empleadoData.cliente.direccion.trim()) {
    errors.push('Dirección es requerida');
  }
  if (!empleadoData.cliente.correo || empleadoData.cliente.correo.trim() === '') {
    errors.push('Correo es requerido');
  }
  
  // Datos del equipo - solo los campos requeridos especificados (sin marca)
  if (!empleadoData.equipo.tipo.trim()) {
    errors.push('Equipo es requerido');
  }
  if (!empleadoData.equipo.modelo.trim()) {
    errors.push('Referencia es requerida');
  }
  if (!empleadoData.equipo.serie.trim()) {
    errors.push('Serial es requerido');
  }
  if (!empleadoData.equipo.fechaCompra || empleadoData.equipo.fechaCompra.trim() === '') {
    errors.push('Fecha de compra es requerida');
  }
  if (!empleadoData.equipo.voltaje || empleadoData.equipo.voltaje.trim() === '') {
    errors.push('Voltaje es requerido');
  }
  if (!empleadoData.equipo.fechaUltimoMantenimiento || empleadoData.equipo.fechaUltimoMantenimiento.trim() === '') {
    errors.push('Fecha último mantenimiento es requerida');
  }
  if (!empleadoData.equipo.uso || empleadoData.equipo.uso.trim() === '') {
    errors.push('Uso es requerido');
  }
  
  // Validar que al menos un estado de pago esté seleccionado
  if (!empleadoData.pago.pago && !empleadoData.pago.debe && !empleadoData.pago.garantia) {
    errors.push('Debe seleccionar al menos un estado de pago (Pagó, Debe, o Garantía)');
  }
  
  return errors;
};

// 🔧 Función para generar documento Word usando docxtemplater - NUEVA IMPLEMENTACIÓN
export const generateWordDocument = async (empleadoData: EmpleadoData): Promise<void> => {
  try {
    console.log('\n' + '🔧'.repeat(30));
    console.log('📄 GENERACIÓN DE DOCUMENTO WORD - DOCXTEMPLATER');
    console.log('🔧'.repeat(80));
    
    console.log('\n🔍 DATOS COMPLETOS RECIBIDOS:');
    console.log('Número de orden:', empleadoData.numeroOrden);
    console.log('Fecha raw:', empleadoData.fecha);
    console.log('Valor raw:', empleadoData.valorIngreso);
    console.log('Estado pago:', JSON.stringify(empleadoData.pago));
    console.log('Cliente:', empleadoData.cliente.nombre);
    console.log('Equipo:', empleadoData.equipo.tipo);
    
    // Validar campos requeridos
    const validationErrors = validateRequiredFields(empleadoData);
    if (validationErrors.length > 0) {
      const errorMessage = 'Por favor complete los siguientes campos:\n\n' + validationErrors.join('\n');
      throw new Error(errorMessage);
    }
    
    console.log('Cargando template desde:', '/documentos/Formato hidrolavadoras Hogar MTR.docx');
    
    // Cargar el template original como ArrayBuffer
    const template = await loadTemplate('/documentos/Formato hidrolavadoras Hogar MTR.docx');
    
    console.log('Template cargado exitosamente, tamaño:', template.byteLength, 'bytes');
    
    // Función para formatear fecha al formato colombiano
    const formatDateToColombian = (dateStr: string): string => {
      if (!dateStr) return new Date().toLocaleDateString('es-CO');
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    };

    // Función para formatear valor en pesos colombianos
    const formatToColombiaPesos = (value: string): string => {
      if (!value || value === '0') return '$0';
      const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numValue);
    };

    // Función auxiliar para obtener estado seleccionado del estado físico (no utilizada actualmente)
    // const getSelectedPhysicalState = (estado: PhysicalCondition): string => {
    //   if (!estado) return '';
    //   if (estado.bueno) return 'X';
    //   if (estado.regular) return 'X';
    //   if (estado.malo) return 'X';
    //   if (estado.noTiene) return 'X';
    //   return '';
    // };

    // ✅ FORMATEO DE DATOS MEJORADO
    console.log('\n🔄 INICIANDO FORMATEO DE DATOS...');
    
    // Formatear fecha al formato colombiano (DD/MM/YYYY)
    const fechaFormateada = empleadoData.fecha ? 
      new Date(empleadoData.fecha + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) : new Date().toLocaleDateString('es-CO');
    
    // Formatear valor en pesos colombianos
    const valorFormateado = empleadoData.valorIngreso ? 
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(parseInt(empleadoData.valorIngreso.replace(/[^0-9]/g, '')) || 0) : '$0';
    
    console.log('Fecha formateada:', fechaFormateada);
    console.log('Valor formateado:', valorFormateado);
    
    // 📝 MAPEO COMPLETO DE VARIABLES - EXPANDIDO
    console.log('\n🗺 CREANDO MAPEO COMPLETO DE VARIABLES...');
    
    const templateData = {
      // ✅ INFORMACIÓN BÁSICA
      numeroOrden: empleadoData.numeroOrden || '',
      fecha: fechaFormateada,
      valor: valorFormateado,
      valorIngreso: valorFormateado, // Alias para compatibilidad
      
      // ✅ DATOS DEL CLIENTE - CORREGIDO SEGÚN TEMPLATE_INSTRUCTIONS.md
      nombreCliente: empleadoData.cliente.nombre || '',
      cliente: empleadoData.cliente.nombre || '', // Variable específica para template
      nitCC: empleadoData.cliente.identificacion || '',
      nit: empleadoData.cliente.identificacion || '', // Variable específica para template
      telefono: empleadoData.cliente.telefono || '',
      direccion: empleadoData.cliente.direccion || '',
      correo: empleadoData.cliente.correo || '',
      
      // ✅ DATOS DEL EQUIPO - CORREGIDO SEGÚN TEMPLATE_INSTRUCTIONS.md
      equipo: empleadoData.equipo.tipo || '',
      referencia: empleadoData.equipo.modelo || '',
      serial: empleadoData.equipo.serie || '',
      fechaCompra: empleadoData.equipo.fechaCompra || '',
      voltaje: empleadoData.equipo.voltaje || '',
      fechaUltimoMantenimiento: empleadoData.equipo.fechaUltimoMantenimiento || '',
      uso: empleadoData.equipo.uso || '',
      
      // ✅ MOTIVO DE INGRESO Y OBSERVACIONES
      motivoIngreso: empleadoData.recepcion?.falla || '',
      notaEnsayo: empleadoData.recepcion?.observaciones || '',
      
      // ✅ CHECKBOXES DE PAGO (X o vacío)
      pago: empleadoData.pago?.pago ? 'X' : '',
      d: empleadoData.pago?.debe ? 'X' : '', 
      debe: empleadoData.pago?.debe ? 'X' : '', // Alias
      g: empleadoData.pago?.garantia ? 'X' : '',
      garantia: empleadoData.pago?.garantia ? 'X' : '', // Alias
      
      // ✅ DATOS DE RECEPCIÓN - CORREGIDO SEGÚN TEMPLATE_INSTRUCTIONS.md
      recibioPor: empleadoData.recepcion?.recibioPor || '',
      
      // ✅ ESTADO FÍSICO DEL EQUIPO - TODOS LOS COMPONENTES SEGÚN TEMPLATE_INSTRUCTIONS.md
      
      // Carcasa
      carcasaBueno: empleadoData.estadoFisico?.carcasa?.bueno ? 'X' : '',
      carcasaRegular: empleadoData.estadoFisico?.carcasa?.regular ? 'X' : '',
      carcasaMalo: empleadoData.estadoFisico?.carcasa?.malo ? 'X' : '',
      carcasaNoTiene: empleadoData.estadoFisico?.carcasa?.noTiene ? 'X' : '',
      carcasaObs: empleadoData.estadoFisico?.carcasa?.observaciones || '',
      
      // Ruedas
      ruedasBueno: empleadoData.estadoFisico?.ruedas?.bueno ? 'X' : '',
      ruedasRegular: empleadoData.estadoFisico?.ruedas?.regular ? 'X' : '',
      ruedasMalo: empleadoData.estadoFisico?.ruedas?.malo ? 'X' : '',
      ruedasNoTiene: empleadoData.estadoFisico?.ruedas?.noTiene ? 'X' : '',
      ruedasObs: empleadoData.estadoFisico?.ruedas?.observaciones || '',
      
      // Cableado y clavija
      cableadoBueno: empleadoData.estadoFisico?.cableadoClavija?.bueno ? 'X' : '',
      cableadoRegular: empleadoData.estadoFisico?.cableadoClavija?.regular ? 'X' : '',
      cableadoMalo: empleadoData.estadoFisico?.cableadoClavija?.malo ? 'X' : '',
      cableadoNoTiene: empleadoData.estadoFisico?.cableadoClavija?.noTiene ? 'X' : '',
      cableadoObs: empleadoData.estadoFisico?.cableadoClavija?.observaciones || '',
      
      // Acoples
      acoplesBueno: empleadoData.estadoFisico?.acoples?.bueno ? 'X' : '',
      acoplesRegular: empleadoData.estadoFisico?.acoples?.regular ? 'X' : '',
      acoplesMalo: empleadoData.estadoFisico?.acoples?.malo ? 'X' : '',
      acoplesNoTiene: empleadoData.estadoFisico?.acoples?.noTiene ? 'X' : '',
      acoplesObs: empleadoData.estadoFisico?.acoples?.observaciones || '',
      
      // Manguera
      mangueraBueno: empleadoData.estadoFisico?.manguera?.bueno ? 'X' : '',
      mangueraRegular: empleadoData.estadoFisico?.manguera?.regular ? 'X' : '',
      mangueraMalo: empleadoData.estadoFisico?.manguera?.malo ? 'X' : '',
      mangueraNoTiene: empleadoData.estadoFisico?.manguera?.noTiene ? 'X' : '',
      mangueraObs: empleadoData.estadoFisico?.manguera?.observaciones || '',
      
      // Pistola
      pistolaBueno: empleadoData.estadoFisico?.pistola?.bueno ? 'X' : '',
      pistolaRegular: empleadoData.estadoFisico?.pistola?.regular ? 'X' : '',
      pistolaMalo: empleadoData.estadoFisico?.pistola?.malo ? 'X' : '',
      pistolaNoTiene: empleadoData.estadoFisico?.pistola?.noTiene ? 'X' : '',
      pistolaObs: empleadoData.estadoFisico?.pistola?.observaciones || '',
      
      // Grapa Pistola
      grapaPistolaBueno: empleadoData.estadoFisico?.grapaPistola?.bueno ? 'X' : '',
      grapaPistolaRegular: empleadoData.estadoFisico?.grapaPistola?.regular ? 'X' : '',
      grapaPistolaMalo: empleadoData.estadoFisico?.grapaPistola?.malo ? 'X' : '',
      grapaPistolaNoTiene: empleadoData.estadoFisico?.grapaPistola?.noTiene ? 'X' : '',
      grapaPistolaObs: empleadoData.estadoFisico?.grapaPistola?.observaciones || '',
      
      // Grapa equipo
      grapaEquipoBueno: empleadoData.estadoFisico?.grapaEquipo?.bueno ? 'X' : '',
      grapaEquipoRegular: empleadoData.estadoFisico?.grapaEquipo?.regular ? 'X' : '',
      grapaEquipoMalo: empleadoData.estadoFisico?.grapaEquipo?.malo ? 'X' : '',
      grapaEquipoNoTiene: empleadoData.estadoFisico?.grapaEquipo?.noTiene ? 'X' : '',
      grapaEquipoObs: empleadoData.estadoFisico?.grapaEquipo?.observaciones || '',
      
      // Depósito detergente
      depositoDetergenteBueno: empleadoData.estadoFisico?.depositoDetergente?.bueno ? 'X' : '',
      depositoDetengenteRegular: empleadoData.estadoFisico?.depositoDetergente?.regular ? 'X' : '',
      depositoDetergenteMalo: empleadoData.estadoFisico?.depositoDetergente?.malo ? 'X' : '',
      depositoDetengenteNoTiene: empleadoData.estadoFisico?.depositoDetergente?.noTiene ? 'X' : '',
      depositoDetengenteObs: empleadoData.estadoFisico?.depositoDetergente?.observaciones || '',
      
      // Lanza detergente
      lanzaDetergenteBueno: empleadoData.estadoFisico?.lanzaDetergente?.bueno ? 'X' : '',
      lanzaDetengenteRegular: empleadoData.estadoFisico?.lanzaDetergente?.regular ? 'X' : '',
      lanzaDetergenteMalo: empleadoData.estadoFisico?.lanzaDetergente?.malo ? 'X' : '',
      lanzaDetengenteNoTiene: empleadoData.estadoFisico?.lanzaDetergente?.noTiene ? 'X' : '',
      lanzaDetengenteObs: empleadoData.estadoFisico?.lanzaDetergente?.observaciones || '',
      
      // Lanza turbo
      lanzaTurboBueno: empleadoData.estadoFisico?.lanzaTurbo?.bueno ? 'X' : '',
      lanzaTurboRegular: empleadoData.estadoFisico?.lanzaTurbo?.regular ? 'X' : '',
      lanzaTurboMalo: empleadoData.estadoFisico?.lanzaTurbo?.malo ? 'X' : '',
      lanzaTurboNoTiene: empleadoData.estadoFisico?.lanzaTurbo?.noTiene ? 'X' : '',
      lanzaTurboObs: empleadoData.estadoFisico?.lanzaTurbo?.observaciones || '',
      
      // Filtro interno
      filtroInternoBueno: empleadoData.estadoFisico?.filtroInterno?.bueno ? 'X' : '',
      filtroInternoRegular: empleadoData.estadoFisico?.filtroInterno?.regular ? 'X' : '',
      filtroInternoMalo: empleadoData.estadoFisico?.filtroInterno?.malo ? 'X' : '',
      filtroInternoNoTiene: empleadoData.estadoFisico?.filtroInterno?.noTiene ? 'X' : '',
      filtroInternoObs: empleadoData.estadoFisico?.filtroInterno?.observaciones || '',
      
      // Filtro externo
      filtroExternoBueno: empleadoData.estadoFisico?.filtroExterno?.bueno ? 'X' : '',
      filtroExternoRegular: empleadoData.estadoFisico?.filtroExterno?.regular ? 'X' : '',
      filtroExternoMalo: empleadoData.estadoFisico?.filtroExterno?.malo ? 'X' : '',
      filtroExternoNoTiene: empleadoData.estadoFisico?.filtroExterno?.noTiene ? 'X' : '',
      filtroExternoObs: empleadoData.estadoFisico?.filtroExterno?.observaciones || '',
      
      // ✅ FECHAS ADICIONALES
      fechaRecepcion: fechaFormateada,
      fechaActual: fechaFormateada,
      
      // ✅ DATOS CALCULADOS
      year: new Date().getFullYear().toString(),
      mes: new Date().toLocaleDateString('es-CO', { month: 'long' }),
      dia: new Date().getDate().toString()
    };
    
    console.log('\n🎯 OBJETO FINAL CREADO:');
    console.log('Total de variables mapeadas:', Object.keys(templateData).length);
    
    // 📊 MOSTRAR ESTADÍSTICAS Y PREVIEW
    const totalVars = Object.keys(templateData).length;
    const filledVars = Object.values(templateData).filter(v => v && v !== '').length;
    console.log(`Variables totales: ${totalVars}, con datos: ${filledVars}`);
    
    console.log('\n🗑 VARIABLES PRINCIPALES:');
    const principalVars = ['fecha', 'valor', 'cliente', 'equipo', 'pago', 'd', 'g'];
    principalVars.forEach(key => {
      const value = templateData[key as keyof typeof templateData];
      const status = value ? `✅ "${value}"` : '⚪ [vacío]';
      console.log(`  {${key}} → ${status}`);
    });
    
    console.log('\n🔍 VARIABLES ESPECÍFICAS CORREGIDAS:');
    const specificVars = ['cliente', 'nit', 'fechaCompra', 'fechaUltimoMantenimiento'];
    specificVars.forEach(key => {
      const value = templateData[key as keyof typeof templateData];
      const status = value ? `✅ "${value}"` : '⚠️ [undefined/vacío]';
      console.log(`  {${key}} → ${status}`);
    });
    
    console.log('\n📋 DATOS FUENTE PARA VERIFICACIÓN:');
    console.log('  empleadoData.cliente.nombre:', empleadoData.cliente.nombre || '[vacío]');
    console.log('  empleadoData.cliente.identificacion:', empleadoData.cliente.identificacion || '[vacío]');
    console.log('  empleadoData.equipo.fechaCompra:', empleadoData.equipo.fechaCompra || '[vacío]');
    console.log('  empleadoData.equipo.fechaUltimoMantenimiento:', empleadoData.equipo.fechaUltimoMantenimiento || '[vacío]');
    
    console.log('\n🚀 GENERANDO DOCUMENTO CON CONFIGURACIÓN CORREGIDA...');
    
    // ✅ CONFIGURACIÓN CORREGIDA PARA DOCXTEMPLATER
    // Cambio de docx-templates a docxtemplater para mejor compatibilidad
    
    // Convertir template a buffer correcto
    const templateBuffer = new Uint8Array(template);
    
    console.log('Template size:', templateBuffer.length, 'bytes');
    console.log('Configurando docxtemplater con parámetros óptimos...');
    
    // ⚠️ CONFIGURACIÓN CRÍTICA CORREGIDA PARA SOLUCIONAR CMD_NODE
    console.log('\n🔥 SOLUCIÓN AL PROBLEMA CMD_NODE:');
    console.log('Causa: Delimitadores incorrectos que conflictan con XML de Word');
    console.log('Solución: Usar docxtemplater en lugar de docx-templates');
    
    // ✅ CREAR INSTANCIA DE DOCXTEMPLATER CON MANEJO DE ERRORES MEJORADO
    const zip = new PizZip(templateBuffer);
    let doc: Docxtemplater;
    
    try {
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}'
        }
      });
      console.log('✅ Docxtemplater instanciado correctamente');
    } catch (error: unknown) {
      console.error('❌ Error al crear instancia de Docxtemplater:', error);
      
      // Manejo específico del Multi error
      if (error instanceof Error && error.name === 'TemplateError' && error.message === 'Multi error') {
        console.error('🔍 MULTI ERROR DETECTADO - Analizando errores específicos:');
        
        const errorWithProperties = error as Error & { properties?: { errors?: unknown[] } };
        if (errorWithProperties.properties && errorWithProperties.properties.errors) {
          errorWithProperties.properties.errors.forEach((subError: unknown, index: number) => {
            const subErr = subError as { properties?: { id?: string; explanation?: string; context?: string }; message?: string };
            console.error(`  Error ${index + 1}:`, {
              id: subErr.properties?.id,
              explanation: subErr.properties?.explanation,
              message: subErr.message,
              context: subErr.properties?.context
            });
          });
        }
      }
      
      const err = error as Error;
      throw new Error(`Error en la plantilla Word: ${err.message}. Verifique que la plantilla tenga los marcadores correctos con formato {{variable}}.`);
    }

    // ✅ ESTABLECER DATOS EN EL TEMPLATE
    try {
      doc.setData(templateData);
      console.log('✅ Datos establecidos en el template');
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Error al establecer datos:', err);
      throw new Error(`Error al establecer datos en la plantilla: ${err.message}`);
    }
    
    console.log('\n🔧 CONFIGURACIÓN FINAL APLICADA:');
    console.log('- Template size:', templateBuffer.length, 'bytes');
    console.log('- Variables mapeadas:', Object.keys(templateData).length);
    console.log('- Usando docxtemplater con delimitadores {{ }}');
    
    console.log('\n📝 VERIFICACIÓN FINAL DEL OBJETO DATA:');
    console.log('Tipo del objeto data:', typeof templateData);
    console.log('Es array?:', Array.isArray(templateData));
    console.log('Keys del objeto data:', Object.keys(templateData));
    
    console.log('\n🔍 MUESTRA DE VARIABLES ENVIADAS A DOCXTEMPLATER:');
    const sampleVars = ['fecha', 'valor', 'cliente', 'equipo', 'pago', 'd', 'g'] as const;
    sampleVars.forEach(key => {
      const value = templateData[key as keyof typeof templateData];
      console.log(`  • data.${key} = ${value !== undefined ? `"${value}"` : 'undefined'}`);
    });
    
    console.log('\n📦 OBJETO COMPLETO DATA (primeras 10 propiedades):');
    Object.entries(templateData).slice(0, 10).forEach(([key, value]) => {
      console.log(`  • ${key}: "${value}"`);
    });
    
    if (Object.keys(templateData).length > 10) {
      console.log(`  ... y ${Object.keys(templateData).length - 10} propiedades más`);
    }
    
    // 🎆 GENERAR DOCUMENTO CON DOCXTEMPLATER
    console.log('\n⚡ RENDERIZANDO DOCUMENTO...');
    try {
      doc.render();
      console.log('✅ Documento renderizado exitosamente');
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Error durante el renderizado:', err);
      
      // Manejo específico del Multi error durante render
      if (err.name === 'TemplateError' && err.message === 'Multi error') {
        console.error('🔍 MULTI ERROR EN RENDERIZADO - Errores específicos:');
        
        const errorWithProps = err as Error & { properties?: { errors?: unknown[] } };
        if (errorWithProps.properties && errorWithProps.properties.errors) {
          errorWithProps.properties.errors.forEach((subError: unknown, index: number) => {
            const subErr = subError as { properties?: { id?: string; explanation?: string; file?: string; offset?: number }; message?: string };
            console.error(`  Error ${index + 1}:`, {
              id: subErr.properties?.id,
              explanation: subErr.properties?.explanation,
              message: subErr.message,
              file: subErr.properties?.file,
              offset: subErr.properties?.offset
            });
          });
        }
      }
      
      const renderErr = error as Error;
      throw new Error(`Error al renderizar el documento: ${renderErr.message}`);
    }
    
    // ✅ OBTENER BUFFER DEL DOCUMENTO GENERADO
    const buffer = doc.getZip().generate({
      type: 'uint8array',
      compression: 'DEFLATE'
    });
    
    console.log('\n🎉 ✅ DOCUMENTO GENERADO EXITOSAMENTE!');
    console.log('Buffer generado:', buffer.length, 'bytes');
    
    // ✅ VERIFICAR QUE EL BUFFER NO ESTÉ VACÍO
    if (buffer.length < 1000) {
      console.warn('⚠️ ADVERTENCIA: El buffer es muy pequeño, puede haber un problema');
      console.log('Tamaño del buffer:', buffer.length);
      console.log('Template original:', templateBuffer.length);
    } else {
      console.log('✅ Buffer tiene tamaño correcto, documento procesado exitosamente');
    }
    
    // 📥 CREAR Y DESCARGAR ARCHIVO
    const blob = new Blob([buffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    
    const fileName = `Formato_Hidrolavadora_${empleadoData.numeroOrden || 'SIN_NUMERO'}_${new Date().toISOString().split('T')[0]}.docx`;
    
    console.log('\n📥 DESCARGA DE ARCHIVO:');
    console.log('  • Nombre:', fileName);
    console.log('  • Tamaño blob:', blob.size, 'bytes');
    console.log('  • Tipo MIME:', blob.type);
    
    console.log('\n🚀 Iniciando descarga...');
    saveAs(blob, fileName);
    
    // 🎆 RESUMEN FINAL
    console.log('\n' + '✅'.repeat(20));
    console.log('🎆 DOCUMENTO WORD GENERADO CON ÉXITO - PROBLEMA CMD_NODE SOLUCIONADO');
    console.log('✅'.repeat(80));
    
    console.log('\n📋 RESUMEN DE VARIABLES PROCESADAS:');
    const processedVars = Object.entries(templateData)
      .filter(([, value]) => value && value !== '')
      .slice(0, 10); // Mostrar solo las primeras 10 para no saturar log
    
    processedVars.forEach(([key, value]) => {
      console.log(`  • {${key}} → ${value}`);
    });
    
    if (Object.keys(templateData).length > 10) {
      console.log(`  ... y ${Object.keys(templateData).length - 10} variables más`);
    }
    
    console.log('\n🎉 PROCESO COMPLETADO - DOCUMENTO LISTO PARA USAR');
    console.log('='.repeat(80));
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error al generar documento Word:', error);
    
    let errorMessage = 'Error al generar el documento Word';
    
    if (error instanceof Error) {
      if (error.message.includes('complete los siguientes campos')) {
        errorMessage = error.message;
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = 'No se pudo cargar el template del documento. Verifique su conexión a internet.';
      } else {
        errorMessage = `Error del sistema: ${error.message}`;
        console.error('Detalles del error:', {
          message: error.message,
          stack: error.stack
        });
      }
    }
    
    throw new Error(errorMessage);
  }
};


// Función para extraer texto plano del documento Word (comentada - usa PizZip)
// const extractTextFromWordDocument = (zip: PizZip): string => {
//   try {
//     // Leer el documento principal
//     const documentXml = zip.file('word/document.xml')?.asText();
//     if (!documentXml) {
//       throw new Error('No se pudo leer el contenido del documento');
//     }
//     
//     // Parser XML simple para extraer texto
//     const textMatches = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
//     if (!textMatches) return '';
//     
//     let fullText = '';
//     textMatches.forEach(match => {
//       const textContent = match.replace(/<\/?w:t[^>]*>/g, '');
//       fullText += textContent + ' ';
//     });
//     
//     return fullText;
//   } catch (error) {
//     console.error('Error al extraer texto:', error);
//     return '';
//   }
// };

// Función para extraer datos específicos del texto
const extractDataFromText = (text: string): Partial<EmpleadoData> => {
  const data: Record<string, unknown> = {
    numeroOrden: '',
    valorIngreso: '',
    fecha: '',
    pago: { pago: false, debe: false, garantia: false },
    cliente: { nombre: '', identificacion: '', telefono: '', direccion: '', correo: '', ciudad: '' },
    equipo: { tipo: '', marca: '', modelo: '', serie: '', fechaCompra: '', voltaje: '', fechaUltimoMantenimiento: '', uso: '', accesorios: '' },
    recepcion: { estadoGeneral: '', falla: '', observaciones: '', recibioPor: '' }
  };
  
  // Expresiones regulares para extraer datos comunes
  const patterns = {
    numeroOrden: /(?:orden|consecutivo|n[úu]mero)[^\d]*(\d{6})/i,
    fecha: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
    nombreCliente: /(?:cliente|nombre)[:\s]([A-Za-zÁ-úÑñ\s]+)(?=\s|$)/i,
    telefono: /(?:tel[éef]fono|tel)[:\s]([\d\s\-\(\)]+)/i,
    equipo: /(?:equipo|tipo)[:\s]([A-Za-z\s]+)/i,
    modelo: /(?:modelo|referencia)[:\s]([A-Za-z0-9\s\-]+)/i,
    serie: /(?:serie|serial)[:\s]([A-Za-z0-9\-]+)/i,
    falla: /(?:falla|problema|motivo)[:\s]([^.\n]+)/i
  };
  
  // Extraer datos usando las expresiones regulares
  Object.keys(patterns).forEach(key => {
    const match = text.match(patterns[key as keyof typeof patterns]);
    if (match && match[1]) {
      const value = match[1].trim();
      
      switch (key) {
        case 'numeroOrden':
          data.numeroOrden = value;
          break;
        case 'fecha':
          // Convertir fecha al formato ISO si es posible
          try {
            const parts = value.split(/[\/\-]/);
            if (parts.length === 3) {
              const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
              data.fecha = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          } catch {
            data.fecha = new Date().toISOString().split('T')[0];
          }
          break;
        case 'nombreCliente':
          if (!data.cliente) data.cliente = { nombre: '', identificacion: '', telefono: '', direccion: '', correo: '', ciudad: '' };
          (data.cliente as Record<string, string>).nombre = value;
          break;
        case 'telefono':
          if (!data.cliente) data.cliente = { nombre: '', identificacion: '', telefono: '', direccion: '', correo: '', ciudad: '' };
          (data.cliente as Record<string, string>).telefono = value.replace(/[\s\-\(\)]/g, '');
          break;
        case 'equipo':
          if (!data.equipo) data.equipo = { tipo: '', marca: '', modelo: '', serie: '', fechaCompra: '', voltaje: '', fechaUltimoMantenimiento: '', uso: '', accesorios: '' };
          (data.equipo as Record<string, string>).tipo = value;
          break;
        case 'modelo':
          if (!data.equipo) data.equipo = { tipo: '', marca: '', modelo: '', serie: '', fechaCompra: '', voltaje: '', fechaUltimoMantenimiento: '', uso: '', accesorios: '' };
          (data.equipo as Record<string, string>).modelo = value;
          break;
        case 'serie':
          if (!data.equipo) data.equipo = { tipo: '', marca: '', modelo: '', serie: '', fechaCompra: '', voltaje: '', fechaUltimoMantenimiento: '', uso: '', accesorios: '' };
          (data.equipo as Record<string, string>).serie = value;
          break;
        case 'falla':
          if (!data.recepcion) data.recepcion = { estadoGeneral: '', falla: '', observaciones: '', recibioPor: '' };
          (data.recepcion as Record<string, string>).falla = value;
          break;
      }
    }
  });
  
  return data;
};

// Función para leer un documento Word y extraer datos (comentada - usa PizZip)
// export const parseWordDocument = async (file: File): Promise<EmpleadoData> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     
//     reader.onload = async (e) => {
//       try {
//         const arrayBuffer = e.target?.result as ArrayBuffer;
//         const zip = new PizZip(arrayBuffer);
//         
//         console.log('Analizando documento Word:', file.name);
//         
//         // Extraer texto del documento
//         const documentText = extractTextFromWordDocument(zip);
//         console.log('Texto extraído del documento:', documentText.substring(0, 500) + '...');
//         
//         // Intentar extraer datos específicos
//         const extractedData = extractDataFromText(documentText);
//         console.log('Datos extraídos:', extractedData);
//         // Todo el código anterior comentado...
//        
//        // Crear estructura completa con datos extraídos y valores por defecto
//        const fullData: EmpleadoData = {
//          numeroOrden: extractedData.numeroOrden || '',
//          valorIngreso: extractedData.valorIngreso || '',
//          fecha: extractedData.fecha || new Date().toISOString().split('T')[0],
//          pago: extractedData.pago || { pago: false, debe: false, garantia: false },
//          cliente: {
//            nombre: extractedData.cliente?.nombre || '',
//            identificacion: extractedData.cliente?.identificacion || '',
//            telefono: extractedData.cliente?.telefono || '',
//            direccion: extractedData.cliente?.direccion || '',
//            correo: extractedData.cliente?.correo || '',
//            ciudad: extractedData.cliente?.ciudad || ''
//          },
//          equipo: {
//            tipo: extractedData.equipo?.tipo || '',
//            marca: extractedData.equipo?.marca || '',
//            modelo: extractedData.equipo?.modelo || '',
//            serie: extractedData.equipo?.serie || '',
//            fechaCompra: extractedData.equipo?.fechaCompra || '',
//            voltaje: extractedData.equipo?.voltaje || '',
//            fechaUltimoMantenimiento: extractedData.equipo?.fechaUltimoMantenimiento || '',
//            uso: extractedData.equipo?.uso || '',
//            accesorios: extractedData.equipo?.accesorios || ''
//          },
//          estadoFisico: {
//            carcasa: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            ruedas: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            cableadoClavija: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            acoples: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            manguera: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            pistola: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            grapaPistola: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            grapaEquipo: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            depositoDetergente: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            lanzaDetergente: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            lanzaTurbo: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            filtroInterno: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            filtroExterno: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
//            otro: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' }
//          },
//          recepcion: {
//            estadoGeneral: extractedData.recepcion?.estadoGeneral || '',
//            falla: extractedData.recepcion?.falla || '',
//            observaciones: extractedData.recepcion?.observaciones || '',
//            recibioPor: extractedData.recepcion?.recibioPor || ''
//          }
//        };
//        
//        resolve(fullData);
//        
//      } catch (error) {
//        console.error('Error al procesar documento Word:', error);
//        reject(new Error(`Error al procesar el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`));
//      }
//    };
//    
//    reader.onerror = () => reject(new Error('Error al leer el archivo'));
//    reader.readAsArrayBuffer(file);
//  });
// };

// Interfaz para datos de diagnóstico técnico
interface DiagnosticoData {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  equipoTipo: string;
  equipoMarca: string;
  equipoModelo: string;
  equipoSerial: string;
  problemaDescripcion: string;
  estadoFisico: string;
  accesoriosIncluidos: string[];
  observacionesTecnico: string;
  prioridadReparacion: 'baja' | 'media' | 'alta' | 'urgente';
  tiempoEstimado: string;
  costoEstimado: string;
  fechaDiagnostico?: string;
  tecnicoNombre?: string;
  numeroDiagnostico?: string;
}

// Función para generar documento Word de diagnóstico técnico
export const generateDiagnosticoWordDocument = async (diagnosticoData: DiagnosticoData): Promise<void> => {
  try {
    console.log('🔧 Generando documento Word de diagnóstico técnico...');
    console.log('Datos del diagnóstico:', diagnosticoData);

    // Cargar el template
    const template = await loadTemplate('/documentos/Formato hidrolavadoras Hogar MTR.docx');
    console.log('Template cargado exitosamente');

    // Mapear datos del diagnóstico al formato del template
    const templateData = {
      // Información básica
      numeroOrden: diagnosticoData.numeroDiagnostico || `DIAG-${Date.now()}`,
      fecha: diagnosticoData.fechaDiagnostico || new Date().toLocaleDateString('es-CO'),
      valor: '',
      
      // Cliente
      nombreCliente: diagnosticoData.clienteNombre || '',
      nitCC: '',
      telefono: diagnosticoData.clienteTelefono || '',
      direccion: '',
      correo: diagnosticoData.clienteEmail || '',
      
      // Equipo
      equipo: diagnosticoData.equipoTipo || '',
      marca: diagnosticoData.equipoMarca || '',
      referencia: diagnosticoData.equipoModelo || '',
      serial: diagnosticoData.equipoSerial || '',
      fechaCompra: '',
      voltaje: '',
      fechaUltimoMantenimiento: '',
      uso: '',
      
      // Diagnóstico
      motivoIngreso: diagnosticoData.problemaDescripcion || '',
      notaEnsayo: `Estado físico: ${diagnosticoData.estadoFisico}\n` +
                  `Accesorios: ${diagnosticoData.accesoriosIncluidos.join(', ')}\n` +
                  `Prioridad: ${diagnosticoData.prioridadReparacion}\n` +
                  `Tiempo estimado: ${diagnosticoData.tiempoEstimado}\n` +
                  `Costo estimado: ${diagnosticoData.costoEstimado}\n` +
                  `Observaciones: ${diagnosticoData.observacionesTecnico}`,
      
      // Técnico
      recibioPor: diagnosticoData.tecnicoNombre || 'Técnico',
      
      // Otros campos vacíos para evitar errores
      pago: '',
      d: '',
      g: '',
      // ... otros campos se pueden agregar según sea necesario
    };

    // Crear instancia de Docxtemplater
    const templateBuffer = new Uint8Array(template);
    const zip = new PizZip(templateBuffer);
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '{{',
        end: '}}'
      }
    });

    // Establecer datos y renderizar
    doc.setData(templateData);
    doc.render();

    // Generar buffer
    const buffer = doc.getZip().generate({
      type: 'uint8array',
      compression: 'DEFLATE'
    });

    // Crear y descargar archivo
    const blob = new Blob([buffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const fileName = `Diagnostico_${diagnosticoData.clienteNombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
    
    console.log('📥 Descargando archivo:', fileName);
    saveAs(blob, fileName);

    console.log('✅ Documento de diagnóstico generado exitosamente');
    
  } catch (error) {
    console.error('❌ Error al generar documento de diagnóstico:', error);
    throw new Error(`Error al generar el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Versión simplificada de parseWordDocument sin PizZip
export const parseWordDocument = async (file: File): Promise<EmpleadoData> => {
  // Por ahora, retornar una estructura vacía con datos básicos del archivo
  const defaultData: EmpleadoData = {
    numeroOrden: '',
    valorIngreso: '',
    fecha: new Date().toISOString().split('T')[0],
    pago: { pago: false, debe: false, garantia: false },
    cliente: {
      nombre: file.name.split('.')[0], // Usar nombre del archivo como sugerencia
      identificacion: '',
      telefono: '',
      direccion: '',
      correo: '',
      ciudad: ''
    },
    equipo: {
      tipo: 'Hidrolavadora',
      marca: 'KARCHER',
      modelo: '',
      serie: '',
      fechaCompra: '',
      voltaje: '110V',
      fechaUltimoMantenimiento: '',
      uso: '',
      accesorios: ''
    },
    estadoFisico: {
      carcasa: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      ruedas: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      cableadoClavija: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      acoples: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      manguera: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      pistola: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      grapaPistola: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      grapaEquipo: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      depositoDetergente: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      lanzaDetergente: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      lanzaTurbo: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      filtroInterno: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      filtroExterno: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' },
      otro: { bueno: false, regular: false, malo: false, noTiene: false, observaciones: '' }
    },
    recepcion: {
      estadoGeneral: '',
      falla: '',
      observaciones: 'Documento cargado: ' + file.name,
      recibioPor: ''
    }
  };
  
  return Promise.resolve(defaultData);
};
