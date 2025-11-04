"use client";

import React, { useEffect, useState } from 'react';
import { notificarCambioFaseWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';
import { notificarCambioFase } from '@/lib/services/emailNotificationService';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  Stethoscope,
  Calculator,
  Wrench,
  Package,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MessageSquare,
  StickyNote
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { obtenerOrdenPorId } from '@/lib/services/ordenService';
import { retrocederFaseConComentario } from '@/lib/services/comentarioService';
import RecepcionForm from '@/components/paneladmin/ordenes/RecepcionForm';
import DiagnosticoForm from '@/components/paneladmin/ordenes/DiagnosticoForm';
import CotizacionForm from '@/components/paneladmin/ordenes/CotizacionForm';
import ReparacionForm from '@/components/paneladmin/ordenes/ReparacionForm';
import EntregaForm from '@/components/paneladmin/ordenes/EntregaForm';
import NotaModal from '@/components/paneladmin/ordenes/NotaModal';
import {
  saveOrdenToLocalStorage,
  getOrdenFromLocalStorage,
  updateOrdenFields,
  isOrdenInLocalStorage
} from '@/lib/ordenLocalStorage';

const FASES = [
  { id: 'recepcion', label: 'Recepción', icon: FileText, step: 0 },
  { id: 'diagnostico', label: 'Diagnóstico', icon: Stethoscope, step: 1 },
  { id: 'cotizacion', label: 'Cotización', icon: Calculator, step: 2 },
  { id: 'reparacion', label: 'Reparación', icon: Wrench, step: 3 },
  { id: 'entrega', label: 'Entrega', icon: Package, step: 4 },
];

export default function OrdenDetallePage() {
  const { theme } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const ordenId = params?.id as string;

  const [orden, setOrden] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [showRetrocederModal, setShowRetrocederModal] = useState(false);
  const [comentarioRetroceso, setComentarioRetroceso] = useState('');
  const [isRetrocediendo, setIsRetrocediendo] = useState(false);
  const [isAvanzando, setIsAvanzando] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [notaOrden, setNotaOrden] = useState('');

  // Obtener ID del técnico actual
  const obtenerTecnicoActual = async () => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: authData } = await supabase.auth.getUser();
      return authData?.user?.id || null;
    } catch (error) {
      console.error('Error al obtener técnico actual:', error);
      return null;
    }
  };

  useEffect(() => {
    let channel: any = null;
    
    const inicializar = async () => {
      if (ordenId) {
        await cargarOrden();
        channel = await configurarRealtime();
      }
    };
    
    inicializar();
    
    return () => {
      // Limpiar suscripción al desmontar
      if (channel) {
        console.log('🧹 Limpiando canal de realtime');
        channel.unsubscribe();
      }
    };
  }, [ordenId]);

  // Mapear estado_actual a fase
  const mapEstadoAFase = (estadoActual: string): string => {
    const estadoMap: Record<string, string> = {
      'Recepción': 'recepcion',
      'Diagnóstico': 'diagnostico',
      'Cotización': 'cotizacion',
      'Esperando repuestos': 'cotizacion', // Mismo fase que cotización, solo estado diferente
      'Esperando aceptación': 'cotizacion', // Estado de la fase de cotización
      'Reparación': 'reparacion',
      'Entrega': 'entrega',
      'Finalizada': 'entrega'
    };
    return estadoMap[estadoActual] || 'recepcion';
  };

  // Actualizar step cuando cambia la fase de la orden
  useEffect(() => {
    if (orden) {
      const faseId = mapEstadoAFase(orden.estado_actual);
      const faseActual = FASES.find(f => f.id === faseId);
      if (faseActual && faseActual.step !== currentStep) {
        setCurrentStep(faseActual.step);
      }
      // Actualizar nota de la orden
      setNotaOrden(orden.nota_orden || '');
    }
  }, [orden?.estado_actual, orden?.nota_orden]);

  const cargarOrden = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Intentar cargar desde localStorage primero
      const ordenLocal = getOrdenFromLocalStorage();
      
      if (ordenLocal && ordenLocal.id === parseInt(ordenId)) {
        console.log('📦 Cargando orden desde localStorage');
        setOrden(ordenLocal);
        
        // Determinar step actual
        const faseId = mapEstadoAFase(ordenLocal.estado_actual);
        const faseActual = FASES.find(f => f.id === faseId);
        if (faseActual) {
          setCurrentStep(faseActual.step);
        }
        
        setIsLoading(false);
        
        // Cargar desde Supabase en segundo plano para validar
        const dataRemota = await obtenerOrdenPorId(ordenId);
        
        // Si hay diferencias, actualizar
        if (dataRemota.ultima_actualizacion !== ordenLocal.ultima_actualizacion) {
          console.log('🔄 Actualizando desde Supabase (datos más recientes)');
          setOrden(dataRemota);
          saveOrdenToLocalStorage(dataRemota);
        }
      } else {
        // No existe en localStorage, cargar desde Supabase
        console.log('🌐 Cargando orden desde Supabase');
        const data = await obtenerOrdenPorId(ordenId);
        setOrden(data);
        saveOrdenToLocalStorage(data);
        
        // Determinar step actual
        const faseId = mapEstadoAFase(data.estado_actual);
        const faseActual = FASES.find(f => f.id === faseId);
        if (faseActual) {
          setCurrentStep(faseActual.step);
        }
      }
    } catch (err) {
      console.error('Error al cargar orden:', err);
      setError('Error al cargar la orden');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Configurar suscripción realtime de Supabase
  const configurarRealtime = async () => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      console.log('🔌 Configurando realtime para orden ID:', ordenId);
      
      const channel = supabase
        .channel(`orden-${ordenId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Escuchar todos los eventos (UPDATE, INSERT, DELETE)
            schema: 'public',
            table: 'ordenes',
            filter: `id=eq.${ordenId}`
          },
          async (payload) => {
            console.log('🔔 Evento recibido en realtime:', {
              evento: payload.eventType,
              id: payload.new?.id,
              terminos_aceptados: payload.new?.terminos_aceptados,
              firma_cliente: payload.new?.firma_cliente ? 'Sí tiene' : 'No tiene',
              fecha_aceptacion: payload.new?.fecha_aceptacion_terminos,
              fecha_firma: payload.new?.fecha_firma_cliente
            });
            
            // Recargar la orden completa con todas las relaciones
            try {
              const ordenCompleta = await obtenerOrdenPorId(ordenId);
              console.log('✅ Orden completa recargada:', {
                id: ordenCompleta.id,
                terminos_aceptados: ordenCompleta.terminos_aceptados,
                firma_cliente: ordenCompleta.firma_cliente ? 'Sí tiene' : 'No tiene',
                fecha_aceptacion: ordenCompleta.fecha_aceptacion_terminos,
                fecha_firma: ordenCompleta.fecha_firma_cliente
              });
              setOrden(ordenCompleta);
              saveOrdenToLocalStorage(ordenCompleta);
            } catch (error) {
              console.error('❌ Error recargando orden:', error);
              // Fallback: usar solo los datos del payload
              if (payload.new) {
                const nuevaOrden = payload.new as any;
                setOrden(nuevaOrden);
                saveOrdenToLocalStorage(nuevaOrden);
              }
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime SUSCRITO exitosamente para orden', ordenId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Error en canal de realtime:', err);
          } else if (status === 'TIMED_OUT') {
            console.error('⏱️ Timeout en suscripción de realtime');
          } else {
            console.log('🔔 Estado de realtime:', status);
          }
        });
      
      console.log('📡 Canal de realtime creado');
      return channel;
    } catch (error) {
      console.error('❌ Error configurando realtime:', error);
      return null;
    }
  };

  const handleStepChange = (step: number) => {
    // Solo permitir cambiar a fases completadas o la actual
    const faseId = mapEstadoAFase(orden?.estado_actual);
    const currentPhaseStep = FASES.find(f => f.id === faseId)?.step || 0;
    if (step <= currentPhaseStep) {
      setCurrentStep(step);
    }
  };

  const handleRetroceder = async () => {
    if (!comentarioRetroceso.trim()) {
      toast.error('Debe ingresar un motivo para retroceder la fase');
      return;
    }

    const faseId = mapEstadoAFase(orden?.estado_actual);
    const currentPhaseStep = FASES.find(f => f.id === faseId)?.step || 0;
    if (currentPhaseStep === 0) {
      toast.error('No se puede retroceder desde la fase de recepción');
      return;
    }

    setIsRetrocediendo(true);
    try {
      const faseAnterior = FASES[currentPhaseStep - 1];
      const estadoActual = orden.estado_actual;
      const estadoNuevo = faseAnterior.label;
      const now = new Date().toISOString();

      // Preparar campos a limpiar según la fase actual y la fase a la que retrocede
      const camposALimpiar: any = {};
      const faseActual = FASES[currentPhaseStep].id;
      
      // Limpiar campos de la fase actual (de donde sale) - incluyendo fecha_inicio
      if (faseActual === 'diagnostico') {
        camposALimpiar.fecha_inicio_diagnostico = null;
        camposALimpiar.fecha_fin_diagnostico = null;
        camposALimpiar.tecnico_diagnostico = null;
      } else if (faseActual === 'cotizacion') {
        camposALimpiar.fecha_cotizacion = null; // fecha_inicio de cotización
        camposALimpiar.fecha_aprobacion = null;
        camposALimpiar.tecnico_cotiza = null;
        camposALimpiar.fecha_solicitud_repuestos = null;
        camposALimpiar.fecha_recepcion_repuestos = null;
      } else if (faseActual === 'reparacion') {
        camposALimpiar.fecha_inicio_reparacion = null;
        camposALimpiar.fecha_fin_reparacion = null;
        // NO limpiar tecnico_repara al retroceder de reparación
        // NO limpiar fecha_solicitud_repuestos ni fecha_recepcion_repuestos
      } else if (faseActual === 'entrega') {
        camposALimpiar.fecha_entrega = null; // fecha de entrega (es fecha_inicio y fecha_fin)
        camposALimpiar.tecnico_entrega = null;
      }
      
      // Limpiar fecha_fin y tecnico de la fase a la que retrocede (vuelve a estar activa)
      const faseDestino = faseAnterior.id;
      if (faseDestino === 'recepcion') {
        camposALimpiar.fecha_fin_recepcion = null;
        camposALimpiar.tecnico_recepcion = null;
      } else if (faseDestino === 'diagnostico') {
        camposALimpiar.fecha_fin_diagnostico = null;
        camposALimpiar.tecnico_diagnostico = null;
      } else if (faseDestino === 'cotizacion') {
        camposALimpiar.fecha_aprobacion = null;
        camposALimpiar.tecnico_cotiza = null;
        // NO limpiar fecha_solicitud_repuestos ni fecha_recepcion_repuestos
        // NO limpiar tecnico_repara (si retrocedemos de reparación)
      } else if (faseDestino === 'reparacion') {
        camposALimpiar.fecha_fin_reparacion = null;
        // NO limpiar tecnico_repara al volver a reparación
      }

      await retrocederFaseConComentario(
        ordenId,
        estadoActual,
        estadoNuevo,
        comentarioRetroceso
      );

      // Actualizar en base de datos los campos limpiados
      const { supabase } = await import('@/lib/supabaseClient');
      await supabase
        .from('ordenes')
        .update({
          ...camposALimpiar,
          estado_actual: estadoNuevo,
          ultima_actualizacion: now
        })
        .eq('id', ordenId);

      // Actualizar estado local y localStorage
      const ordenActualizada = {
        ...orden,
        ...camposALimpiar,
        estado_actual: estadoNuevo,
        ultima_actualizacion: now
      };
      setOrden(ordenActualizada);
      saveOrdenToLocalStorage(ordenActualizada);

      toast.success(`Fase retrocedida a ${faseAnterior.label}`);
      setShowRetrocederModal(false);
      setComentarioRetroceso('');
      
      // Enviar notificaciones por email y WhatsApp
      try {
        // Email automático
        await notificarCambioFase(ordenId, faseAnterior.label);
      } catch (emailError) {
        console.error('⚠️ Error al enviar correo:', emailError);
      }
      
      try {
        // WhatsApp manual (abre ventana)
        await notificarCambioFaseWhatsApp(ordenId, faseAnterior.label);
      } catch (whatsappError) {
        console.error('⚠️ Error al abrir WhatsApp:', whatsappError);
      }
    } catch (error) {
      console.error('Error al retroceder fase:', error);
      toast.error('Error al retroceder la fase');
    } finally {
      setIsRetrocediendo(false);
    }
  };

  const puedeRetroceder = () => {
    const faseId = mapEstadoAFase(orden?.estado_actual);
    const currentPhaseStep = FASES.find(f => f.id === faseId)?.step || 0;
    return currentPhaseStep > 0; // Puede retroceder si no está en recepción
  };

  const puedeAvanzar = () => {
    // Bloquear avance si está esperando repuestos
    if (orden?.estado_actual === 'Esperando repuestos') {
      return false;
    }
    // Si está esperando aceptación, solo permitir avanzar si el cliente aprobó
    if (orden?.estado_actual === 'Esperando aceptación') {
      return orden?.aprobado_cliente === true;
    }
    
    const faseId = mapEstadoAFase(orden?.estado_actual);
    const currentPhaseStep = FASES.find(f => f.id === faseId)?.step || 0;
    
    // Validación especial para fase de recepción
    if (faseId === 'recepcion') {
      // Solo permitir avanzar si tiene términos aceptados y firma del cliente
      return orden?.terminos_aceptados && orden?.firma_cliente;
    }
    
    return currentPhaseStep < FASES.length - 1; // Puede avanzar si no está en la última fase
  };

  const handleAvanzarFase = async () => {
    // Bloqueo explícito si está esperando repuestos
    if (orden?.estado_actual === 'Esperando repuestos') {
      toast.error('No puede avanzar de fase mientras está esperando repuestos');
      return;
    }
    
    // Si está esperando aceptación, validar que el cliente haya aprobado
    if (orden?.estado_actual === 'Esperando aceptación' && !orden?.aprobado_cliente) {
      toast.error('No puede avanzar hasta que el cliente apruebe la cotización');
      return;
    }

    const faseId = mapEstadoAFase(orden?.estado_actual);
    const currentPhaseStep = FASES.find(f => f.id === faseId)?.step || 0;
    
    // Validación especial para fase de recepción: debe tener términos aceptados y firma
    if (faseId === 'recepcion') {
      if (!orden?.terminos_aceptados) {
        toast.error('Debe aceptar los términos y condiciones antes de avanzar');
        return;
      }
      if (!orden?.firma_cliente) {
        toast.error('Debe tener la firma del cliente antes de avanzar');
        return;
      }
    }
    
    if (currentPhaseStep >= FASES.length - 1) {
      toast.error('Ya está en la última fase');
      return;
    }

    setIsAvanzando(true);
    try {
      const siguienteFase = FASES[currentPhaseStep + 1];
      const faseActual = FASES[currentPhaseStep].id;
      const now = new Date().toISOString();
      const tecnicoId = await obtenerTecnicoActual();
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Preparar campos según fase actual y siguiente
      const camposActualizacion: any = {
        estado_actual: siguienteFase.label,
        ultima_actualizacion: now
      };

      // Cerrar fase actual
      if (faseActual === 'recepcion') {
        camposActualizacion.fecha_fin_recepcion = now;
        camposActualizacion.tecnico_recepcion = tecnicoId;
        camposActualizacion.fecha_inicio_diagnostico = now;
      } else if (faseActual === 'diagnostico') {
        camposActualizacion.fecha_fin_diagnostico = now;
        camposActualizacion.tecnico_diagnostico = tecnicoId;
        // fecha_cotizacion se usa para inicio de cotización
        if (!orden.fecha_cotizacion) {
          camposActualizacion.fecha_cotizacion = now;
        }
      } else if (faseActual === 'cotizacion') {
        // Al avanzar desde cotización, guardar todos los datos primero
        if (typeof window !== 'undefined' && (window as any).guardarDatosCotizacion) {
          const datosCotizacion = await (window as any).guardarDatosCotizacion();
          // Aplicar los datos de cotización a camposActualizacion
          if (datosCotizacion) {
            Object.assign(camposActualizacion, datosCotizacion);
          }
        }
        
        camposActualizacion.fecha_aprobacion = now;
        camposActualizacion.tecnico_cotiza = tecnicoId;
        camposActualizacion.fecha_inicio_reparacion = now;
      } else if (faseActual === 'reparacion') {
        camposActualizacion.fecha_fin_reparacion = now;
        camposActualizacion.tecnico_repara = tecnicoId;
        // La fecha de entrega se establecerá al finalizar la orden
      }
      
      await supabase
        .from('ordenes')
        .update(camposActualizacion)
        .eq('id', ordenId);
      
      // Actualizar estado local y localStorage
      const ordenActualizada = {
        ...orden,
        ...camposActualizacion
      };
      setOrden(ordenActualizada);
      saveOrdenToLocalStorage(ordenActualizada);
      
      toast.success(`Avanzado a fase de ${siguienteFase.label}`);
      
      // Enviar notificaciones por email y WhatsApp
      try {
        // Email automático
        await notificarCambioFase(ordenId, siguienteFase.label);
      } catch (emailError) {
        console.error('⚠️ Error al enviar correo:', emailError);
      }
      
      try {
        // WhatsApp manual (abre ventana)
        await notificarCambioFaseWhatsApp(ordenId, siguienteFase.label);
      } catch (whatsappError) {
        console.error('⚠️ Error al abrir WhatsApp:', whatsappError);
      }
    } catch (error) {
      console.error('Error al avanzar fase:', error);
      toast.error('Error al avanzar la fase');
    } finally {
      setIsAvanzando(false);
    }
  };

  const handleFinalizarOrden = async () => {
    setIsAvanzando(true);
    try {
      const now = new Date().toISOString();
      const tecnicoId = await obtenerTecnicoActual();
      const { supabase } = await import('@/lib/supabaseClient');

      const camposActualizacion: any = {
        estado_actual: 'Finalizada',
        fecha_entrega: now,
        tecnico_entrega: tecnicoId,
        ultima_actualizacion: now
      };

      await supabase
        .from('ordenes')
        .update(camposActualizacion)
        .eq('id', ordenId);

      const ordenActualizada = {
        ...orden,
        ...camposActualizacion
      };
      setOrden(ordenActualizada);
      saveOrdenToLocalStorage(ordenActualizada);

      toast.success('Orden finalizada');
      
      // Enviar notificaciones por email y WhatsApp
      try {
        // Email automático
        await notificarCambioFase(ordenId, 'Finalizada');
      } catch (emailError) {
        console.error('⚠️ Error al enviar correo:', emailError);
      }
      
      try {
        // WhatsApp manual (abre ventana)
        await notificarCambioFaseWhatsApp(ordenId, 'Finalizada');
      } catch (whatsappError) {
        console.error('⚠️ Error al abrir WhatsApp:', whatsappError);
      }
    } catch (error) {
      console.error('Error al finalizar orden:', error);
      toast.error('Error al finalizar la orden');
    } finally {
      setIsAvanzando(false);
    }
  };

  const renderCurrentForm = () => {
    if (!orden) return null;

    // Los componentes usan useEffect para sincronizarse con los cambios de orden
    switch (FASES[currentStep].id) {
      case 'recepcion':
        return <RecepcionForm orden={orden} onSuccess={cargarOrden} />;
      case 'diagnostico':
        return <DiagnosticoForm orden={orden} onSuccess={cargarOrden} />;
      case 'cotizacion':
        return <CotizacionForm orden={orden} onSuccess={cargarOrden} />;
      case 'reparacion':
        return <ReparacionForm orden={orden} onSuccess={cargarOrden} />;
      case 'entrega':
        return <EntregaForm orden={orden} onSuccess={cargarOrden} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error || 'Orden no encontrada'}
        </div>
        <button
          onClick={() => router.push('/paneladmin')}
          className="mt-4 text-yellow-600 hover:text-yellow-700"
        >
          Volver al panel
        </button>
      </div>
    );
  }

  const faseId = mapEstadoAFase(orden.estado_actual);
  const currentPhaseStep = FASES.find(f => f.id === faseId)?.step || 0;

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${theme === 'light' ? 'bg-white border-b border-gray-200' : 'bg-gray-800 border-b border-gray-700'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          {/* Layout móvil y desktop */}
          <div className="flex flex-col gap-3 sm:gap-0">
            {/* Primera fila: Botón volver + Título + Nota */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <button
                  onClick={() => router.push('/paneladmin?section=ordenes')}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    theme === 'light'
                      ? 'hover:bg-gray-100 text-gray-600'
                      : 'hover:bg-gray-700 text-gray-400'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className={`text-lg sm:text-2xl font-bold truncate ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      Orden {orden.codigo}
                    </h1>
                    {/* Botón de nota con indicador */}
                    <button
                      onClick={() => setShowNotaModal(true)}
                      className={`relative p-2 rounded-lg transition-colors flex-shrink-0 ${
                        theme === 'light'
                          ? 'hover:bg-gray-100 text-gray-600'
                          : 'hover:bg-gray-700 text-gray-400'
                      }`}
                      title={notaOrden ? 'Ver nota' : 'Agregar nota'}
                    >
                      <StickyNote className="w-4 h-4 sm:w-5 sm:h-5" />
                      {notaOrden && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Segunda fila: Info del cliente, producto y estado en una línea */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:ml-14 text-xs sm:text-sm">
              <p className={`truncate max-w-[200px] sm:max-w-none ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                <span className="font-medium">Cliente:</span> {orden.cliente?.nombre_comercial || orden.cliente?.razon_social}
              </p>
              <span className={`text-gray-400`}>•</span>
              <p className={`truncate max-w-[200px] sm:max-w-none ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                <span className="font-medium">Producto:</span> <span className="font-semibold">{orden.equipo?.modelo ? `${orden.equipo.modelo.marca?.nombre || ''} ${orden.equipo.modelo.equipo}` : orden.tipo_producto || 'No especificado'}</span>
              </p>
              <span className={`text-gray-400`}>•</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${
                orden.estado_actual === 'Esperando repuestos' ? 'bg-orange-500' :
                orden.estado_actual === 'Cotización' ? 'bg-blue-500' :
                orden.estado_actual === 'Esperando aceptación' ? 'bg-purple-600' :
                orden.estado_actual === 'Diagnóstico' ? 'bg-purple-500' :
                orden.estado_actual === 'Reparación' ? 'bg-indigo-500' :
                orden.estado_actual === 'Finalizada' ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {orden.estado_actual || 'Sin estado'}
              </span>
            </div>

            {/* Tercera fila: Botones de acción (solo en móvil) */}
            <div className="flex items-center gap-2 sm:hidden">
              {puedeRetroceder() && (
                <button
                  onClick={() => setShowRetrocederModal(true)}
                  disabled={isRetrocediendo || isAvanzando}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                      : 'bg-orange-900/30 hover:bg-orange-900/50 text-orange-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Retroceder
                </button>
              )}
              {/* Botón Avanzar/Finalizar en móvil */}
              {orden?.estado_actual === 'Entrega' ? (
                <button
                  onClick={handleFinalizarOrden}
                  disabled={isAvanzando || isRetrocediendo}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Finalizar orden"
                >
                  <span>Finalizar</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              ) : (
                puedeAvanzar() && (
                  <button
                    onClick={handleAvanzarFase}
                    disabled={isAvanzando || isRetrocediendo}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isAvanzando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Avanzando...</span>
                      </>
                    ) : (
                      <>
                        <span>Avanzar</span>
                        <ChevronRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )
              )}
            </div>

            {/* Botones de acción (solo en desktop) */}
            <div className="hidden sm:flex items-center gap-3 absolute right-4 top-4">
              {puedeRetroceder() && (
                <button
                  onClick={() => setShowRetrocederModal(true)}
                  disabled={isRetrocediendo || isAvanzando}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                      : 'bg-orange-900/30 hover:bg-orange-900/50 text-orange-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Retroceder
                </button>
              )}
              {orden?.estado_actual === 'Entrega' ? (
                <button
                  onClick={handleFinalizarOrden}
                  disabled={isAvanzando || isRetrocediendo}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Finalizar orden"
                >
                  <span>Finalizar orden</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              ) : (
                puedeAvanzar() && (
                  <button
                    onClick={handleAvanzarFase}
                    disabled={isAvanzando || isRetrocediendo}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isAvanzando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Avanzando...
                      </>
                    ) : (
                      <>
                        <span>Avanzar Fase</span>
                        <ChevronRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className={`${theme === 'light' ? 'bg-white border-b border-gray-200' : 'bg-gray-800 border-b border-gray-700'} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {FASES.map((fase, index) => {
              const Icon = fase.icon;
              const isCompleted = index < currentPhaseStep;
              const isCurrent = index === currentPhaseStep;
              const isClickable = index <= currentPhaseStep;

              return (
                <React.Fragment key={fase.id}>
                  <div className="flex flex-col items-center flex-1">
                    <button
                      onClick={() => isClickable && handleStepChange(index)}
                      disabled={!isClickable}
                      className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-700 ease-in-out ${
                        isCompleted
                          ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                          : isCurrent
                          ? 'bg-yellow-500 text-white ring-4 ring-yellow-200 dark:ring-yellow-900 cursor-pointer'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </button>
                    <p className={`mt-2 text-xs font-medium text-center ${
                      isCurrent
                        ? theme === 'light' ? 'text-gray-900' : 'text-white'
                        : theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {fase.label}
                    </p>
                  </div>
                  {index < FASES.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 transition-all duration-700 ease-in-out ${
                      index < currentPhaseStep
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`rounded-lg shadow-sm ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800'
        }`}>
          {renderCurrentForm()}
        </div>
      </div>

      {/* Modal Nota de Orden */}
      <NotaModal
        isOpen={showNotaModal}
        onClose={() => setShowNotaModal(false)}
        ordenId={ordenId}
        notaInicial={notaOrden}
        onNotaGuardada={(nuevaNota) => {
          setNotaOrden(nuevaNota);
          if (orden) {
            const ordenActualizada = { ...orden, nota_orden: nuevaNota };
            setOrden(ordenActualizada);
            saveOrdenToLocalStorage(ordenActualizada);
          }
        }}
      />

      {/* Modal Retroceder Fase */}
      {showRetrocederModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`relative w-full max-w-md rounded-lg shadow-xl ${
            theme === 'light' ? 'bg-white' : 'bg-gray-800'
          }`}>
            <div className={`flex items-center justify-between p-6 border-b ${
              theme === 'light' ? 'border-gray-200' : 'border-gray-700'
            }`}>
              <div>
                <h3 className={`text-lg font-semibold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Retroceder Fase
                </h3>
                <p className={`text-sm mt-1 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Indique el motivo del retroceso
                </p>
              </div>
            </div>
            
            <div className="p-6">
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Motivo del retroceso *
              </label>
              <textarea
                value={comentarioRetroceso}
                onChange={(e) => setComentarioRetroceso(e.target.value)}
                rows={4}
                placeholder="Explique por qué es necesario retroceder a la fase anterior..."
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
                required
              />
            </div>

            <div className={`flex items-center justify-end gap-3 p-6 border-t ${
              theme === 'light' ? 'border-gray-200' : 'border-gray-700'
            }`}>
              <button
                onClick={() => {
                  setShowRetrocederModal(false);
                  setComentarioRetroceso('');
                }}
                disabled={isRetrocediendo}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancelar
              </button>
              <button
                onClick={handleRetroceder}
                disabled={isRetrocediendo || !comentarioRetroceso.trim()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRetrocediendo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Retrocediendo...
                  </>
                ) : (
                  <>
                    <ChevronLeftIcon className="w-4 h-4" />
                    Retroceder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
