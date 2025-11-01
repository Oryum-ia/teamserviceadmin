'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileText, Camera, Wrench, AlertTriangle } from 'lucide-react';

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

export default function FormularioDiagnostico() {
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
  const router = useRouter();

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

  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (session) {
      const parsedSession = JSON.parse(session);
      if (parsedSession.isAuthenticated && parsedSession.role === 'tecnico') {
        setUserSession(parsedSession);
      } else {
        router.push('/');
      }
    } else {
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
      // Simular envío del formulario
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí iría la lógica para enviar los datos al backend
      console.log('Diagnóstico enviado:', formData);
      
      // Mostrar mensaje de éxito y redirigir
      alert('Diagnóstico guardado exitosamente');
      router.push('/tecnico');
    } catch (error) {
      console.error('Error al guardar diagnóstico:', error);
      alert('Error al guardar el diagnóstico. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/tecnico')}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <img 
                src="/img/logo.jpg" 
                alt="TeamServiceCosta" 
                className="h-8 w-auto mr-3"
              />
              <h1 className="text-xl font-semibold text-gray-900">
                Formulario de Diagnóstico
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Técnico: <strong>{userSession.email}</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Cliente */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Información del Cliente</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clienteNombre}
                    onChange={(e) => handleInputChange('clienteNombre', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.clienteTelefono}
                    onChange={(e) => handleInputChange('clienteTelefono', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Número de teléfono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.clienteEmail}
                    onChange={(e) => handleInputChange('clienteEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Correo electrónico (opcional)"
                  />
                </div>
              </div>
            </div>

            {/* Información del Equipo */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Wrench className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Información del Equipo</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de equipo *
                  </label>
                  <select
                    required
                    value={formData.equipoTipo}
                    onChange={(e) => handleInputChange('equipoTipo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.equipoMarca}
                    onChange={(e) => handleInputChange('equipoMarca', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Marca del equipo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.equipoModelo}
                    onChange={(e) => handleInputChange('equipoModelo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Modelo del equipo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de serie
                  </label>
                  <input
                    type="text"
                    value={formData.equipoSerial}
                    onChange={(e) => handleInputChange('equipoSerial', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Serial del equipo (opcional)"
                  />
                </div>
              </div>
            </div>

            {/* Diagnóstico */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Diagnóstico Técnico</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del problema *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.problemaDescripcion}
                    onChange={(e) => handleInputChange('problemaDescripcion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describa detalladamente el problema reportado por el cliente..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado físico del equipo *
                    </label>
                    <select
                      required
                      value={formData.estadoFisico}
                      onChange={(e) => handleInputChange('estadoFisico', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="excelente">Excelente</option>
                      <option value="bueno">Bueno</option>
                      <option value="regular">Regular</option>
                      <option value="malo">Malo</option>
                      <option value="muy-malo">Muy malo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad de reparación *
                    </label>
                    <select
                      required
                      value={formData.prioridadReparacion}
                      onChange={(e) => handleInputChange('prioridadReparacion', e.target.value as 'baja' | 'media' | 'alta' | 'urgente')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                        <span className="ml-2 text-sm text-gray-700">{accesorio}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo estimado de reparación
                    </label>
                    <input
                      type="text"
                      value={formData.tiempoEstimado}
                      onChange={(e) => handleInputChange('tiempoEstimado', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 2-3 días hábiles"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Costo estimado
                    </label>
                    <input
                      type="text"
                      value={formData.costoEstimado}
                      onChange={(e) => handleInputChange('costoEstimado', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: $50.000 - $80.000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones técnicas
                  </label>
                  <textarea
                    rows={4}
                    value={formData.observacionesTecnico}
                    onChange={(e) => handleInputChange('observacionesTecnico', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Observaciones adicionales del técnico, recomendaciones, etc..."
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/tecnico')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancelar
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