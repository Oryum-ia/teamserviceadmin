import React, { useState, useRef, useEffect } from 'react';
import { FileText, UserCheck, Wrench, Users, Download, ArrowLeft, Clock, Upload, File } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { generateWordDocument, parseWordDocument } from '../../utils/wordUtils';

// Tipos para los formularios
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
    [key: string]: {
      bueno: boolean;
      regular: boolean;
      malo: boolean;
      noTiene: boolean;
      observaciones: string;
    };
  };
  recepcion: {
    estadoGeneral: string;
    falla: string;
    observaciones: string;
    recibioPor: string;
  };
}

interface TecnicoData {
  numeroOrden: string;
  diagnostico: {
    problemaDetectado: string;
    causaProbable: string;
    solucionPropuesta: string;
    repuestosNecesarios: string;
    tiempoEstimado: string;
  };
  revision: {
    pruebasFuncionales: boolean;
    limpiezaInterna: boolean;
    revisionElectrica: boolean;
    revisionMecanica: boolean;
  };
  tecnico: {
    nombre: string;
    fecha: string;
    observaciones: string;
  };
}

interface ClienteData {
  numeroOrden: string;
  cotizacion: {
    descripcionTrabajo: string;
    repuestos: Array<{ descripcion: string; cantidad: number; valorUnitario: number; valorTotal: number }>;
    manoDeObra: number;
    subtotal: number;
    iva: number;
    total: number;
    tiempoEntrega: string;
    garantia: string;
  };
  observaciones: string;
}

// Utilidades para manejo de números de orden
const getNextOrderNumber = (): string => {
  const currentNumber = localStorage.getItem('lastOrderNumber');
  const nextNumber = currentNumber ? parseInt(currentNumber) + 1 : 1;
  return nextNumber.toString().padStart(6, '0'); // Formato: 000001, 000002, etc.
};

const saveOrderNumber = (orderNumber: string) => {
  const numericPart = parseInt(orderNumber);
  localStorage.setItem('lastOrderNumber', numericPart.toString());
};

const generateNewOrderNumber = (): string => {
  const newOrderNumber = getNextOrderNumber();
  saveOrderNumber(newOrderNumber);
  return newOrderNumber;
};

