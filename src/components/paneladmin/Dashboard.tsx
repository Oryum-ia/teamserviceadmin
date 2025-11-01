import React, { useState } from 'react';
import {
  DollarSign,
  Inbox,
  Search,
  Calculator,
  Settings,
  Gift,
  Clock,
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import Modal from './Modal';

// Type definitions
interface ModalItem {
  id?: string;
  cliente?: string;
  equipo?: string;
  fecha?: string;
  estado?: string;
  tecnico?: string;
  monto?: string;
  repuesto?: string;
  total?: string;
  fechaVencimiento?: string;
  dias?: string;
  mensaje?: string;
}

// Datos detallados para modales
const modalData = {
  recepcion: {
    items: [
      { id: '25-0126', cliente: 'María González', equipo: 'Aspiradora Kärcher K2', fecha: '18 sept. 2024', estado: 'En recepción' },
      { id: '25-0127', cliente: 'Carlos Rodríguez', equipo: 'Lavadora Industrial', fecha: '18 sept. 2024', estado: 'Documentos pendientes' },
    ]
  },
  diagnostico: {
    items: [
      { id: '25-0125', cliente: 'Jonathan Estrada', equipo: 'Lavadora Automática', fecha: '17 sept. 2024', estado: 'Esperando diagnóstico', tecnico: 'Juan Pérez' },
      { id: '25-0124', cliente: 'Ana Martínez', equipo: 'Aspiradora K3', fecha: '16 sept. 2024', estado: 'En diagnóstico', tecnico: 'Luis Vargas' },
    ]
  },
  cotizacion: {
    items: [
      { id: '25-0123', cliente: 'Pedro Jimeno', equipo: 'Kärcher K1 Max', fecha: '15 sept. 2024', estado: 'En aprobación del cliente', monto: '$150.000' },
      { id: '25-0122', cliente: 'Sofia Mendoza', equipo: 'Lavadora Compacta', fecha: '14 sept. 2024', estado: 'En aprobación del cliente', monto: '$220.000' },
    ]
  },
  reparacion: {
    items: [
      { id: '25-0121', cliente: 'Roberto Silva', equipo: 'Aspiradora Industrial', fecha: '13 sept. 2024', estado: 'Esperando repuestos', repuesto: 'Motor principal' },
      { id: '25-0120', cliente: 'Carmen López', equipo: 'Kärcher K3 Pro', fecha: '12 sept. 2024', estado: 'Esperando repuestos', repuesto: 'Manguera alta presión' },
      { id: '25-0119', cliente: 'Diego Morales', equipo: 'Lavadora Max', fecha: '11 sept. 2024', estado: 'Esperando repuestos', repuesto: 'Bomba de agua' },
      { id: '25-0118', cliente: 'Patricia Ruiz', equipo: 'Aspiradora K2', fecha: '10 sept. 2024', estado: 'Esperando repuestos', repuesto: 'Filtro HEPA' },
      { id: '25-0117', cliente: 'Miguel Torres', equipo: 'Kärcher K1', fecha: '09 sept. 2024', estado: 'Esperando repuestos', repuesto: 'Pistola de lavado' },
      { id: '25-0116', cliente: 'Laura Castro', equipo: 'Lavadora Compacta', fecha: '08 sept. 2024', estado: 'Esperando repuestos', repuesto: 'Panel de control' },
    ]
  },
  entrega: {
    items: [
      { id: '25-0115', cliente: 'Fernando Paz', equipo: 'Kärcher K3', fecha: '07 sept. 2024', estado: 'Reparado - Listo para entrega', total: '$180.000' },
      { id: '25-0114', cliente: 'Valeria Herrera', equipo: 'Aspiradora Max', fecha: '06 sept. 2024', estado: 'Reparado - Listo para entrega', total: '$95.000' },
      { id: '25-0113', cliente: 'Andrés Reyes', equipo: 'Lavadora Industrial', fecha: '05 sept. 2024', estado: 'Reparado - Listo para entrega', total: '$320.000' },
    ]
  },
  mantenimiento: {
    items: [
      { id: 'MANT-001', cliente: 'Empresa ABC S.A.S', equipo: 'Kärcher K5 Industrial', fechaVencimiento: '20 sept. 2024', estado: 'Vencido', dias: '2 días' },
      { id: 'MANT-002', cliente: 'Corporación XYZ', equipo: 'Sistema de Lavado', fechaVencimiento: '18 sept. 2024', estado: 'Vencido', dias: '4 días' },
      { id: 'MANT-003', cliente: 'Hotel Costa Dorada', equipo: 'Aspiradoras Centrales', fechaVencimiento: '15 sept. 2024', estado: 'Vencido', dias: '7 días' },
    ]
  },
  cobrar: {
    items: [
      { mensaje: 'No hay órdenes pendientes por cobrar en este momento.' },
    ]
  }
};

const dashboardData = [
  {
    title: 'Recepción',
    count: 0,
    icon: Inbox,
    key: 'recepcion',
    details: [
      { label: 'En recepción', value: 0, color: 'text-gray-600' }
    ]
  },
  {
    title: 'Diagnóstico',
    count: 1,
    icon: Search,
    key: 'diagnostico',
    details: [
      { label: 'Esperando diagnóstico', value: 0, color: 'text-blue-600' },
      { label: 'En diagnóstico', value: 1, color: 'text-orange-600' }
    ]
  },
  {
    title: 'Cotización',
    count: 2,
    icon: Calculator,
    key: 'cotizacion',
    details: [
      { label: 'Esperando cotización', value: 0, color: 'text-yellow-600' },
      { label: 'En aprobación de la marca', value: 0, color: 'text-purple-600' },
      { label: 'En aprobación del cliente', value: 2, color: 'text-green-600' },
      { label: 'Aprobados', value: 0, color: 'text-blue-600' }
    ]
  },
  {
    title: 'Reparación',
    count: 6,
    icon: Settings,
    key: 'reparacion',
    details: [
      { label: 'Esperando repuestos', value: 6, color: 'text-red-600' },
      { label: 'Esperando reparación', value: 0, color: 'text-yellow-600' },
      { label: 'En reparación', value: 0, color: 'text-orange-600' }
    ]
  },
  {
    title: 'Entrega',
    count: 2,
    icon: Gift,
    key: 'entrega',
    details: [
      { label: 'Reparados', value: 2, color: 'text-green-600' },
      { label: 'No reparados', value: 0, color: 'text-gray-600' }
    ]
  },
  {
    title: 'Próximo mantenimiento',
    count: 44,
    icon: Clock,
    key: 'mantenimiento',
    details: [
      { label: 'Vencidos', value: 44, color: 'text-red-600' },
      { label: 'Próximos', value: 0, color: 'text-yellow-600' }
    ]
  }
];

interface DashboardProps {
  onSectionChange?: (section: string) => void;
}

export default function Dashboard({ onSectionChange }: DashboardProps = {}) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const { theme } = useTheme();

  const openModal = (key: string) => {
    setActiveModal(key);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const renderModalContent = (key: string) => {
    const data = modalData[key as keyof typeof modalData];
    if (!data) return null;

    switch (key) {
      case 'recepcion':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>Lista de equipos en proceso de recepción:</p>
            {data.items.map((item: ModalItem, index: number) => (
              <div key={index} className={`border rounded-lg p-4 ${
                theme === 'light' ? 'border-gray-200' : 'border-gray-600'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>{item.id}</p>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>{item.cliente}</p>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>{item.equipo}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                    }`}>{item.fecha}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      theme === 'light' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-yellow-900 text-yellow-200'
                    }`}>
                      {item.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'diagnostico':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>Equipos en proceso de diagnóstico:</p>
            {data.items.map((item: ModalItem, index: number) => (
              <div key={index} className={`border rounded-lg p-4 ${
                theme === 'light' ? 'border-gray-200' : 'border-gray-600'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>{item.id}</p>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>{item.cliente}</p>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>{item.equipo}</p>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                    }`}>Técnico: {item.tecnico}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                    }`}>{item.fecha}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.estado?.includes('Esperando') 
                        ? (theme === 'light' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-yellow-900 text-yellow-200')
                        : (theme === 'light' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-blue-900 text-blue-200')
                    }`}>
                      {item.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'cotizacion':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Cotizaciones pendientes de aprobación:</p>
            {data.items.map((item: ModalItem, index: number) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.id}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.cliente}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.equipo}</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Monto: {item.monto}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{item.fecha}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      {item.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'reparacion':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Equipos esperando repuestos:</p>
            {data.items.map((item: ModalItem, index: number) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.id}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.cliente}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.equipo}</p>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Repuesto: {item.repuesto}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{item.fecha}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {item.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'entrega':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Equipos listos para entrega:</p>
            {data.items.map((item: ModalItem, index: number) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.id}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.cliente}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.equipo}</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Total: {item.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{item.fecha}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Listo
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'mantenimiento':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Mantenimientos vencidos:</p>
            {data.items.map((item: ModalItem, index: number) => (
              <div key={index} className="border border-red-200 dark:border-red-600 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.id}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.cliente}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.equipo}</p>
                    <p className="text-sm text-red-600 dark:text-red-400">Vencimiento: {item.fechaVencimiento}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">{item.dias}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {item.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'cobrar':
        return (
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              No tienes órdenes por cobrar en este momento.
            </p>
          </div>
        );
      
      default:
        return <p>Información no disponible</p>;
    }
  };

  return (
    <div className={`h-full flex flex-col p-4 ${
      theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'
    }`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className={`text-2xl font-bold ${
          theme === 'light' ? 'text-gray-800' : 'text-white'
        }`}>
          ¡Hola, TS COSTA SAS!
        </h1>
      </div>

      {/* Grid principal de tarjetas - 2 filas x 3 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 max-w-5xl mx-auto">
        {dashboardData.slice(0, 6).map((item, index) => (
          <div key={index} className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-300 cursor-pointer group relative ${
            theme === 'light' 
              ? 'bg-white border-gray-200' 
              : 'bg-gray-800 border-gray-700'
          }`}
               onClick={() => openModal(item.key)}>
            {/* Número principal e ícono */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full ${
                  theme === 'light' ? 'bg-amber-100' : 'bg-amber-900/30'
                }`}>
                  <item.icon className={`h-6 w-6 ${
                    theme === 'light' ? 'text-amber-600' : 'text-amber-400'
                  }`} />
                </div>
                <div className={`text-3xl font-bold ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}>
                  {item.count}
                </div>
              </div>
            </div>
            
            {/* Título */}
            <h3 className={`text-lg font-semibold mb-3 ${
              theme === 'light' ? 'text-gray-800' : 'text-white'
            }`}>
              {item.title}
            </h3>
            
            {/* Detalles - máximo 4 */}
            <div className="space-y-1">
              {item.details.slice(0, 4).map((detail, detailIndex) => (
                <div key={detailIndex} className="flex justify-between items-center text-sm">
                  <span className={`font-medium ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>{detail.value}</span>
                  <span className={`${
                    theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                  }`}>{detail.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sección Por cobrar con botones */}
      <div className="flex flex-col lg:flex-row gap-4 max-w-5xl mx-auto">
        {/* Tarjeta Por cobrar */}
        <div className={`rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-all duration-300 flex-1 ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-800 border-gray-700'
        }`}
             onClick={() => openModal('cobrar')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${
                theme === 'light' ? 'bg-amber-100' : 'bg-amber-900/30'
              }`}>
                <DollarSign className={`h-6 w-6 ${
                  theme === 'light' ? 'text-amber-600' : 'text-amber-400'
                }`} />
              </div>
              <div>
                <div className={`text-3xl font-bold ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}>0</div>
                <h3 className={`text-lg font-semibold mb-1 ${
                  theme === 'light' ? 'text-gray-800' : 'text-white'
                }`}>
                  Por cobrar
                </h3>
                <p className={`text-sm ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Tienes 0 órdenes por cobrar a tus marcas
                </p>
              </div>
            </div>
            
            {/* Botón integrado en la tarjeta */}
            <div className="flex-shrink-0">
              <button 
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onSectionChange?.('legalizacion');
                }}
              >
                Crear legalización
              </button>
            </div>
          </div>
        </div>

        {/* Botones de acción principales */}
        <div className="flex flex-col gap-3 lg:w-72">
          <button 
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 shadow-sm"
            onClick={() => {
              onSectionChange?.('ordenes');
            }}
          >
            Crear orden
          </button>
          <button 
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 shadow-sm"
            onClick={() => {
              onSectionChange?.('informes');
            }}
          >
            Ver indicadores
          </button>
        </div>
      </div>

      {/* Modal */}
      {activeModal && (
        <Modal
          title={`Detalles - ${dashboardData.find(item => item.key === activeModal)?.title}`}
          isOpen={!!activeModal}
          onClose={closeModal}
        >
          {renderModalContent(activeModal)}
        </Modal>
      )}
    </div>
  );
}
