import React, { useState } from 'react';
import { X, QrCode, Search, Plus, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'entregada':
    case 'lista para entregar':
      return 'bg-green-500'; // Verde para completadas/listas
    case 'en reparación':
    case 'en aprobación':
    case 'en diagnóstico':
      return 'bg-orange-500'; // Naranja para en proceso
    case 'esperando repuestos':
    case 'pendiente':
    case 'rechazada':
    default:
      return 'bg-red-500'; // Rojo para problemas/pendientes
  }
};

const ordenesData = [
  { id: '25-0127', date: '17 sep. 2025', identification: '890404970', client: 'GRUPO HOTELERO MAR Y SOL', equipment: '[1.601-850.0] Kärcher K 4 *MX (165401)', model: '1.601-850.0', serial: '165401', brand: 'Kärcher', status: 'Esperando repuestos', responsible: 'TEAM SERVICE COSTA', orderType: 'Garantía', deliveryType: 'Aprobada', approval: 'Aprobada', priority: 'Normal', receptionComments: 'Garantía ingresada por Homecenter, equipo visualmente en buen estado, cliente manifiesta...', internalComments: '' },
  { id: '25-0126', date: '17 sep. 2025', identification: '800655905', client: 'Delta Ingeniería', equipment: '[1.994-378.0] Kärcher Kärcher Compacta *MX (151272)', model: '1.994-378.0', serial: '151272', brand: 'Kärcher', status: 'Esperando repuestos', responsible: 'TEAM SERVICE COSTA', orderType: 'Garantía', deliveryType: 'Sin revisar', approval: 'Sin revisar', priority: 'Normal', receptionComments: 'Ingresa garantía de Homecenter comprada en sede La Papa, equipo ingresa en estado visual...', internalComments: '' },
  { id: '25-0125', date: '18 sept. 2024', identification: '443251897', client: 'Jonathan Estrada', equipment: 'Lavadora Automática "Max Compact"', model: '[1304-1700] Kärcher Max Compact', serial: '1804-1700', brand: 'Kärcher', status: 'En reparación', responsible: 'TS Costa MTR', orderType: 'Garantía', deliveryType: 'Aprobada', approval: 'Aprobada', priority: 'Normal', receptionComments: 'HOMECENTER SODIMAC CORONA Equipo ingresó a centro de servicio autorizado, el cual client...', internalComments: '' },
  { id: '25-0124', date: '16 sept. 2024', identification: '108456772', client: 'Marginal Luz', equipment: 'Aspiradora Industrial', model: '[1301-0800] Kärcher K3', serial: '1804-1700', brand: 'Kärcher', status: 'Esperando repuestos', responsible: 'TS Costa MTR', orderType: 'Garantía', deliveryType: 'Aprobada', approval: 'Aprobada', priority: 'Normal', receptionComments: 'SODIMAC HOMECENTER SINCELLEJO Equipo ingresa a CSA, el cual, cliente manifiesta que que o...', internalComments: '' },
  { id: '25-0123', date: '15 sept. 2024', identification: '901234567', client: 'Melitón Velazquez', equipment: 'Lavadora A1 "Max (10/800)"', model: '[1601-0800] Kärcher A1', serial: '1500-0800', brand: 'Kärcher', status: 'Lista para entregar', responsible: 'TEAM SERVICE COSTA', orderType: 'Garantía', deliveryType: 'Reparada', approval: 'Aprobada', priority: 'Normal', receptionComments: 'Cliente ingresa equipo a garantía comprado en Homecenter Cartagena, visualmente equipo...', internalComments: '' },
  { id: '25-0122', date: '18 sept. 2024', identification: '789012345', client: 'Confidenta Luis Marquez', equipment: 'Kärcher K1 "Max (10/800)"', model: '[1600-0800] Kärcher K1', serial: '1600-0800', brand: 'Kärcher', status: 'Entregada', responsible: 'TEAM SERVICE COSTA', orderType: 'Garantía', deliveryType: 'Reparada', approval: 'Rechazada', priority: 'Normal', receptionComments: 'Ingresa garantía de Homecenter comprada en sede La Papa, equipo ingresó en estado visual...', internalComments: '' }
];

