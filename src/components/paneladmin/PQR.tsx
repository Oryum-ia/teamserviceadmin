'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '../ThemeProvider';
import { 
  Search, 
  X,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileText,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import { PQR, EstadoPQR, PrioridadPQR, TipoSolicitudPQR } from '../../types/encuestas-pqr.types';
import ResponsiveTable, { TableColumn, TableAction } from './ResponsiveTable';
import { useToast } from '@/contexts/ToastContext';

export default function PQRComponent() {
  const { theme } = useTheme();
  const toast = useToast();
  const [pqrs, setPqrs] = useState<PQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoPQR | ''>('');
  const [filtroPrioridad, setFiltroPrioridad] = useState<PrioridadPQR | ''>('');
  const [filtroTipo, setFiltroTipo] = useState<TipoSolicitudPQR | ''>('');
  const [selectedPQR, setSelectedPQR] = useState<PQR | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  useEffect(() => {
    cargarPQRs();
  }, []);

  const cargarPQRs = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('@/lib/supabaseClient');
      const { data, error } = await supabase
        .from('pqr')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      setPqrs(data || []);
    } catch (error) {
      console.error('Error cargando PQRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const pqrsFiltrados = pqrs.filter(pqr => {
    const matchSearch = 
      pqr.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pqr.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pqr.radicado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pqr.asunto.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchEstado = !filtroEstado || pqr.estado === filtroEstado;
    const matchPrioridad = !filtroPrioridad || pqr.prioridad === filtroPrioridad;
    const matchTipo = !filtroTipo || pqr.tipo_solicitud === filtroTipo;

    return matchSearch && matchEstado && matchPrioridad && matchTipo;
  });

  const actualizarEstado = async (id: number, nuevoEstado: EstadoPQR) => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { error } = await supabase
        .from('pqr')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;

      await cargarPQRs();
      if (selectedPQR?.id === id) {
        setSelectedPQR({ ...selectedPQR, estado: nuevoEstado });
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const actualizarPrioridad = async (id: number, nuevaPrioridad: PrioridadPQR) => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { error } = await supabase
        .from('pqr')
        .update({ prioridad: nuevaPrioridad })
        .eq('id', id);

      if (error) throw error;

      await cargarPQRs();
      if (selectedPQR?.id === id) {
        setSelectedPQR({ ...selectedPQR, prioridad: nuevaPrioridad });
      }
    } catch (error) {
      console.error('Error actualizando prioridad:', error);
    }
  };

  const enviarRespuesta = async () => {
    if (!selectedPQR || !respuestaTexto.trim()) return;

    try {
      setEnviandoRespuesta(true);
      
      const fechaRespuesta = new Date().toISOString();
      
      // Actualizar en la base de datos
      const { supabase } = await import('@/lib/supabaseClient');
      const { error: dbError } = await supabase
        .from('pqr')
        .update({
          respuesta: respuestaTexto,
          fecha_respuesta: fechaRespuesta,
          estado: 'resuelto'
        })
        .eq('id', selectedPQR.id);

      if (dbError) throw dbError;

      // Enviar correo al cliente
      try {
        const emailResponse = await fetch('/api/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tipo: 'respuesta_pqr',
            clienteEmail: selectedPQR.email,
            clienteNombre: selectedPQR.nombre_completo,
            pqrId: selectedPQR.radicado,
            tipoPQR: selectedPQR.tipo_solicitud,
            respuesta: respuestaTexto,
            fechaRespuesta: new Date(fechaRespuesta).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (emailResult.success) {
          toast.success('✅ Respuesta guardada y correo enviado exitosamente');
        } else {
          toast.warning('⚠️ Respuesta guardada, pero hubo un problema al enviar el correo');
        }
      } catch (emailError) {
        console.error('Error al enviar correo:', emailError);
        toast.warning('⚠️ Respuesta guardada, pero no se pudo enviar el correo');
      }
      
      setShowResponseModal(false);
      setRespuestaTexto('');
      await cargarPQRs();
      
      // Actualizar el PQR seleccionado
      setSelectedPQR({
        ...selectedPQR,
        respuesta: respuestaTexto,
        fecha_respuesta: fechaRespuesta,
        estado: 'resuelto'
      });
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      toast.error('❌ Error al enviar la respuesta');
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const getEstadoBadge = (estado: EstadoPQR) => {
    const estilos = {
      recibido: 'bg-blue-100 text-blue-800',
      en_proceso: 'bg-yellow-100 text-yellow-800',
      resuelto: 'bg-green-100 text-green-800',
      cerrado: 'bg-gray-100 text-gray-800'
    };
    return estilos[estado] || estilos.recibido;
  };

  const getPrioridadBadge = (prioridad: PrioridadPQR) => {
    const estilos = {
      baja: 'bg-gray-100 text-gray-800',
      media: 'bg-blue-100 text-blue-800',
      alta: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800'
    };
    return estilos[prioridad] || estilos.media;
  };

  const columns: TableColumn<PQR>[] = [
    {
      key: 'radicado',
      label: 'Radicado',
      render: (pqr) => (
        <span className={`font-mono text-sm ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          {pqr.radicado}
        </span>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (pqr) => (
        <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
          {pqr.tipo_solicitud}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'nombre',
      label: 'Nombre',
      render: (pqr) => (
        <div>
          <div className={`font-medium ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {pqr.nombre_completo}
          </div>
          <div className={`text-sm ${
            theme === 'light' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {pqr.email}
          </div>
        </div>
      ),
    },
    {
      key: 'asunto',
      label: 'Asunto',
      render: (pqr) => (
        <div className={`max-w-xs truncate ${
          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
        }`}>
          {pqr.asunto}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (pqr) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(pqr.estado)}`}>
          {pqr.estado.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      render: (pqr) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPrioridadBadge(pqr.prioridad)}`}>
          {pqr.prioridad}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (pqr) => (
        <span className={`text-sm ${
          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {new Date(pqr.fecha_creacion).toLocaleDateString('es-ES')}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  const handleRowClick = (pqr: PQR) => {
    setSelectedPQR(pqr);
    setShowModal(true);
  };

  const hasActiveFilters = () => {
    return searchTerm || filtroEstado || filtroPrioridad || filtroTipo;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFiltroEstado('');
    setFiltroPrioridad('');
    setFiltroTipo('');
  };

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Gestión de PQR
          </h1>
          <p className={`text-sm mt-1 ${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            {pqrsFiltrados.length} solicitud{pqrsFiltrados.length !== 1 ? 'es' : ''} encontrada{pqrsFiltrados.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              theme === 'light' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por radicado, nombre o email..."
              className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              }`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              showFilters
                ? theme === 'light'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-400 text-black'
                : theme === 'light'
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {hasActiveFilters() && (
              <span className="ml-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filtros colapsables */}
      {showFilters && (
        <div className={`p-4 rounded-lg mb-6 border ${
          theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Filtros de Búsqueda
            </h3>
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === 'light' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Buscar por radicado, nombre, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                theme === 'light'
                  ? 'bg-white border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-white'
              }`}
            />
          </div>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as TipoSolicitudPQR | '')}
            className={`px-4 py-2 rounded-lg border ${
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-900'
                : 'bg-gray-700 border-gray-600 text-white'
            }`}
          >
            <option value="">Todos los tipos</option>
            <option value="Petición">Petición</option>
            <option value="Queja">Queja</option>
            <option value="Reclamo">Reclamo</option>
            <option value="Sugerencia">Sugerencia</option>
            <option value="Felicitación">Felicitación</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoPQR | '')}
            className={`px-4 py-2 rounded-lg border ${
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-900'
                : 'bg-gray-700 border-gray-600 text-white'
            }`}
          >
            <option value="">Todos los estados</option>
            <option value="recibido">Recibido</option>
            <option value="en_proceso">En Proceso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </select>

          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value as PrioridadPQR | '')}
            className={`px-4 py-2 rounded-lg border ${
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-900'
                : 'bg-gray-700 border-gray-600 text-white'
            }`}
          >
            <option value="">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
      </div>
      )}

      {/* Tabla responsive */}
      <ResponsiveTable
        data={pqrsFiltrados}
        columns={columns}
        onRowClick={handleRowClick}
        isLoading={loading}
        emptyMessage="No se encontraron PQRs"
      />

      {/* Modal de detalle */}
      {showModal && selectedPQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg ${
            theme === 'light' ? 'bg-white' : 'bg-gray-800'
          }`}>
            <div className={`sticky top-0 flex justify-between items-center p-6 border-b ${
              theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'
            }`}>
              <div>
                <h2 className={`text-xl font-bold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  {selectedPQR.tipo_solicitud} - #{selectedPQR.radicado}
                </h2>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(selectedPQR.estado)}`}>
                    {selectedPQR.estado.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPrioridadBadge(selectedPQR.prioridad)}`}>
                    {selectedPQR.prioridad}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-lg ${
                  theme === 'light'
                    ? 'hover:bg-gray-100 text-gray-500'
                    : 'hover:bg-gray-700 text-gray-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información del solicitante */}
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Información del Solicitante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                      {selectedPQR.nombre_completo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                      {selectedPQR.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                      {selectedPQR.telefono}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                      {selectedPQR.ciudad}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                      {new Date(selectedPQR.fecha_creacion).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Asunto y mensaje */}
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Asunto
                </h3>
                <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  {selectedPQR.asunto}
                </p>
              </div>

              <div>
                <h3 className={`text-lg font-semibold mb-3 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Mensaje
                </h3>
                <div className={`p-4 rounded-lg ${
                  theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'
                }`}>
                  <p className={`whitespace-pre-wrap ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                    {selectedPQR.mensaje}
                  </p>
                </div>
              </div>

              {/* Respuesta si existe */}
              {selectedPQR.respuesta && (
                <div>
                  <h3 className={`text-lg font-semibold mb-3 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    Respuesta
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    theme === 'light' ? 'bg-green-50 border border-green-200' : 'bg-green-900/20 border border-green-700'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        Respondido el {selectedPQR.fecha_respuesta && new Date(selectedPQR.fecha_respuesta).toLocaleString('es-ES')}
                      </span>
                    </div>
                    <p className={`whitespace-pre-wrap ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                      {selectedPQR.respuesta}
                    </p>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedPQR.estado}
                  onChange={(e) => actualizarEstado(selectedPQR.id, e.target.value as EstadoPQR)}
                  className={`px-4 py-2 rounded-lg border ${
                    theme === 'light'
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-gray-700 border-gray-600 text-white'
                  }`}
                >
                  <option value="recibido">Recibido</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="resuelto">Resuelto</option>
                </select>

                <select
                  value={selectedPQR.prioridad}
                  onChange={(e) => actualizarPrioridad(selectedPQR.id, e.target.value as PrioridadPQR)}
                  className={`px-4 py-2 rounded-lg border ${
                    theme === 'light'
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-gray-700 border-gray-600 text-white'
                  }`}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>

                {!selectedPQR.respuesta && (
                  <button
                    onClick={() => setShowResponseModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Responder
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de respuesta */}
      {showResponseModal && selectedPQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className={`max-w-2xl w-full rounded-lg ${
            theme === 'light' ? 'bg-white' : 'bg-gray-800'
          }`}>
            <div className={`flex justify-between items-center p-6 border-b ${
              theme === 'light' ? 'border-gray-200' : 'border-gray-700'
            }`}>
              <h3 className={`text-lg font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Responder PQR - {selectedPQR.radicado}
              </h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className={`p-2 rounded-lg ${
                  theme === 'light'
                    ? 'hover:bg-gray-100 text-gray-500'
                    : 'hover:bg-gray-700 text-gray-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className={`text-sm mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  Para: {selectedPQR.email}
                </p>
                <p className={`text-sm mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  Asunto: Respuesta a tu {selectedPQR.tipo_solicitud} - Radicado: {selectedPQR.radicado}
                </p>
              </div>

              <textarea
                value={respuestaTexto}
                onChange={(e) => setRespuestaTexto(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={8}
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 text-gray-900'
                    : 'bg-gray-700 border-gray-600 text-white'
                }`}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className={`px-4 py-2 rounded-lg ${
                    theme === 'light'
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={enviarRespuesta}
                  disabled={enviandoRespuesta || !respuestaTexto.trim()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    enviandoRespuesta || !respuestaTexto.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {enviandoRespuesta ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Respuesta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