export default function Documentacion() {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<'main' | 'empleado' | 'tecnico' | 'cliente'>('main');
  // Estado para las formas con números de orden auto-generados
  const [empleadoData, setEmpleadoData] = useState<EmpleadoData>(() => ({
    numeroOrden: generateNewOrderNumber(),
    valorIngreso: '',
    fecha: new Date().toISOString().split('T')[0],
    pago: { pago: false, debe: false, garantia: false },
    cliente: { nombre: '', identificacion: '', telefono: '', direccion: '', correo: '', ciudad: '' },
    equipo: { tipo: '', marca: '', modelo: '', serie: '', fechaCompra: '', voltaje: '', fechaUltimoMantenimiento: '', uso: '', accesorios: '' },
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
    recepcion: { estadoGeneral: '', falla: '', observaciones: '', recibioPor: '' }
  }));
  
  const [tecnicoData, setTecnicoData] = useState<TecnicoData>(() => ({
    numeroOrden: generateNewOrderNumber(),
    diagnostico: {
      problemaDetectado: '',
      causaProbable: '',
      solucionPropuesta: '',
      repuestosNecesarios: '',
      tiempoEstimado: ''
    },
    revision: {
      pruebasFuncionales: false,
      limpiezaInterna: false,
      revisionElectrica: false,
      revisionMecanica: false
    },
    tecnico: { nombre: '', fecha: new Date().toISOString().split('T')[0], observaciones: '' }
  }));
  
  const [clienteData, setClienteData] = useState<ClienteData>(() => ({
    numeroOrden: generateNewOrderNumber(),
    cotizacion: {
      descripcionTrabajo: '',
      repuestos: [],
      manoDeObra: 0,
      subtotal: 0,
      iva: 0,
      total: 0,
      tiempoEntrega: '',
      garantia: ''
    },
    observaciones: ''
  }));

  // Funciones para crear nuevas formas con números de orden consecutivos
  const createNewEmpleadoForm = () => {
    setEmpleadoData({
      numeroOrden: generateNewOrderNumber(),
      valorIngreso: '',
      fecha: new Date().toISOString().split('T')[0],
      pago: { pago: false, debe: false, garantia: false },
      cliente: { nombre: '', identificacion: '', telefono: '', direccion: '', correo: '', ciudad: '' },
      equipo: { tipo: '', marca: '', modelo: '', serie: '', fechaCompra: '', voltaje: '', fechaUltimoMantenimiento: '', uso: '', accesorios: '' },
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
      recepcion: { estadoGeneral: '', falla: '', observaciones: '', recibioPor: '' }
    });
  };

  // Referencias para los inputs de archivo
  const empleadoFileRef = useRef<HTMLInputElement>(null);
  const tecnicoFileRef = useRef<HTMLInputElement>(null);
  const clienteFileRef = useRef<HTMLInputElement>(null);
  
  // Estado para la búsqueda de recepciones
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<EmpleadoData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Efecto para cerrar resultados de búsqueda al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Funciones para guardar y buscar recepciones
  const saveReceptionData = (data: EmpleadoData) => {
    try {
      const existingData = localStorage.getItem('receptionData');
      const receptions: EmpleadoData[] = existingData ? JSON.parse(existingData) : [];
      
      // Verificar si ya existe una recepción con el mismo número de orden
      const existingIndex = receptions.findIndex(r => r.numeroOrden === data.numeroOrden);
      
      if (existingIndex !== -1) {
        // Actualizar recepción existente
        receptions[existingIndex] = data;
      } else {
        // Agregar nueva recepción
        receptions.push(data);
      }
      
      localStorage.setItem('receptionData', JSON.stringify(receptions));
    } catch (error) {
      console.error('Error al guardar datos de recepción:', error);
    }
  };
  
  const searchReceptions = (term: string): EmpleadoData[] => {
    try {
      if (!term.trim()) return [];
      
      const existingData = localStorage.getItem('receptionData');
      if (!existingData) return [];
      
      const receptions: EmpleadoData[] = JSON.parse(existingData);
      const searchTermLower = term.toLowerCase().trim();
      
      return receptions.filter(reception => 
        reception.cliente.nombre.toLowerCase().includes(searchTermLower) ||
        reception.cliente.identificacion?.toLowerCase().includes(searchTermLower) ||
        reception.numeroOrden.toLowerCase().includes(searchTermLower)
      );
    } catch (error) {
      console.error('Error al buscar recepciones:', error);
      return [];
    }
  };
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim().length >= 2) {
      const results = searchReceptions(term);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };
  
  const loadReceptionData = (reception: EmpleadoData) => {
    // Cargar todos los datos en el formulario manteniendo el número de orden original
    setEmpleadoData({
      ...reception,
      // Mantener el número de orden original para edición
    });
    setShowSearchResults(false);
    setSearchTerm('');
  };
  
  const saveCurrentReception = () => {
    saveReceptionData(empleadoData);
    alert(`Recepción ${empleadoData.numeroOrden} guardada exitosamente.`);
  };

  // Estado para manejar mensajes y validaciones
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Función para validar campos requeridos en el frontend (coincide exactamente con el template MTR)
  const validateFormData = (data: EmpleadoData): string[] => {
    const errors: string[] = [];
    
    // Campos básicos del documento - solo los especificados
    if (!data.valorIngreso || data.valorIngreso.trim() === '') {
      errors.push('Valor de ingreso');
    }
    
    // Datos del cliente - solo los campos requeridos especificados
    if (!data.cliente.nombre.trim()) errors.push('Cliente');
    if (!data.cliente.identificacion || data.cliente.identificacion.trim() === '') errors.push('NIT o C.C.');
    if (!data.cliente.telefono.trim()) errors.push('Teléfono');
    if (!data.cliente.direccion.trim()) errors.push('Dirección');
    if (!data.cliente.correo || data.cliente.correo.trim() === '') errors.push('Correo');
    
    // Datos del equipo - solo los campos requeridos especificados
    if (!data.equipo.tipo.trim()) errors.push('Equipo');
    if (!data.equipo.modelo.trim()) errors.push('Referencia');
    if (!data.equipo.serie.trim()) errors.push('Serial');
    if (!data.equipo.fechaCompra || data.equipo.fechaCompra.trim() === '') errors.push('Fecha de compra');
    if (!data.equipo.voltaje || data.equipo.voltaje.trim() === '') errors.push('Voltaje');
    if (!data.equipo.fechaUltimoMantenimiento || data.equipo.fechaUltimoMantenimiento.trim() === '') errors.push('Fecha último mantenimiento');
    if (!data.equipo.uso || data.equipo.uso.trim() === '') errors.push('Uso');
    
    // Validar estado de pago
    if (!data.pago.pago && !data.pago.debe && !data.pago.garantia) {
      errors.push('Estado de pago (seleccione al menos uno: Pagó, Debe o Garantía)');
    }
    
    return errors;
  };
  
  // Función para verificar si un campo es requerido y falta (actualizado para template MTR específico)
  const isFieldRequired = (fieldPath: string): boolean => {
    const requiredFields = [
      'valorIngreso',
      'cliente.nombre', 'cliente.identificacion', 'cliente.telefono', 'cliente.direccion', 'cliente.correo',
      'equipo.tipo', 'equipo.modelo', 'equipo.serie', 'equipo.fechaCompra', 'equipo.voltaje', 'equipo.fechaUltimoMantenimiento', 'equipo.uso'
    ];
    return requiredFields.includes(fieldPath);
  };
  
  // Función para obtener el valor de un campo usando su path
  const getFieldValue = (fieldPath: string): string => {
    const paths = fieldPath.split('.');
    let value: unknown = empleadoData;
    for (const path of paths) {
      value = (value as Record<string, unknown>)?.[path];
    }
    return (value as string) || '';
  };
  
  // Función para obtener clases de estilo para campos requeridos
  const getFieldClasses = (fieldPath: string, baseClasses: string): string => {
    const isRequired = isFieldRequired(fieldPath);
    const isEmpty = !getFieldValue(fieldPath).trim();
    const hasError = showErrors && isRequired && isEmpty;
    
    let classes = baseClasses;
    
    if (hasError) {
      classes = classes.replace('border-gray-300', 'border-red-300');
      classes = classes.replace('border-gray-600', 'border-red-400');
      classes = classes.replace('focus:ring-green-500', 'focus:ring-red-500');
    }
    
    return classes;
  };
  
  // Función para manejar carga de archivos Word
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'empleado' | 'tecnico' | 'cliente') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert('Por favor selecciona un archivo Word (.docx)');
      return;
    }

    try {
      console.log(`Cargando archivo Word para ${type}:`, file.name);
      setIsGenerating(true);
      
      if (type === 'empleado') {
        const extractedData = await parseWordDocument(file);
        // Mantener el número de orden si ya existe uno, o generar uno nuevo
        const newData = {
          ...extractedData,
          numeroOrden: extractedData.numeroOrden || generateNewOrderNumber()
        };
        setEmpleadoData(newData);
        
        // Verificar qué datos se extrajeron exitosamente
        const extractedFields = [];
        if (newData.cliente.nombre) extractedFields.push('nombre del cliente');
        if (newData.cliente.telefono) extractedFields.push('teléfono');
        if (newData.equipo.tipo) extractedFields.push('tipo de equipo');
        if (newData.equipo.modelo) extractedFields.push('modelo');
        if (newData.equipo.serie) extractedFields.push('serie');
        if (newData.recepcion.falla) extractedFields.push('falla reportada');
        
        if (extractedFields.length > 0) {
          alert(`Documento cargado exitosamente. Se extrajeron los siguientes datos:\n\n${extractedFields.join(', ')}.\n\nPor favor revise y complete los campos faltantes.`);
        } else {
          alert('Documento cargado. No se pudieron extraer datos automáticamente. Por favor complete el formulario manualmente.');
        }
      } else {
        alert(`La carga de archivos Word para ${type} estará disponible próximamente.`);
      }
    } catch (error) {
      console.error('Error al cargar archivo:', error);
      alert(`Error al cargar el archivo Word: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsGenerating(false);
    }

    // Limpiar input
    event.target.value = '';
  };

  const createNewTecnicoForm = () => {
    setTecnicoData({
      numeroOrden: generateNewOrderNumber(),
      diagnostico: {
        problemaDetectado: '',
        causaProbable: '',
        solucionPropuesta: '',
        repuestosNecesarios: '',
        tiempoEstimado: ''
      },
      revision: {
        pruebasFuncionales: false,
        limpiezaInterna: false,
        revisionElectrica: false,
        revisionMecanica: false
      },
      tecnico: { nombre: '', fecha: new Date().toISOString().split('T')[0], observaciones: '' }
    });
  };

  const createNewClienteForm = () => {
    setClienteData({
      numeroOrden: generateNewOrderNumber(),
      cotizacion: {
        descripcionTrabajo: '',
        repuestos: [],
        manoDeObra: 0,
        subtotal: 0,
        iva: 0,
        total: 0,
        tiempoEntrega: '',
        garantia: ''
      },
      observaciones: ''
    });
  };

  const generateDocument = async (type: 'empleado' | 'tecnico' | 'cliente', data: EmpleadoData | TecnicoData | ClienteData) => {
    try {
      console.log('\n' + '📝'.repeat(25));
      console.log(`📝 INICIANDO GENERACIÓN DE DOCUMENTO: ${type.toUpperCase()}`);
      console.log('📝'.repeat(60));
      
      console.log('📋 Cliente:', (data as EmpleadoData).cliente?.nombre || 'N/A');
      console.log('📋 Orden:', data.numeroOrden);
      console.log('📋 Tipo:', type);
      
      // ✅ PROCESAMIENTO POR TIPO DE DOCUMENTO
      if (type === 'empleado') {
        setIsGenerating(true);
        setShowErrors(false);
        
        console.log('⚙️ Validando datos del formulario...');
        
        // ✅ VALIDACIÓN FRONTEND
        const errors = validateFormData(data as EmpleadoData);
        if (errors.length > 0) {
          console.log('⚠️ Errores de validación encontrados:', errors);
          setValidationErrors(errors);
          setShowErrors(true);
          setIsGenerating(false);
          return;
        }
        
        console.log('✅ Validación exitosa - Procediendo con generación');
        
        // 💾 GUARDAR DATOS ANTES DE GENERAR
        saveReceptionData(data as EmpleadoData);
        
        // 🚀 LLAMAR A LA FUNCIÓN PRINCIPAL DE GENERACIÓN (wordUtils.ts)
        console.log('🚀 Delegando generación a wordUtils.generateWordDocument()...');
        await generateWordDocument(data as EmpleadoData);
        
        // 🎉 POST-PROCESAMIENTO EXITOSO
        console.log('✅ wordUtils.generateWordDocument() completado exitosamente');
        createNewEmpleadoForm();
        setValidationErrors([]);
        
        console.log('🎆 ✅ DOCUMENTO GENERADO Y NUEVA ORDEN CREADA');
        alert(`Documento Word generado exitosamente con orden ${data.numeroOrden}. Nueva orden creada.`);
        
      } else {
        // 🚫 FUNCIONALIDAD PENDIENTE PARA OTROS TIPOS
        console.log('⚠️ Tipo de documento no implementado:', type);
        alert(`La generación de documentos Word para ${type} estará disponible próximamente. Por ahora solo está implementado para recepción de empleado.`);
      }
      
    } catch (error) {
      console.log('\n' + '❌'.repeat(15));
      console.error('❌ ERROR EN DOCUMENTACIÓN.TSX:', error instanceof Error ? error.message : String(error));
      console.log('❌'.repeat(40));
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // 🛠️ MANEJO INTELIGENTE DE ERRORES
      if (errorMessage.includes('complete los siguientes campos')) {
        // Error de validación desde wordUtils
        console.log('⚠️ Error de validación desde wordUtils');
        const fieldErrors = errorMessage.split('\n').slice(2).filter(line => line.trim());
        setValidationErrors(fieldErrors);
        setShowErrors(true);
      } else {
        // Error general del sistema
        console.log('❌ Error general del sistema:', errorMessage);
        alert('Error al generar el documento Word: ' + errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMainView = () => (
    <div className="p-6 h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <FileText className={`w-6 h-6 ${
            theme === 'light' ? 'text-blue-600' : 'text-blue-400'
          }`} />
          <h1 className={`text-2xl font-bold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Documentación de Servicios
          </h1>
        </div>
        <p className={`mt-2 text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
        }`}>
          Sistema de generación de documentos para el proceso de servicio técnico
        </p>
      </div>

      {/* Subsecciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Empleado - Recepción */}
        <div className={`rounded-lg border shadow-sm p-6 cursor-pointer transition-all hover:shadow-md ${
          theme === 'light' 
            ? 'bg-white border-gray-200 hover:border-mint-300' 
            : 'bg-dark-bg-secondary border-lime-400/20 hover:border-lime-400/60'
        }`}
        onClick={() => setActiveSection('empleado')}>
          <div className="flex items-center space-x-3 mb-4">
            <UserCheck className={`w-5 h-5 ${
              theme === 'light' ? 'text-green-600' : 'text-green-400'
            }`} />
            <h3 className={`text-lg font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Empleado - Recepción
            </h3>
          </div>
          <p className={`text-sm mb-4 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-300'
          }`}>
            Formato de recepción de equipos. Primera etapa del proceso de servicio.
          </p>
          <div className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
            <Clock className="w-4 h-4 mr-1" />
            Iniciar recepción →
          </div>
        </div>

        {/* Técnico - Diagnóstico */}
        <div className={`rounded-lg border shadow-sm p-6 cursor-pointer transition-all hover:shadow-md ${
          theme === 'light' 
            ? 'bg-white border-gray-200 hover:border-mint-400' 
            : 'bg-dark-bg-secondary border-lime-400/20 hover:border-lime-400/80'
        }`}
        onClick={() => setActiveSection('tecnico')}>
          <div className="flex items-center space-x-3 mb-4">
            <Wrench className={`w-5 h-5 ${
              theme === 'light' ? 'text-orange-600' : 'text-orange-400'
            }`} />
            <h3 className={`text-lg font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Técnico - Diagnóstico
            </h3>
          </div>
          <p className={`text-sm mb-4 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-300'
          }`}>
            Informe técnico del equipo. Diagnóstico y evaluación del servicio.
          </p>
          <div className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
            <Wrench className="w-4 h-4 mr-1" />
            Crear diagnóstico →
          </div>
        </div>

        {/* Cliente - Cotización */}
        <div className={`rounded-lg border shadow-sm p-6 cursor-pointer transition-all hover:shadow-md ${
          theme === 'light' 
            ? 'bg-white border-gray-200 hover:border-mint-500' 
            : 'bg-dark-bg-secondary border-lime-400/20 hover:border-lime-400'
        }`}
        onClick={() => setActiveSection('cliente')}>
          <div className="flex items-center space-x-3 mb-4">
            <Users className={`w-5 h-5 ${
              theme === 'light' ? 'text-purple-600' : 'text-purple-400'
            }`} />
            <h3 className={`text-lg font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Cliente - Cotización
            </h3>
          </div>
          <p className={`text-sm mb-4 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-300'
          }`}>
            Cotización y documento de entrega. Información para el cliente.
          </p>
          <div className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
            <Download className="w-4 h-4 mr-1" />
            Generar cotización →
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-8">
        <div className={`rounded-lg border p-4 ${
          theme === 'light' 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-blue-900/20 border-blue-700'
        }`}>
          <h4 className={`font-medium mb-2 ${
            theme === 'light' ? 'text-blue-900' : 'text-blue-100'
          }`}>
            Proceso de Documentación
          </h4>
          <p className={`text-sm ${
            theme === 'light' ? 'text-blue-800' : 'text-blue-200'
          }`}>
            El sistema genera documentos PDF organizados para cada etapa del servicio técnico: 
            recepción del equipo, diagnóstico técnico y cotización para el cliente.
          </p>
        </div>
      </div>
    </div>
  );

  const renderEmpleadoForm = () => (
    <div className="p-6 h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header con botón de regreso */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveSection('main')}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light' 
                  ? 'hover:bg-gray-100 text-gray-600' 
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UserCheck className={`w-6 h-6 ${
              theme === 'light' ? 'text-green-600' : 'text-green-400'
            }`} />
            <h1 className={`text-2xl font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Recepción de Equipo
            </h1>
          </div>
          <div className="flex items-center space-x-1.5">
            {/* Campo de búsqueda */}
            <div className="relative" ref={searchContainerRef}>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className={`w-48 px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'light' 
                    ? 'bg-white border-gray-300 text-gray-900' 
                    : 'bg-gray-700 border-gray-600 text-white'
                }`}
              />
              
              {/* Resultados de búsqueda */}
              {showSearchResults && searchResults.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border shadow-lg z-50 ${
                  theme === 'light' 
                    ? 'bg-white border-gray-300' 
                    : 'bg-gray-700 border-gray-600'
                }`}>
                  {searchResults.map((reception, index) => (
                    <div
                      key={`${reception.numeroOrden}-${index}`}
                      onClick={() => loadReceptionData(reception)}
                      className={`p-3 cursor-pointer border-b transition-colors ${
                        theme === 'light' 
                          ? 'hover:bg-gray-100 border-gray-200' 
                          : 'hover:bg-gray-600 border-gray-600'
                      }`}
                    >
                      <div className={`font-medium ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        Orden: {reception.numeroOrden} - {reception.cliente.nombre}
                      </div>
                      <div className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                      }`}>
                        NIT/CC: {reception.cliente.identificacion || 'N/A'} | Fecha: {reception.fecha}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Mensaje cuando no hay resultados */}
              {showSearchResults && searchResults.length === 0 && searchTerm.length >= 2 && (
                <div className={`absolute top-full left-0 right-0 mt-1 p-3 rounded-md border shadow-lg ${
                  theme === 'light' 
                    ? 'bg-white border-gray-300 text-gray-600' 
                    : 'bg-gray-700 border-gray-600 text-gray-300'
                }`}>
                  No se encontraron recepciones que coincidan con la búsqueda.
                </div>
              )}
            </div>
            
            <button
              onClick={saveCurrentReception}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center space-x-1 transition-colors"
              title="Guardar recepción sin generar documento"
            >
              <Download className="w-3 h-3" />
              <span>Guardar</span>
            </button>
            <button
              onClick={() => empleadoFileRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center space-x-1 transition-colors"
              title="Cargar documento Word existente"
            >
              <Upload className="w-3 h-3" />
              <span>Cargar</span>
            </button>
            <button
              onClick={() => generateDocument('empleado', empleadoData)}
              disabled={isGenerating}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center space-x-1 transition-colors ${
                isGenerating 
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <File className="w-3 h-3" />
                  <span>Generar</span>
                </>
              )}
            </button>
            <input
              ref={empleadoFileRef}
              type="file"
              accept=".docx"
              onChange={(e) => handleFileUpload(e, 'empleado')}
              className="hidden"
            />
          </div>
        </div>

        {/* Panel de errores de validación */}
        {showErrors && validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Por favor complete los siguientes campos requeridos:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowErrors(false)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de recepción */}
        <div className={`rounded-lg border p-6 ${
          theme === 'light' 
            ? 'bg-white border-gray-200' 
            : 'bg-gray-800 border-gray-700'
        }`}>
          <form className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-4">
                {/* Número de Orden */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Número de Orden
                  </label>
                  <input
                    type="text"
                    value={empleadoData.numeroOrden}
                    readOnly
                    className={`w-full px-3 py-2 border rounded-md cursor-not-allowed ${
                      theme === 'light' 
                        ? 'bg-gray-100 border-gray-300 text-gray-700' 
                        : 'bg-gray-600 border-gray-500 text-gray-300'
                    }`}
                    title="Número de orden generado automáticamente"
                  />
                </div>
                
                {/* Valor de Ingreso */}
                <div>
                  <label className={`block text-sm font-medium mb-2 flex items-center ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Valor de Ingreso
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    value={empleadoData.valorIngreso}
                    onChange={(e) => {
                      setEmpleadoData({...empleadoData, valorIngreso: e.target.value});
                      // Limpiar errores al escribir
                      if (showErrors && e.target.value.trim()) {
                        setValidationErrors(validationErrors.filter(error => error !== 'Valor de ingreso'));
                      }
                    }}
                    className={getFieldClasses('valorIngreso', `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`)}
                    placeholder="0.00"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Fecha de Recepción */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Fecha de Recepción
                  </label>
                  <input
                    type="date"
                    value={empleadoData.fecha}
                    onChange={(e) => setEmpleadoData({...empleadoData, fecha: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                  />
                </div>
                
                {/* Checkboxes de Estado de Pago */}
                <div>
                  <label className={`block text-sm font-medium mb-3 flex items-center ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Estado del Servicio
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex space-x-6">
                    {/* Pagó */}
                    <div className="flex items-center">
                      <label htmlFor="pago" className={`text-sm font-medium mr-2 ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                      }`}>
                        Pagó:
                      </label>
                      <input
                        type="checkbox"
                        id="pago"
                        checked={empleadoData.pago.pago}
                        onChange={(e) => setEmpleadoData({
                          ...empleadoData,
                          pago: {...empleadoData.pago, pago: e.target.checked}
                        })}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </div>
                    
                    {/* Debe */}
                    <div className="flex items-center">
                      <label htmlFor="debe" className={`text-sm font-medium mr-2 ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                      }`}>
                        Debe:
                      </label>
                      <input
                        type="checkbox"
                        id="debe"
                        checked={empleadoData.pago.debe}
                        onChange={(e) => setEmpleadoData({
                          ...empleadoData,
                          pago: {...empleadoData.pago, debe: e.target.checked}
                        })}
                        className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                      />
                    </div>
                    
                    {/* Garantía */}
                    <div className="flex items-center">
                      <label htmlFor="garantia" className={`text-sm font-medium mr-2 ${
                        theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                      }`}>
                        Garantía:
                      </label>
                      <input
                        type="checkbox"
                        id="garantia"
                        checked={empleadoData.pago.garantia}
                        onChange={(e) => setEmpleadoData({
                          ...empleadoData,
                          pago: {...empleadoData.pago, garantia: e.target.checked}
                        })}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Datos del Cliente y Equipo */}
            <div className={`overflow-hidden rounded-lg border ${
              theme === 'light' ? 'border-gray-300' : 'border-gray-600'
            }`}>
              <table className="w-full">
                <thead>
                  <tr className={`${
                    theme === 'light' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'bg-gray-700 text-white'
                  }`}>
                    <th className={`px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r ${
                      theme === 'light' ? 'border-gray-300' : 'border-gray-600'
                    }`}>
                      DATOS DEL CLIENTE
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider">
                      DATOS DEL EQUIPO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Fila 1: Cliente / Equipo */}
                  <tr className={`border-b ${
                    theme === 'light' ? 'border-gray-200' : 'border-gray-600'
                  }`}>
                    <td className={`px-4 py-3 border-r ${
                      theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Cliente:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={empleadoData.cliente.nombre}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              cliente: {...empleadoData.cliente, nombre: e.target.value}
                            });
                            // Limpiar errores al escribir
                            if (showErrors && e.target.value.trim()) {
                              setValidationErrors(validationErrors.filter(error => error !== 'Nombre del cliente'));
                            }
                          }}
                          className={getFieldClasses('cliente.nombre', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                          required
                        />
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${
                      theme === 'light' ? 'bg-white' : 'bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Equipo:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={empleadoData.equipo.tipo}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              equipo: {...empleadoData.equipo, tipo: e.target.value}
                            });
                            // Limpiar errores al seleccionar
                            if (showErrors && e.target.value) {
                              setValidationErrors(validationErrors.filter(error => error !== 'Tipo de equipo'));
                            }
                          }}
                          className={getFieldClasses('equipo.tipo', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                          required
                        >
                          <option value="">Seleccionar</option>
                          <option value="Hidrolavadora">Hidrolavadora</option>
                          <option value="Aspiradora">Aspiradora</option>
                          <option value="Lavadora">Lavadora</option>
                          <option value="Pulidora">Pulidora</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* Fila 2: NIT o C.C. / Referencia */}
                  <tr className={`border-b ${
                    theme === 'light' ? 'border-gray-200' : 'border-gray-600'
                  }`}>
                    <td className={`px-4 py-3 border-r ${
                      theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          NIT o C.C.:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={empleadoData.cliente.identificacion || ''}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              cliente: {...empleadoData.cliente, identificacion: e.target.value}
                            });
                            if (showErrors && e.target.value.trim()) {
                              setValidationErrors(validationErrors.filter(error => error !== 'NIT o C.C.'));
                            }
                          }}
                          className={getFieldClasses('cliente.identificacion', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                        />
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${
                      theme === 'light' ? 'bg-white' : 'bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Referencia:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={empleadoData.equipo.modelo}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              equipo: {...empleadoData.equipo, modelo: e.target.value}
                            });
                            if (showErrors && e.target.value.trim()) {
                              setValidationErrors(validationErrors.filter(error => error !== 'Modelo/Referencia del equipo'));
                            }
                          }}
                          className={getFieldClasses('equipo.modelo', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                          required
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Fila 3: Teléfono / Serial */}
                  <tr className={`border-b ${
                    theme === 'light' ? 'border-gray-200' : 'border-gray-600'
                  }`}>
                    <td className={`px-4 py-3 border-r ${
                      theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Teléfono:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="tel"
                          value={empleadoData.cliente.telefono}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              cliente: {...empleadoData.cliente, telefono: e.target.value}
                            });
                            if (showErrors && e.target.value.trim()) {
                              setValidationErrors(validationErrors.filter(error => error !== 'Teléfono del cliente'));
                            }
                          }}
                          className={getFieldClasses('cliente.telefono', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                          required
                        />
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${
                      theme === 'light' ? 'bg-white' : 'bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Serial:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={empleadoData.equipo.serie}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              equipo: {...empleadoData.equipo, serie: e.target.value}
                            });
                            if (showErrors && e.target.value.trim()) {
                              setValidationErrors(validationErrors.filter(error => error !== 'Número de serie'));
                            }
                          }}
                          className={getFieldClasses('equipo.serie', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                          required
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Fila 4: Dirección / Fecha compra */}
                  <tr className={`border-b ${
                    theme === 'light' ? 'border-gray-200' : 'border-gray-600'
                  }`}>
                    <td className={`px-4 py-3 border-r ${
                      theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Dirección:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={empleadoData.cliente.direccion}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              cliente: {...empleadoData.cliente, direccion: e.target.value}
                            });
                            if (showErrors && e.target.value.trim()) {
                              setValidationErrors(validationErrors.filter(error => error !== 'Dirección del cliente'));
                            }
                          }}
                          className={getFieldClasses('cliente.direccion', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                          required
                        />
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${
                      theme === 'light' ? 'bg-white' : 'bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Fecha compra:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="date"
                          value={empleadoData.equipo.fechaCompra || ''}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              equipo: {...empleadoData.equipo, fechaCompra: e.target.value}
                            });
                            if (showErrors && e.target.value.trim()) {
                              setValidationErrors(validationErrors.filter(error => error !== 'Fecha de compra'));
                            }
                          }}
                          className={getFieldClasses('equipo.fechaCompra', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Fila 5: Correo / Voltaje */}
                  <tr className={`border-b ${
                    theme === 'light' ? 'border-gray-200' : 'border-gray-600'
                  }`}>
                    <td className={`px-4 py-3 border-r ${
                      theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Correo:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="email"
                          value={empleadoData.cliente.correo || ''}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              cliente: {...empleadoData.cliente, correo: e.target.value}
                            });
                            if (showErrors && e.target.value.trim()) {
                              setValidationErrors(validationErrors.filter(error => error !== 'Correo'));
                            }
                          }}
                          className={getFieldClasses('cliente.correo', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                        />
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${
                      theme === 'light' ? 'bg-white' : 'bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Voltaje:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={empleadoData.equipo.voltaje || ''}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              equipo: {...empleadoData.equipo, voltaje: e.target.value}
                            });
                            if (showErrors && e.target.value) {
                              setValidationErrors(validationErrors.filter(error => error !== 'Voltaje'));
                            }
                          }}
                          className={getFieldClasses('equipo.voltaje', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                          required
                        >
                          <option value="">Seleccionar</option>
                          <option value="110V">110V</option>
                          <option value="220V">220V</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* Fila 6: Ciudad / Fecha último mantenimiento */}
                  <tr className={`border-b ${
                    theme === 'light' ? 'border-gray-200' : 'border-gray-600'
                  }`}>
                    <td className={`px-4 py-3 border-r ${
                      theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Ciudad:
                        </label>
                        <input
                          type="text"
                          value={empleadoData.cliente.ciudad}
                          onChange={(e) => setEmpleadoData({
                            ...empleadoData,
                            cliente: {...empleadoData.cliente, ciudad: e.target.value}
                          })}
                          className={`col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }}`}
                        />
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${
                      theme === 'light' ? 'bg-white' : 'bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Fecha último mantenimiento:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="date"
                          value={empleadoData.equipo.fechaUltimoMantenimiento || ''}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              equipo: {...empleadoData.equipo, fechaUltimoMantenimiento: e.target.value}
                            });
                            if (showErrors && e.target.value.trim()) {
                              setValidationErrors(validationErrors.filter(error => error !== 'Fecha último mantenimiento'));
                            }
                          }}
                          className={getFieldClasses('equipo.fechaUltimoMantenimiento', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Fila 7: Marca / Uso */}
                  <tr>
                    <td className={`px-4 py-3 border-r ${
                      theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Marca:
                        </label>
                        <input
                          type="text"
                          value={empleadoData.equipo.marca}
                          onChange={(e) => setEmpleadoData({
                            ...empleadoData,
                            equipo: {...empleadoData.equipo, marca: e.target.value}
                          })}
                          className={`col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`}
                          placeholder="KARCHER"
                        />
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${
                      theme === 'light' ? 'bg-white' : 'bg-gray-800'
                    }`}>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <label className={`text-sm font-medium flex items-center ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          Uso:
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={empleadoData.equipo.uso || ''}
                          onChange={(e) => {
                            setEmpleadoData({
                              ...empleadoData,
                              equipo: {...empleadoData.equipo, uso: e.target.value}
                            });
                            if (showErrors && e.target.value) {
                              setValidationErrors(validationErrors.filter(error => error !== 'Uso'));
                            }
                          }}
                          className={getFieldClasses('equipo.uso', `col-span-2 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                            theme === 'light' 
                              ? 'bg-white border-gray-300 text-gray-900' 
                              : 'bg-gray-700 border-gray-600 text-white'
                          }`)}
                          required
                        >
                          <option value="">Seleccionar</option>
                          <option value="Doméstico">Doméstico</option>
                          <option value="Comercial">Comercial</option>
                          <option value="Industrial">Industrial</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Estado físico del equipo */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Estado físico del equipo
              </h3>
              
              <div className={`overflow-hidden rounded-lg border ${
                theme === 'light' ? 'border-gray-300' : 'border-gray-600'
              }`}>
                <table className="w-full">
                  <thead>
                    <tr className={`${
                      theme === 'light' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'bg-gray-700 text-white'
                    }`}>
                      <th className={`px-3 py-2 text-center text-sm font-semibold border-r ${
                        theme === 'light' ? 'border-gray-300' : 'border-gray-600'
                      }`}>
                        Descripción
                      </th>
                      <th className={`px-2 py-2 text-center text-sm font-semibold border-r ${
                        theme === 'light' ? 'border-gray-300' : 'border-gray-600'
                      }`}>
                        Bueno
                      </th>
                      <th className={`px-2 py-2 text-center text-sm font-semibold border-r ${
                        theme === 'light' ? 'border-gray-300' : 'border-gray-600'
                      }`}>
                        Regular
                      </th>
                      <th className={`px-2 py-2 text-center text-sm font-semibold border-r ${
                        theme === 'light' ? 'border-gray-300' : 'border-gray-600'
                      }`}>
                        Malo
                      </th>
                      <th className={`px-2 py-2 text-center text-sm font-semibold border-r ${
                        theme === 'light' ? 'border-gray-300' : 'border-gray-600'
                      }`}>
                        No tiene
                      </th>
                      <th className="px-3 py-2 text-center text-sm font-semibold">
                        Observaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries({
                      carcasa: 'Carcasa',
                      ruedas: 'Ruedas',
                      cableadoClavija: 'Cableado y clavija',
                      acoples: 'Acoples',
                      manguera: 'Manguera',
                      pistola: 'Pistola',
                      grapaPistola: 'Grapa Pistola',
                      grapaEquipo: 'Grapa equipo',
                      depositoDetergente: 'Depósito detergente',
                      lanzaDetergente: 'Lanza detergente',
                      lanzaTurbo: 'Lanza Turbo',
                      filtroInterno: 'Filtro Interno',
                      filtroExterno: 'Filtro Externo',
                      otro: 'Otro: ___________'
                    }).map(([key, label], index) => (
                      <tr key={key} className={`border-b ${
                        theme === 'light' ? 'border-gray-200' : 'border-gray-600'
                      }`}>
                        <td className={`px-3 py-2 text-sm font-medium border-r ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-gray-50 text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}>
                          {label}
                        </td>
                        {/* Bueno */}
                        <td className={`px-2 py-2 text-center border-r ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white' 
                            : 'border-gray-600 bg-gray-800'
                        }`}>
                          <input
                            type="radio"
                            name={`estado-${key}`}
                            checked={empleadoData.estadoFisico[key].bueno}
                            onChange={() => {
                              setEmpleadoData({
                                ...empleadoData,
                                estadoFisico: {
                                  ...empleadoData.estadoFisico,
                                  [key]: {
                                    ...empleadoData.estadoFisico[key],
                                    bueno: true,
                                    regular: false,
                                    malo: false,
                                    noTiene: false
                                  }
                                }
                              });
                            }}
                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                          />
                        </td>
                        {/* Regular */}
                        <td className={`px-2 py-2 text-center border-r ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white' 
                            : 'border-gray-600 bg-gray-800'
                        }`}>
                          <input
                            type="radio"
                            name={`estado-${key}`}
                            checked={empleadoData.estadoFisico[key].regular}
                            onChange={() => {
                              setEmpleadoData({
                                ...empleadoData,
                                estadoFisico: {
                                  ...empleadoData.estadoFisico,
                                  [key]: {
                                    ...empleadoData.estadoFisico[key],
                                    bueno: false,
                                    regular: true,
                                    malo: false,
                                    noTiene: false
                                  }
                                }
                              });
                            }}
                            className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                          />
                        </td>
                        {/* Malo */}
                        <td className={`px-2 py-2 text-center border-r ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white' 
                            : 'border-gray-600 bg-gray-800'
                        }`}>
                          <input
                            type="radio"
                            name={`estado-${key}`}
                            checked={empleadoData.estadoFisico[key].malo}
                            onChange={() => {
                              setEmpleadoData({
                                ...empleadoData,
                                estadoFisico: {
                                  ...empleadoData.estadoFisico,
                                  [key]: {
                                    ...empleadoData.estadoFisico[key],
                                    bueno: false,
                                    regular: false,
                                    malo: true,
                                    noTiene: false
                                  }
                                }
                              });
                            }}
                            className="w-4 h-4 text-red-600 focus:ring-red-500"
                          />
                        </td>
                        {/* No tiene */}
                        <td className={`px-2 py-2 text-center border-r ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white' 
                            : 'border-gray-600 bg-gray-800'
                        }`}>
                          <input
                            type="radio"
                            name={`estado-${key}`}
                            checked={empleadoData.estadoFisico[key].noTiene}
                            onChange={() => {
                              setEmpleadoData({
                                ...empleadoData,
                                estadoFisico: {
                                  ...empleadoData.estadoFisico,
                                  [key]: {
                                    ...empleadoData.estadoFisico[key],
                                    bueno: false,
                                    regular: false,
                                    malo: false,
                                    noTiene: true
                                  }
                                }
                              });
                            }}
                            className="w-4 h-4 text-gray-600 focus:ring-gray-500"
                          />
                        </td>
                        {/* Observaciones */}
                        <td className={`px-2 py-2 ${
                          theme === 'light' ? 'bg-white' : 'bg-gray-800'
                        }`}>
                          <input
                            type="text"
                            value={empleadoData.estadoFisico[key].observaciones}
                            onChange={(e) => {
                              setEmpleadoData({
                                ...empleadoData,
                                estadoFisico: {
                                  ...empleadoData.estadoFisico,
                                  [key]: {
                                    ...empleadoData.estadoFisico[key],
                                    observaciones: e.target.value
                                  }
                                }
                              });
                            }}
                            className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-green-500 focus:border-transparent ${
                              theme === 'light' 
                                ? 'bg-white border-gray-300 text-gray-900' 
                                : 'bg-gray-700 border-gray-600 text-white'
                            }`}
                            placeholder="Observaciones..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Estado y observaciones */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Estado del Equipo
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Estado General *
                  </label>
                  <select
                    value={empleadoData.recepcion.estadoGeneral}
                    onChange={(e) => setEmpleadoData({
                      ...empleadoData,
                      recepcion: {...empleadoData.recepcion, estadoGeneral: e.target.value}
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    required
                  >
                    <option value="">Seleccionar estado</option>
                    <option value="Excelente">Excelente</option>
                    <option value="Bueno">Bueno</option>
                    <option value="Regular">Regular</option>
                    <option value="Malo">Malo</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Falla Reportada
                  </label>
                  <textarea
                    value={empleadoData.recepcion.falla}
                    onChange={(e) => {
                      setEmpleadoData({
                        ...empleadoData,
                        recepcion: {...empleadoData.recepcion, falla: e.target.value}
                      });
                      if (showErrors && e.target.value.trim()) {
                        setValidationErrors(validationErrors.filter(error => error !== 'Motivo de ingreso (falla reportada)'));
                      }
                    }}
                    rows={3}
                    className={getFieldClasses('recepcion.falla', `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`)}
                    placeholder="Describa la falla reportada por el cliente"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Observaciones Adicionales
                  </label>
                  <textarea
                    value={empleadoData.recepcion.observaciones}
                    onChange={(e) => setEmpleadoData({
                      ...empleadoData,
                      recepcion: {...empleadoData.recepcion, observaciones: e.target.value}
                    })}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="Observaciones del estado físico, accesorios faltantes, etc."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Recibido por
                  </label>
                  <input
                    type="text"
                    value={empleadoData.recepcion.recibioPor}
                    onChange={(e) => {
                      setEmpleadoData({
                        ...empleadoData,
                        recepcion: {...empleadoData.recepcion, recibioPor: e.target.value}
                      });
                      if (showErrors && e.target.value.trim()) {
                        setValidationErrors(validationErrors.filter(error => error !== 'Recibido por'));
                      }
                    }}
                    className={getFieldClasses('recepcion.recibioPor', `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`)}
                    placeholder="Nombre del empleado que recibe"
                    required
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderTecnicoForm = () => (
    <div className="p-6 h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveSection('main')}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light' 
                  ? 'hover:bg-gray-100 text-gray-600' 
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Wrench className={`w-6 h-6 ${
              theme === 'light' ? 'text-orange-600' : 'text-orange-400'
            }`} />
            <h1 className={`text-2xl font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Informe Técnico
            </h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => tecnicoFileRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              title="Cargar documento Word existente"
            >
              <Upload className="w-4 h-4" />
              <span>Cargar Word</span>
            </button>
            <button
              onClick={() => generateDocument('tecnico', tecnicoData)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <File className="w-4 h-4" />
              <span>Generar Word</span>
            </button>
            <input
              ref={tecnicoFileRef}
              type="file"
              accept=".docx"
              onChange={(e) => handleFileUpload(e, 'tecnico')}
              className="hidden"
            />
          </div>
        </div>

        {/* Formulario técnico */}
        <div className={`rounded-lg border p-6 ${
          theme === 'light' 
            ? 'bg-white border-gray-200' 
            : 'bg-gray-800 border-gray-700'
        }`}>
          <form className="space-y-6">
            {/* Información básica */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Número de Orden
              </label>
              <input
                type="text"
                value={tecnicoData.numeroOrden}
                readOnly
                className={`w-full px-3 py-2 border rounded-md cursor-not-allowed ${
                  theme === 'light' 
                    ? 'bg-gray-100 border-gray-300 text-gray-700' 
                    : 'bg-gray-600 border-gray-500 text-gray-300'
                }`}
                title="Número de orden generado automáticamente"
              />
            </div>

            {/* Diagnóstico */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Diagnóstico del Equipo
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Problema Detectado *
                  </label>
                  <textarea
                    value={tecnicoData.diagnostico.problemaDetectado}
                    onChange={(e) => setTecnicoData({
                      ...tecnicoData,
                      diagnostico: {...tecnicoData.diagnostico, problemaDetectado: e.target.value}
                    })}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Causa Probable *
                  </label>
                  <textarea
                    value={tecnicoData.diagnostico.causaProbable}
                    onChange={(e) => setTecnicoData({
                      ...tecnicoData,
                      diagnostico: {...tecnicoData.diagnostico, causaProbable: e.target.value}
                    })}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Solución Propuesta *
                  </label>
                  <textarea
                    value={tecnicoData.diagnostico.solucionPropuesta}
                    onChange={(e) => setTecnicoData({
                      ...tecnicoData,
                      diagnostico: {...tecnicoData.diagnostico, solucionPropuesta: e.target.value}
                    })}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Repuestos Necesarios
                    </label>
                    <textarea
                      value={tecnicoData.diagnostico.repuestosNecesarios}
                      onChange={(e) => setTecnicoData({
                        ...tecnicoData,
                        diagnostico: {...tecnicoData.diagnostico, repuestosNecesarios: e.target.value}
                      })}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        theme === 'light' 
                          ? 'bg-white border-gray-300 text-gray-900' 
                          : 'bg-gray-700 border-gray-600 text-white'
                      }`}
                      placeholder="Lista de repuestos requeridos"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Tiempo Estimado de Reparación
                    </label>
                    <input
                      type="text"
                      value={tecnicoData.diagnostico.tiempoEstimado}
                      onChange={(e) => setTecnicoData({
                        ...tecnicoData,
                        diagnostico: {...tecnicoData.diagnostico, tiempoEstimado: e.target.value}
                      })}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        theme === 'light' 
                          ? 'bg-white border-gray-300 text-gray-900' 
                          : 'bg-gray-700 border-gray-600 text-white'
                      }`}
                      placeholder="Ej: 2-3 días hábiles"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist de revisión */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Checklist de Revisión
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  pruebasFuncionales: 'Pruebas Funcionales',
                  limpiezaInterna: 'Limpieza Interna',
                  revisionElectrica: 'Revisión Eléctrica',
                  revisionMecanica: 'Revisión Mecánica'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      checked={tecnicoData.revision[key as keyof typeof tecnicoData.revision]}
                      onChange={(e) => setTecnicoData({
                        ...tecnicoData,
                        revision: {
                          ...tecnicoData.revision,
                          [key]: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <label htmlFor={key} className={`ml-2 text-sm font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-300'
                    }`}>
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Información del técnico */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Información del Técnico
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Nombre del Técnico *
                  </label>
                  <input
                    type="text"
                    value={tecnicoData.tecnico.nombre}
                    onChange={(e) => setTecnicoData({
                      ...tecnicoData,
                      tecnico: {...tecnicoData.tecnico, nombre: e.target.value}
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Fecha de Diagnóstico *
                  </label>
                  <input
                    type="date"
                    value={tecnicoData.tecnico.fecha}
                    onChange={(e) => setTecnicoData({
                      ...tecnicoData,
                      tecnico: {...tecnicoData.tecnico, fecha: e.target.value}
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Observaciones del Técnico
                </label>
                <textarea
                  value={tecnicoData.tecnico.observaciones}
                  onChange={(e) => setTecnicoData({
                    ...tecnicoData,
                    tecnico: {...tecnicoData.tecnico, observaciones: e.target.value}
                  })}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    theme === 'light' 
                      ? 'bg-white border-gray-300 text-gray-900' 
                      : 'bg-gray-700 border-gray-600 text-white'
                  }`}
                  placeholder="Observaciones adicionales, recomendaciones, etc."
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderClienteForm = () => (
    <div className="p-6 h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveSection('main')}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light' 
                  ? 'hover:bg-gray-100 text-gray-600' 
                  : 'hover:bg-gray-700 text-gray-400'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Users className={`w-6 h-6 ${
              theme === 'light' ? 'text-purple-600' : 'text-purple-400'
            }`} />
            <h1 className={`text-2xl font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Cotización para Cliente
            </h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => clienteFileRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              title="Cargar documento Word existente"
            >
              <Upload className="w-4 h-4" />
              <span>Cargar Word</span>
            </button>
            <button
              onClick={() => generateDocument('cliente', clienteData)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <File className="w-4 h-4" />
              <span>Generar Word</span>
            </button>
            <input
              ref={clienteFileRef}
              type="file"
              accept=".docx"
              onChange={(e) => handleFileUpload(e, 'cliente')}
              className="hidden"
            />
          </div>
        </div>

        {/* Formulario cliente */}
        <div className={`rounded-lg border p-6 ${
          theme === 'light' 
            ? 'bg-white border-gray-200' 
            : 'bg-gray-800 border-gray-700'
        }`}>
          <form className="space-y-6">
            {/* Información básica */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Número de Orden
              </label>
              <input
                type="text"
                value={clienteData.numeroOrden}
                readOnly
                className={`w-full px-3 py-2 border rounded-md cursor-not-allowed ${
                  theme === 'light' 
                    ? 'bg-gray-100 border-gray-300 text-gray-700' 
                    : 'bg-gray-600 border-gray-500 text-gray-300'
                }`}
                title="Número de orden generado automáticamente"
              />
            </div>

            {/* Descripción del trabajo */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Descripción del Servicio
              </h3>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Descripción del Trabajo a Realizar *
                </label>
                <textarea
                  value={clienteData.cotizacion.descripcionTrabajo}
                  onChange={(e) => setClienteData({
                    ...clienteData,
                    cotizacion: {...clienteData.cotizacion, descripcionTrabajo: e.target.value}
                  })}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    theme === 'light' 
                      ? 'bg-white border-gray-300 text-gray-900' 
                      : 'bg-gray-700 border-gray-600 text-white'
                  }`}
                  placeholder="Detalle del servicio técnico a realizar"
                  required
                />
              </div>
            </div>

            {/* Costos */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Detalle de Costos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Mano de Obra (COP) *
                  </label>
                  <input
                    type="number"
                    value={clienteData.cotizacion.manoDeObra}
                    onChange={(e) => {
                      const manoDeObra = parseFloat(e.target.value) || 0;
                      const subtotal = manoDeObra + clienteData.cotizacion.repuestos.reduce((sum, r) => sum + r.valorTotal, 0);
                      const iva = subtotal * 0.19;
                      const total = subtotal + iva;
                      setClienteData({
                        ...clienteData,
                        cotizacion: {
                          ...clienteData.cotizacion,
                          manoDeObra,
                          subtotal,
                          iva,
                          total
                        }
                      });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    min="0"
                    step="1000"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Tiempo de Entrega
                  </label>
                  <input
                    type="text"
                    value={clienteData.cotizacion.tiempoEntrega}
                    onChange={(e) => setClienteData({
                      ...clienteData,
                      cotizacion: {...clienteData.cotizacion, tiempoEntrega: e.target.value}
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="Ej: 3-5 días hábiles"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Garantía del Servicio
                  </label>
                  <input
                    type="text"
                    value={clienteData.cotizacion.garantia}
                    onChange={(e) => setClienteData({
                      ...clienteData,
                      cotizacion: {...clienteData.cotizacion, garantia: e.target.value}
                    })}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="Ej: 90 días"
                  />
                </div>
              </div>
            </div>

            {/* Resumen de costos */}
            <div className={`border rounded-lg p-4 ${
              theme === 'light' 
                ? 'bg-gray-50 border-gray-200' 
                : 'bg-gray-700 border-gray-600'
            }`}>
              <h4 className={`text-md font-semibold mb-3 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Resumen de Cotización
              </h4>
              <div className="space-y-2 text-sm">
                <div className={`flex justify-between ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  <span>Subtotal:</span>
                  <span>$ {clienteData.cotizacion.subtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className={`flex justify-between ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  <span>IVA (19%):</span>
                  <span>$ {clienteData.cotizacion.iva.toLocaleString('es-CO')}</span>
                </div>
                <hr className={theme === 'light' ? 'border-gray-200' : 'border-gray-600'} />
                <div className={`flex justify-between font-semibold text-lg ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  <span>Total:</span>
                  <span>$ {clienteData.cotizacion.total.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Observaciones para el Cliente
              </label>
              <textarea
                value={clienteData.observaciones}
                onChange={(e) => setClienteData({...clienteData, observaciones: e.target.value})}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  theme === 'light' 
                    ? 'bg-white border-gray-300 text-gray-900' 
                    : 'bg-gray-700 border-gray-600 text-white'
                }`}
                placeholder="Condiciones especiales, recomendaciones, términos y condiciones..."
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Renderizar la sección activa
  switch (activeSection) {
    case 'empleado':
      return renderEmpleadoForm();
    case 'tecnico':
      return renderTecnicoForm();
    case 'cliente':
      return renderClienteForm();
    default:
      return renderMainView();
  }
}