export default function Ordenes() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewModelModal, setShowNewModelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof ordenesData[0] | null>(null);
  const [formData, setFormData] = useState({
    qrCode: '',
    cliente: '',
    modelo: '',
    seriePlaca: '',
    tipo: '',
    equipo: ''
  });
  const [clientFormData, setClientFormData] = useState({
    tipoDocumento: 'CEDULA DE CIUDADANIA',
    identificacion: '',
    dv: '',
    esJuridica: false,
    razonSocial: '',
    regimen: 'NO RESPONSABLE DE IVA NO DECLARANTE DE RENTA',
    nombreComercial: '',
    ciudad: '',
    direccion: '',
    telefono: '',
    nombreContacto: '',
    telefonoContacto: '',
    correoElectronico: '',
    comentariosCliente: ''
  });
  const [modelFormData, setModelFormData] = useState({
    modelo: '',
    descripcion: '',
    marca: '',
    modeloPadre: '',
    valorRevision: '',
    estado: 'Habilitado',
    costo: '',
    repuesto: '',
    tipoModelo: '',
    fichaTecnica: '',
    accesorios: '',
    habilitadoParaCrearOrden: false
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClientInputChange = (field: string, value: string | boolean) => {
    setClientFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleModelInputChange = (field: string, value: string | boolean) => {
    setModelFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNewClient = () => {
    setShowNewClientModal(true);
  };

  const handleNewModel = () => {
    setShowNewModelModal(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí manejarías la creación del nuevo cliente
    console.log('Nuevo cliente:', clientFormData);
    // Agregar el nuevo cliente al select de clientes
    setFormData(prev => ({
      ...prev,
      cliente: clientFormData.razonSocial
    }));
    setShowNewClientModal(false);
    // Resetear formulario de cliente
    setClientFormData({
      tipoDocumento: 'CEDULA DE CIUDADANIA',
      identificacion: '',
      dv: '',
      esJuridica: false,
      razonSocial: '',
      regimen: 'NO RESPONSABLE DE IVA NO DECLARANTE DE RENTA',
      nombreComercial: '',
      ciudad: '',
      direccion: '',
      telefono: '',
      nombreContacto: '',
      telefonoContacto: '',
      correoElectronico: '',
      comentariosCliente: ''
    });
  };

  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí manejarías la creación del nuevo modelo
    console.log('Nuevo modelo:', modelFormData);
    // Agregar el nuevo modelo al select de modelos
    setFormData(prev => ({
      ...prev,
      modelo: modelFormData.modelo
    }));
    setShowNewModelModal(false);
    // Resetear formulario de modelo
    setModelFormData({
      modelo: '',
      descripcion: '',
      marca: '',
      modeloPadre: '',
      valorRevision: '',
      estado: 'Habilitado',
      costo: '',
      repuesto: '',
      tipoModelo: '',
      fichaTecnica: '',
      accesorios: '',
      habilitadoParaCrearOrden: false
    });
  };

  const handleViewOrder = (order: typeof ordenesData[0]) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí manejarías la creación de la nueva orden
    console.log('Nueva orden:', formData);
    setShowNewOrderModal(false);
    // Resetear formulario
    setFormData({
      qrCode: '',
      cliente: '',
      modelo: '',
      seriePlaca: '',
      tipo: '',
      equipo: ''
    });
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header compacto */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select className={`border rounded px-3 py-1 text-sm ${
            theme === 'light' 
              ? 'border-gray-300 bg-white text-gray-900' 
              : 'border-gray-600 bg-gray-700 text-white'
          }`}>
            <option>Todas</option>
            <option>Pendientes</option>
            <option>En proceso</option>
            <option>Completadas</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowNewOrderModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md professional-text text-sm"
          >
            Nueva orden
          </button>
          <button className={`px-4 py-2 rounded-md professional-text text-sm transition-colors duration-200 ${
            theme === 'light'
              ? 'bg-mint-400 hover:bg-mint-500 text-white'
              : 'bg-lime-400/80 hover:bg-lime-400 text-black font-bold'
          }`}>
            Pendientes
          </button>
          <button className={`px-4 py-2 rounded-md professional-text text-sm transition-colors duration-200 ${
            theme === 'light'
              ? 'bg-mint-600 hover:bg-mint-700 text-white'
              : 'bg-lime-500 hover:bg-lime-600 text-black font-bold'
          }`}>
            Mis órdenes
          </button>
          <button className={`px-4 py-2 rounded-md professional-text text-sm transition-colors duration-200 ${
            theme === 'light'
              ? 'bg-mint-500 hover:bg-mint-600 text-white'
              : 'bg-lime-400 hover:bg-lime-500 text-black font-bold border border-lime-400/30'
          }`}>
            Exportar
          </button>
        </div>
      </div>

      {/* Contenedor principal con scroll único */}
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-max">
          {/* Encabezados de columnas fijas */}
          <div className="mb-4">
            <div className={`flex gap-6 text-xs font-medium uppercase tracking-wider ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}>
              <div className="w-32 px-3 flex items-center justify-between">
                <span className="flex items-center">
                  <Filter className="w-3 h-3 mr-1" />
                  Orden
                </span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-36 px-3 flex items-center justify-between">
                <span>Fecha de creación</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-28 px-3 flex items-center justify-between">
                <span>Iden.</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-48 px-3 flex items-center justify-between">
                <span>Cliente</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-52 px-3 flex items-center justify-between">
                <span>Equipo</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-40 px-3 flex items-center justify-between">
                <span>Modelo</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-32 px-3 flex items-center justify-between">
                <span>Serie/Placa</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-28 px-3 flex items-center justify-between">
                <span>Marca</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-36 px-3 flex items-center justify-between">
                <span>Estado</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-44 px-3 flex items-center justify-between">
                <span>Responsable</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-32 px-3 flex items-center justify-between">
                <span>Tipo orden</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-36 px-3 flex items-center justify-between">
                <span>Tipo de entrega</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-32 px-3 flex items-center justify-between">
                <span>Aprobación</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-28 px-3 flex items-center justify-between">
                <span>Prioridad</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-60 px-3 flex items-center justify-between">
                <span>Comentarios de recepción</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
              <div className="w-60 px-3 flex items-center justify-between">
                <span>Comentarios internos</span>
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 -mt-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Campos de filtro alineados con las columnas */}
          <div className="mb-6">
            <div className="flex gap-6 text-sm">
              <div className="w-32 px-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-3 py-2 border rounded text-sm transition-colors duration-200 ${
                    theme === 'light' 
                      ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-mint-500 focus:ring-1 focus:ring-mint-500' 
                      : 'border-lime-400/30 bg-dark-bg-secondary text-white placeholder-gray-400 focus:border-lime-400 focus:ring-1 focus:ring-lime-400'
                  }`}
                  placeholder=""
                />
              </div>
              <div className="w-36 px-3">
                <input
                  type="date"
                  className={`w-full px-3 py-2 border rounded text-sm transition-colors duration-200 ${
                    theme === 'light' 
                      ? 'border-gray-300 bg-white text-gray-900 focus:border-mint-500 focus:ring-1 focus:ring-mint-500' 
                      : 'border-lime-400/30 bg-dark-bg-secondary text-white focus:border-lime-400 focus:ring-1 focus:ring-lime-400'
                  }`}
                  defaultValue="2025-09-17"
                />
              </div>
              <div className="w-28 px-3">
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded text-sm ${
                    theme === 'light' 
                      ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                      : 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                  }`}
                  placeholder=""
                />
              </div>
              <div className="w-48 px-3">
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded text-sm ${
                    theme === 'light' 
                      ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                      : 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                  }`}
                  placeholder=""
                />
              </div>
              <div className="w-52 px-3">
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded text-sm ${
                    theme === 'light' 
                      ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                      : 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                  }`}
                  placeholder=""
                />
              </div>
              <div className="w-40 px-3">
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded text-sm ${
                    theme === 'light' 
                      ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                      : 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                  }`}
                  placeholder=""
                />
              </div>
              <div className="w-32 px-3">
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded text-sm ${
                    theme === 'light' 
                      ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                      : 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                  }`}
                  placeholder=""
                />
              </div>
              <div className="w-28 px-3">
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded text-sm ${
                    theme === 'light' 
                      ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                      : 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                  }`}
                  placeholder=""
                />
              </div>
              <div className="w-36 px-3">
                <select className={`w-full px-3 py-2 border rounded text-sm ${
                  theme === 'light' 
                    ? 'border-gray-300 bg-white text-gray-900' 
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}>
                  <option>Todas</option>
                  <option>Esperando repuestos</option>
                  <option>En reparación</option>
                  <option>Lista para entregar</option>
                  <option>Entregada</option>
                </select>
              </div>
              <div className="w-44 px-3">
                <select className={`w-full px-3 py-2 border rounded text-sm ${
                  theme === 'light' 
                    ? 'border-gray-300 bg-white text-gray-900' 
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}>
                  <option>Todas</option>
                  <option>TEAM SERVICE COSTA</option>
                  <option>TS Costa MTR</option>
                </select>
              </div>
              <div className="w-32 px-3">
                <select className={`w-full px-3 py-2 border rounded text-sm ${
                  theme === 'light' 
                    ? 'border-gray-300 bg-white text-gray-900' 
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}>
                  <option>Todas</option>
                  <option>Garantía</option>
                  <option>Reparación</option>
                  <option>Mantenimiento</option>
                </select>
              </div>
              <div className="w-36 px-3">
                <select className={`w-full px-3 py-2 border rounded text-sm ${
                  theme === 'light' 
                    ? 'border-gray-300 bg-white text-gray-900' 
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}>
                  <option></option>
                  <option>Reparada</option>
                </select>
              </div>
              <div className="w-32 px-3">
                <select className={`w-full px-3 py-2 border rounded text-sm ${
                  theme === 'light' 
                    ? 'border-gray-300 bg-white text-gray-900' 
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}>
                  <option></option>
                  <option>Sin revisar</option>
                  <option>Aprobada</option>
                  <option>Rechazada</option>
                </select>
              </div>
              <div className="w-28 px-3">
                <select className={`w-full px-3 py-2 border rounded text-sm ${
                  theme === 'light' 
                    ? 'border-gray-300 bg-white text-gray-900' 
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}>
                  <option>Todas</option>
                  <option>Normal</option>
                  <option>Alta</option>
                  <option>Baja</option>
                </select>
              </div>
              <div className="w-60 px-3">
                <input
                  type="text"
                  value=""
                  readOnly
                  className={`w-full px-3 py-2 border rounded text-sm bg-gray-50 cursor-not-allowed ${
                    theme === 'light' 
                      ? 'border-gray-300 text-gray-500' 
                      : 'border-gray-600 bg-gray-800 text-gray-400'
                  }`}
                  placeholder=""
                />
              </div>
              <div className="w-60 px-3">
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded text-sm ${
                    theme === 'light' 
                      ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                      : 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                  }`}
                  placeholder=""
                />
              </div>
            </div>
          </div>

          {/* Tabla principal de órdenes */}
          <div className={`shadow-sm rounded-lg border ${
            theme === 'light' 
              ? 'bg-white border-gray-200' 
              : 'bg-gray-800 border-gray-700'
          }`}>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
              <div className={`${
                theme === 'light' ? 'bg-white' : 'bg-gray-800'
              }`}>
                {ordenesData.map((order, index) => (
                  <div key={order.id} className={`flex gap-6 py-4 transition-colors duration-150 border-b ${
                    theme === 'light'
                      ? `hover:bg-gray-50 border-gray-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`
                      : `hover:bg-gray-700 border-gray-600 ${
                          index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900/30'
                        }`
                  }`}>
                    <div className="w-32 px-3 py-2">
                      <div className="flex items-center">
                        <Search className={`w-4 h-4 mr-2 ${
                          theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusColor(order.status)}`}></span>
                        <span className={`font-medium text-sm ${
                          theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                        }`}>{order.id}</span>
                      </div>
                    </div>
                    <div className={`w-36 px-3 py-2 text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.date}
                    </div>
                    <div className={`w-28 px-3 py-2 text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.identification}
                    </div>
                    <div className={`w-48 px-3 py-2 text-sm truncate ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.client}
                    </div>
                    <div className={`w-52 px-3 py-2 text-sm truncate ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.equipment}
                    </div>
                    <div className={`w-40 px-3 py-2 text-sm truncate ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.model}
                    </div>
                    <div className={`w-32 px-3 py-2 text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.serial}
                    </div>
                    <div className={`w-28 px-3 py-2 text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.brand}
                    </div>
                    <div className={`w-36 px-3 py-2 text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.status}
                    </div>
                    <div className={`w-44 px-3 py-2 text-sm truncate ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.responsible}
                    </div>
                    <div className={`w-32 px-3 py-2 text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.orderType}
                    </div>
                    <div className={`w-36 px-3 py-2 text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.deliveryType}
                    </div>
                    <div className={`w-32 px-3 py-2 text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.approval}
                    </div>
                    <div className={`w-28 px-3 py-2 text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.priority}
                    </div>
                    <div className={`w-60 px-3 py-2 text-sm truncate ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.receptionComments}
                    </div>
                    <div className={`w-60 px-3 py-2 text-sm truncate ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {order.internalComments}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nueva Orden */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div className="fixed inset-0 transition-opacity bg-gray-500/75 backdrop-blur-sm" onClick={() => setShowNewOrderModal(false)}></div>
            
            {/* Modal */}
            <div className={`relative inline-block w-full max-w-sm px-5 py-4 overflow-hidden text-left align-middle transition-all transform rounded-xl shadow-xl ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-base font-semibold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Nueva orden
                </h3>
                <button
                  onClick={() => setShowNewOrderModal(false)}
                  className={`text-gray-400 hover:text-gray-600 transition-colors ${
                    theme === 'light' ? 'hover:text-gray-600' : 'hover:text-gray-300'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Campo QR */}
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Escanear código QR
                  </label>
                  <div className="flex space-x-1">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={formData.qrCode}
                        onChange={(e) => handleInputChange('qrCode', e.target.value)}
                        className={`w-full pl-2 pr-8 py-1.5 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                            : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                        }`}
                        placeholder=""
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <QrCode className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1.5 rounded text-xs font-medium transition-colors"
                    >
                      Buscar
                    </button>
                  </div>
                </div>

                {/* Campo Cliente */}
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-1">
                    <div className="flex-1 relative">
                      <select
                        value={formData.cliente}
                        onChange={(e) => handleInputChange('cliente', e.target.value)}
                        className={`w-full pl-2 pr-7 py-1.5 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                        required
                      >
                        <option value="">Buscar o seleccionar cliente</option>
                        <option value="cliente1">Abraham Ganem</option>
                        <option value="cliente2">ACEVEDO HANS</option>
                        <option value="cliente3">Delta Ingeniería</option>
                        <option value="cliente4">GRUPO HOTELERO MAR Y SOL</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleNewClient}
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Campo Modelo */}
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Modelo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-1">
                    <div className="flex-1 relative">
                      <select
                        value={formData.modelo}
                        onChange={(e) => handleInputChange('modelo', e.target.value)}
                        className={`w-full pl-2 pr-7 py-1.5 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                        required
                      >
                        <option value="">Buscar o seleccionar modelo</option>
                        <option value="modelo1">[1.601-850.0] Kärcher K 4 *MX</option>
                        <option value="modelo2">[1.994-378.0] Kärcher Compacta *MX</option>
                        <option value="modelo3">[1304-1700] Kärcher Max Compact</option>
                        <option value="modelo4">[1301-0800] Kärcher K3</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleNewModel}
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Campo Serie/Placa */}
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Serie/Placa <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.seriePlaca}
                    onChange={(e) => handleInputChange('seriePlaca', e.target.value)}
                    rows={2}
                    className={`w-full px-2 py-1.5 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none transition-colors ${
                      theme === 'light' 
                        ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                        : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                    }`}
                    placeholder=""
                    required
                  />
                </div>

                {/* Campo Tipo */}
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.tipo}
                      onChange={(e) => handleInputChange('tipo', e.target.value)}
                      className={`w-full pl-2 pr-7 py-1.5 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900' 
                          : 'border-gray-600 bg-gray-700 text-white'
                      }`}
                      required
                    >
                      <option value=""></option>
                      <option value="garantia">Garantía</option>
                      <option value="reparacion">Reparación</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="revision">Revisión</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Campo Equipo */}
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Equipo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <select
                        value={formData.equipo}
                        onChange={(e) => handleInputChange('equipo', e.target.value)}
                        className={`w-full pl-2 pr-7 py-1.5 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                        required
                      >
                        <option value=""></option>
                        <option value="lavadora">Lavadora</option>
                        <option value="aspiradora">Aspiradora</option>
                        <option value="hidrolavadora">Hidrolavadora</option>
                        <option value="pulidora">Pulidora</option>
                        <option value="otro">Otro</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="crear-equipo" 
                        className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                      />
                      <label 
                        htmlFor="crear-equipo" 
                        className={`ml-1 text-xs font-medium whitespace-nowrap ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}
                      >
                        Crear equipo
                      </label>
                    </div>
                  </div>
                </div>

                {/* Botón de acción */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-xs font-medium transition-colors min-w-[100px]"
                  >
                    Crear orden
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Cliente */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div className="fixed inset-0 transition-opacity bg-gray-500/75 backdrop-blur-sm" onClick={() => setShowNewClientModal(false)}></div>
            
            {/* Modal */}
            <div className={`relative inline-block w-full max-w-2xl px-8 py-4 overflow-hidden text-left align-middle transition-all transform rounded-xl shadow-xl ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-base font-semibold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Nuevo cliente
                </h3>
                <button
                  onClick={() => setShowNewClientModal(false)}
                  className={`text-gray-400 hover:text-gray-600 transition-colors ${
                    theme === 'light' ? 'hover:text-gray-600' : 'hover:text-gray-300'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Subtitle */}
              <div className={`mb-2 pb-1 border-b ${
                theme === 'light' ? 'border-gray-200' : 'border-gray-600'
              }`}>
                <h4 className={`text-xs font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  Información cliente
                </h4>
              </div>

              <form onSubmit={handleSaveClient} className="space-y-1.5">
                {/* Primera fila: Tipo documento, Identificación, DV, Régimen */}
                <div className="grid grid-cols-8 gap-3">
                  <div className="col-span-2">
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Tipo documento <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={clientFormData.tipoDocumento}
                        onChange={(e) => handleClientInputChange('tipoDocumento', e.target.value)}
                        className={`w-full pl-2 pr-6 py-1 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                        required
                      >
                        <option value="CEDULA DE CIUDADANIA">CC</option>
                        <option value="NIT">NIT</option>
                        <option value="CEDULA EXTRANJERIA">CE</option>
                        <option value="PASAPORTE">PA</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Identificación <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientFormData.identificacion}
                      onChange={(e) => handleClientInputChange('identificacion', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Dv
                    </label>
                    <input
                      type="text"
                      value={clientFormData.dv}
                      onChange={(e) => handleClientInputChange('dv', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Régimen <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={clientFormData.regimen}
                        onChange={(e) => handleClientInputChange('regimen', e.target.value)}
                        className={`w-full pl-2 pr-6 py-1 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                        required
                      >
                        <option value="NO RESPONSABLE DE IVA NO DECLARANTE DE RENTA">No resp. IVA</option>
                        <option value="RESPONSABLE DE IVA">Resp. IVA</option>
                        <option value="GRAN CONTRIBUYENTE">Gran contrib.</option>
                        <option value="REGIMEN SIMPLIFICADO">Simplificado</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Segunda fila: Es Jurídica, Razón social, Nombre comercial */}
                <div className="grid grid-cols-8 gap-3 items-end">
                  <div className="col-span-1">
                    <div className="flex items-center h-7">
                      <input 
                        type="checkbox" 
                        id="es-juridica"
                        checked={clientFormData.esJuridica}
                        onChange={(e) => handleClientInputChange('esJuridica', e.target.checked)}
                        className="w-3 h-3 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-1"
                      />
                      <label 
                        htmlFor="es-juridica" 
                        className={`ml-1 text-xs font-medium ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}
                      >
                        Jurídica
                      </label>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Razón social <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientFormData.razonSocial}
                      onChange={(e) => handleClientInputChange('razonSocial', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                  <div className="col-span-4">
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Nombre comercial <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientFormData.nombreComercial}
                      onChange={(e) => handleClientInputChange('nombreComercial', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Tercera fila: Ciudad, Dirección */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Ciudad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={clientFormData.ciudad}
                        onChange={(e) => handleClientInputChange('ciudad', e.target.value)}
                        className={`w-full pl-2 pr-6 py-1 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                        required
                      >
                        <option value="">Seleccionar ciudad</option>
                        <option value="MONTERÍA/CÓRDOBA">MONTERÍA/CÓRDOBA</option>
                        <option value="CARTAGENA/BOLÍVAR">CARTAGENA/BOLÍVAR</option>
                        <option value="BARRANQUILLA/ATLÁNTICO">BARRANQUILLA/ATLÁNTICO</option>
                        <option value="SAN BERNARDO DEL VIENTO/CÓRDOBA">SAN BERNARDO DEL VIENTO/CÓRDOBA</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Dirección <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientFormData.direccion}
                      onChange={(e) => handleClientInputChange('direccion', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Cuarta fila: Teléfono, Nombre del contacto, Teléfono del contacto */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientFormData.telefono}
                      onChange={(e) => handleClientInputChange('telefono', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Nombre del contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientFormData.nombreContacto}
                      onChange={(e) => handleClientInputChange('nombreContacto', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Teléfono contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientFormData.telefonoContacto}
                      onChange={(e) => handleClientInputChange('telefonoContacto', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Quinta fila: Correo electrónico, Comentarios del cliente */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={clientFormData.correoElectronico}
                        onChange={(e) => handleClientInputChange('correoElectronico', e.target.value)}
                        className={`w-full pl-6 pr-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                            : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                        }`}
                        placeholder="Correo electrónico"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Comentarios del cliente
                    </label>
                    <textarea
                      value={clientFormData.comentariosCliente}
                      onChange={(e) => handleClientInputChange('comentariosCliente', e.target.value)}
                      rows={1}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      placeholder="Comentarios"
                    />
                  </div>
                </div>




                {/* Botón de acción */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-xs font-medium transition-colors min-w-[100px]"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Modelo */}
      {showNewModelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div className="fixed inset-0 transition-opacity bg-gray-500/75 backdrop-blur-sm" onClick={() => setShowNewModelModal(false)}></div>
            
            {/* Modal */}
            <div className={`relative inline-block w-full max-w-2xl px-8 py-4 overflow-hidden text-left align-middle transition-all transform rounded-xl shadow-xl ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-base font-semibold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Nuevo modelo
                </h3>
                <button
                  onClick={() => setShowNewModelModal(false)}
                  className={`text-gray-400 hover:text-gray-600 transition-colors ${
                    theme === 'light' ? 'hover:text-gray-600' : 'hover:text-gray-300'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveModel} className="space-y-1.5">
                {/* Primera fila: Modelo, Descripción */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Modelo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modelFormData.modelo}
                      onChange={(e) => handleModelInputChange('modelo', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modelFormData.descripcion}
                      onChange={(e) => handleModelInputChange('descripcion', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Segunda fila: Marca, Modelo padre */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Marca <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={modelFormData.marca}
                        onChange={(e) => handleModelInputChange('marca', e.target.value)}
                        className={`w-full pl-2 pr-6 py-1 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                        required
                      >
                        <option value="">Seleccionar marca</option>
                        <option value="Kärcher">Kärcher</option>
                        <option value="Bosch">Bosch</option>
                        <option value="Black & Decker">Black & Decker</option>
                        <option value="Stanley">Stanley</option>
                        <option value="Otro">Otro</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Modelo padre
                    </label>
                    <div className="relative">
                      <select
                        value={modelFormData.modeloPadre}
                        onChange={(e) => handleModelInputChange('modeloPadre', e.target.value)}
                        className={`w-full pl-2 pr-6 py-1 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                      >
                        <option value="">Seleccionar modelo padre</option>
                        <option value="K1">K1</option>
                        <option value="K3">K3</option>
                        <option value="K4">K4</option>
                        <option value="K5">K5</option>
                        <option value="Compacta">Compacta</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tercera fila: Valor de revisión, Estado */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Valor de revisión <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={modelFormData.valorRevision}
                      onChange={(e) => handleModelInputChange('valorRevision', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Estado <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={modelFormData.estado}
                        onChange={(e) => handleModelInputChange('estado', e.target.value)}
                        className={`w-full pl-2 pr-6 py-1 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                        required
                      >
                        <option value="Habilitado">Habilitado</option>
                        <option value="Deshabilitado">Deshabilitado</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cuarta fila: Costo, Repuesto */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Costo
                    </label>
                    <input
                      type="number"
                      value={modelFormData.costo}
                      onChange={(e) => handleModelInputChange('costo', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Repuesto
                    </label>
                    <div className="relative">
                      <select
                        value={modelFormData.repuesto}
                        onChange={(e) => handleModelInputChange('repuesto', e.target.value)}
                        className={`w-full pl-2 pr-6 py-1 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                      >
                        <option value="">Seleccionar repuesto</option>
                        <option value="Motor">Motor</option>
                        <option value="Bomba">Bomba</option>
                        <option value="Manguera">Manguera</option>
                        <option value="Filtro">Filtro</option>
                        <option value="Otro">Otro</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quinta fila: Tipo de modelo, Ficha técnica */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Tipo de modelo
                    </label>
                    <div className="relative">
                      <select
                        value={modelFormData.tipoModelo}
                        onChange={(e) => handleModelInputChange('tipoModelo', e.target.value)}
                        className={`w-full pl-2 pr-6 py-1 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                      >
                        <option value="">Seleccionar tipo</option>
                        <option value="Lavadora">Lavadora</option>
                        <option value="Aspiradora">Aspiradora</option>
                        <option value="Hidrolavadora">Hidrolavadora</option>
                        <option value="Pulidora">Pulidora</option>
                        <option value="Otro">Otro</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Ficha técnica
                    </label>
                    <input
                      type="text"
                      value={modelFormData.fichaTecnica}
                      onChange={(e) => handleModelInputChange('fichaTecnica', e.target.value)}
                      className={`w-full px-2 py-1 text-xs border rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                        theme === 'light' 
                          ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
                          : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      }`}
                      placeholder="URL o descripción"
                    />
                  </div>
                </div>

                {/* Sexta fila: Accesorios, Checkbox */}
                <div className="grid grid-cols-4 gap-3 items-end">
                  <div className="col-span-3">
                    <label className={`block text-xs font-medium mb-0.5 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Accesorios
                    </label>
                    <div className="relative">
                      <select
                        value={modelFormData.accesorios}
                        onChange={(e) => handleModelInputChange('accesorios', e.target.value)}
                        className={`w-full pl-2 pr-6 py-1 text-xs border rounded shadow-sm appearance-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                          theme === 'light' 
                            ? 'border-gray-300 bg-white text-gray-900' 
                            : 'border-gray-600 bg-gray-700 text-white'
                        }`}
                      >
                        <option value="">Seleccionar accesorios</option>
                        <option value="Kit completo">Kit completo</option>
                        <option value="Boquillas">Boquillas</option>
                        <option value="Mangueras">Mangueras</option>
                        <option value="Filtros">Filtros</option>
                        <option value="Sin accesorios">Sin accesorios</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center h-7">
                      <input 
                        type="checkbox" 
                        id="habilitado-crear-orden"
                        checked={modelFormData.habilitadoParaCrearOrden}
                        onChange={(e) => handleModelInputChange('habilitadoParaCrearOrden', e.target.checked)}
                        className="w-3 h-3 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-1"
                      />
                      <label 
                        htmlFor="habilitado-crear-orden" 
                        className={`ml-1 text-xs font-medium whitespace-nowrap ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}
                      >
                        Habilitado para crear orden
                      </label>
                    </div>
                  </div>
                </div>

                {/* Botón de acción */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-xs font-medium transition-colors min-w-[100px]"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
