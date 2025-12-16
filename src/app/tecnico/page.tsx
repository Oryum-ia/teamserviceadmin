'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, FileText, Wrench, Save, AlertTriangle, Download, CheckCircle, Clock } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ThemeInitializer } from '../../components/ThemeInitializer';
import { generateDiagnosticoWordDocument } from '../../utils/wordUtils';

interface UserSession {
  email: string;
  role: string;
  isAuthenticated: boolean;
  loginTime: string;
}

interface DiagnosticoForm {
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
}

export default function PanelTecnico() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [formData, setFormData] = useState<DiagnosticoForm>({
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    equipoTipo: '',
    equipoMarca: '',
    equipoModelo: '',
    equipoSerial: '',
    problemaDescripcion: '',
    estadoFisico: 'bueno',
    accesoriosIncluidos: [],
    observacionesTecnico: '',
    prioridadReparacion: 'media',
    tiempoEstimado: '',
    costoEstimado: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [, setDiagnosticos] = useState<DiagnosticoForm[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    completados: 0,
    pendientes: 0,
    hoy: 0
  });
  const router = useRouter();
  const { theme } = useTheme();

  const accesoriosList = [
    'Cargador',
    'Cable USB',
    'Auriculares',
    'Funda/Estuche',
    'Manual de usuario',
    'Caja original',
    'Tarjeta de memoria',
    'Batería adicional'
  ];

  // Función para cargar diagnósticos del localStorage
  const cargarDiagnosticos = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const diagnosticosGuardados = window.localStorage.getItem('diagnosticos-tecnico');
      if (diagnosticosGuardados) {
        const diagnosticos = JSON.parse(diagnosticosGuardados);
        setDiagnosticos(diagnosticos);
        
        // Calcular estadísticas
        const hoy = new Date().toDateString();
        const completados = diagnosticos.length;
        const hoyCount = diagnosticos.filter((d: { fechaCreacion?: string }) => 
          d.fechaCreacion && new Date(d.fechaCreacion).toDateString() === hoy
        ).length;
        
        setEstadisticas({
          completados,
          pendientes: Math.max(0, completados - hoyCount), // Simulación de pendientes
          hoy: hoyCount
        });
      }
    } catch (error) {
      console.error('Error al cargar diagnósticos:', error);
    }
  };

  // Función para guardar diagnóstico en localStorage
  const guardarDiagnostico = (diagnostico: DiagnosticoForm) => {
    if (typeof window === 'undefined') return null;
    
    try {
      const diagnosticosActuales = JSON.parse(
        window.localStorage.getItem('diagnosticos-tecnico') || '[]'
      );
      
      const nuevoDiagnostico = {
        ...diagnostico,
        id: Date.now().toString(),
        fechaCreacion: new Date().toISOString(),
        tecnicoEmail: userSession?.email || 'tecnico@ejemplo.com'
      };
      
      const diagnosticosActualizados = [...diagnosticosActuales, nuevoDiagnostico];
      window.localStorage.setItem('diagnosticos-tecnico', JSON.stringify(diagnosticosActualizados));
      
      // Actualizar estado
      setDiagnosticos(diagnosticosActualizados);
      cargarDiagnosticos(); // Recalcular estadísticas
      
      return nuevoDiagnostico;
    } catch (error) {
      console.error('Error al guardar diagnóstico:', error);
      return null;
    }
  };

  useEffect(() => {
    // SSR protection
    if (typeof window === 'undefined') return;
    
    try {
      const session = window.localStorage.getItem('userSession');
      if (session) {
        try {
          const parsedSession = JSON.parse(session);
          if (parsedSession.isAuthenticated && parsedSession.role === 'tecnico') {
            setUserSession(parsedSession);
            cargarDiagnosticos(); // Cargar diagnósticos al iniciar
          } else {
            router.push('/');
          }
        } catch (parseError) {
          console.error('Error parsing session:', parseError);
          window.localStorage.removeItem('userSession');
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      router.push('/');
    }
  }, [router]);

  const handleInputChange = (field: keyof DiagnosticoForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAccesorioToggle = (accesorio: string) => {
    setFormData(prev => ({
      ...prev,
      accesoriosIncluidos: prev.accesoriosIncluidos.includes(accesorio)
        ? prev.accesoriosIncluidos.filter(item => item !== accesorio)
        : [...prev.accesoriosIncluidos, accesorio]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Guardar diagnóstico localmente
      const diagnosticoGuardado = guardarDiagnostico(formData);
      
      if (diagnosticoGuardado) {
        console.log('Diagnóstico guardado:', diagnosticoGuardado);
        alert('Diagnóstico guardado exitosamente');
        
        // Limpiar formulario
        setFormData({
          clienteNombre: '',
          clienteTelefono: '',
          clienteEmail: '',
          equipoTipo: '',
          equipoMarca: '',
          equipoModelo: '',
          equipoSerial: '',
          problemaDescripcion: '',
          estadoFisico: 'bueno',
          accesoriosIncluidos: [],
          observacionesTecnico: '',
          prioridadReparacion: 'media',
          tiempoEstimado: '',
          costoEstimado: ''
        });
      } else {
        alert('Error al guardar el diagnóstico. Intente nuevamente.');
      }
    } catch (error) {
      console.error('Error al guardar diagnóstico:', error);
      alert('Error al guardar el diagnóstico. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para generar documento Word
  const handleGenerateWord = async () => {
    try {
      // Validar que haya datos mínimos
      if (!formData.clienteNombre || !formData.problemaDescripcion) {
        alert('Por favor complete al menos el nombre del cliente y la descripción del problema.');
        return;
      }

      setIsGeneratingWord(true);
      
      // Preparar datos para el documento Word
      const diagnosticoData = {
        ...formData,
        fechaDiagnostico: new Date().toLocaleDateString('es-CO'),
        tecnicoNombre: userSession?.email || 'Técnico',
        numeroDiagnostico: `DIAG-${Date.now()}`
      };

      await generateDiagnosticoWordDocument(diagnosticoData);
      
    } catch (error) {
      console.error('Error al generar documento Word:', error);
      alert('Error al generar el documento Word. Intente nuevamente.');
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('userSession');
    }
    router.push('/');
  };

  if (!userSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'
    }`}>
      <ThemeInitializer />
      {/* Header */}
      <header className={`shadow-sm border-b ${
        theme === 'light' 
          ? 'bg-white border-gray-200' 
          : 'bg-gray-800 border-gray-700'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/img/logo.jpg" 
                alt="TeamServiceCosta" 
                className="h-8 w-auto mr-3 rounded-lg object-contain"
              />
              <h1 className={`text-xl font-semibold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Panel de Técnico - Formulario de Diagnóstico
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}>
                Técnico: <strong>{userSession.email}</strong>
              </span>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Estadísticas dinámicas */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className={`overflow-hidden shadow rounded-lg ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}>
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className={`text-sm font-medium truncate ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        Diagnósticos Completados
                      </dt>
                      <dd className={`text-lg font-medium ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {estadisticas.completados}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className={`overflow-hidden shadow rounded-lg ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}>
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className={`text-sm font-medium truncate ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        Diagnósticos Hoy
                      </dt>
                      <dd className={`text-lg font-medium ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {estadisticas.hoy}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className={`overflow-hidden shadow rounded-lg ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}>
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className={`text-sm font-medium truncate ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        Pendientes/Anteriores
                      </dt>
                      <dd className={`text-lg font-medium ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {estadisticas.pendientes}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Cliente */}
            <div className={`shadow rounded-lg p-6 ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}>
              <div className="flex items-center mb-4">
                <FileText className={`h-5 w-5 mr-2 ${
                  theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                }`} />
                <h2 className={`text-lg font-medium ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Información del Cliente
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clienteNombre}
                    onChange={(e) => handleInputChange('clienteNombre', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.clienteTelefono}
                    onChange={(e) => handleInputChange('clienteTelefono', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="Número de teléfono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.clienteEmail}
                    onChange={(e) => handleInputChange('clienteEmail', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="Correo electrónico (opcional)"
                  />
                </div>
              </div>
            </div>

            {/* Información del Equipo */}
            <div className={`shadow rounded-lg p-6 ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}>
              <div className="flex items-center mb-4">
                <Wrench className={`h-5 w-5 mr-2 ${
                  theme === 'light' ? 'text-green-600' : 'text-green-400'
                }`} />
                <h2 className={`text-lg font-medium ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Información del Equipo
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Tipo de equipo *
                  </label>
                  <select
                    required
                    value={formData.equipoTipo}
                    onChange={(e) => handleInputChange('equipoTipo', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="smartphone">Smartphone</option>
                    <option value="tablet">Tablet</option>
                    <option value="laptop">Laptop</option>
                    <option value="desktop">PC de escritorio</option>
                    <option value="consola">Consola de videojuegos</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.equipoMarca}
                    onChange={(e) => handleInputChange('equipoMarca', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="Marca del equipo"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.equipoModelo}
                    onChange={(e) => handleInputChange('equipoModelo', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="Modelo del equipo"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Número de serie
                  </label>
                  <input
                    type="text"
                    value={formData.equipoSerial}
                    onChange={(e) => handleInputChange('equipoSerial', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="Serial del equipo (opcional)"
                  />
                </div>
              </div>
            </div>

            {/* Diagnóstico */}
            <div className={`shadow rounded-lg p-6 ${
              theme === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}>
              <div className="flex items-center mb-4">
                <AlertTriangle className={`h-5 w-5 mr-2 ${
                  theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'
                }`} />
                <h2 className={`text-lg font-medium ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Diagnóstico Técnico
                </h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Descripción del problema *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.problemaDescripcion}
                    onChange={(e) => handleInputChange('problemaDescripcion', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="Describa detalladamente el problema reportado por el cliente..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Estado físico del equipo *
                    </label>
                    <select
                      required
                      value={formData.estadoFisico}
                      onChange={(e) => handleInputChange('estadoFisico', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'light' 
                          ? 'bg-white border-gray-300 text-gray-900' 
                          : 'bg-gray-700 border-gray-600 text-white'
                      }`}
                    >
                      <option value="excelente">Excelente</option>
                      <option value="bueno">Bueno</option>
                      <option value="regular">Regular</option>
                      <option value="malo">Malo</option>
                      <option value="muy-malo">Muy malo</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Prioridad de reparación *
                    </label>
                    <select
                      required
                      value={formData.prioridadReparacion}
                      onChange={(e) => handleInputChange('prioridadReparacion', e.target.value as 'baja' | 'media' | 'alta' | 'urgente')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'light' 
                          ? 'bg-white border-gray-300 text-gray-900' 
                          : 'bg-gray-700 border-gray-600 text-white'
                      }`}
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-3 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Accesorios incluidos
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {accesoriosList.map((accesorio) => (
                      <label key={accesorio} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.accesoriosIncluidos.includes(accesorio)}
                          onChange={() => handleAccesorioToggle(accesorio)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className={`ml-2 text-sm ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          {accesorio}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Tiempo estimado de reparación
                    </label>
                    <input
                      type="text"
                      value={formData.tiempoEstimado}
                      onChange={(e) => handleInputChange('tiempoEstimado', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'light' 
                          ? 'bg-white border-gray-300 text-gray-900' 
                          : 'bg-gray-700 border-gray-600 text-white'
                      }`}
                      placeholder="Ej: 2-3 días hábiles"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      Costo estimado
                    </label>
                    <input
                      type="text"
                      value={formData.costoEstimado}
                      onChange={(e) => handleInputChange('costoEstimado', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'light' 
                          ? 'bg-white border-gray-300 text-gray-900' 
                          : 'bg-gray-700 border-gray-600 text-white'
                      }`}
                      placeholder="Ej: $50.000 - $80.000"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Observaciones técnicas
                  </label>
                  <textarea
                    rows={4}
                    value={formData.observacionesTecnico}
                    onChange={(e) => handleInputChange('observacionesTecnico', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === 'light' 
                        ? 'bg-white border-gray-300 text-gray-900' 
                        : 'bg-gray-700 border-gray-600 text-white'
                    }`}
                    placeholder="Observaciones adicionales del técnico, recomendaciones, etc..."
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleGenerateWord}
                disabled={isGeneratingWord || !formData.clienteNombre || !formData.problemaDescripcion}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGeneratingWord ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generar Word
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Diagnóstico
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}