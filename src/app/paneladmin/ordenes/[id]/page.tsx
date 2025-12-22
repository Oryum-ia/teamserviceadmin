"use client";

import React, { useEffect, useState } from 'react';
import { notificarCambioFaseWhatsApp, notificarBodegaWhatsApp, notificarChatarrizadoWhatsApp, notificarCotizacionRechazadaWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';
import { notificarCambioFase, notificarCotizacionRechazada } from '@/lib/services/emailNotificationService';
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
  StickyNote,
  Copy,
  Check,
  MoreVertical,
  Warehouse,
  Trash2,
  Unlock,
  Play,
  Save
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showAccionesMenu, setShowAccionesMenu] = useState(false);
  const [isProcesingAction, setIsProcesingAction] = useState(false);
  const [isIniciandoFase, setIsIniciandoFase] = useState(false);
  const [isGuardando, setIsGuardando] = useState(false);

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

  // Verificar si el usuario es super-admin
  const verificarSuperAdmin = async () => {
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: authData } = await supabase.auth.getUser();
      
      if (!authData?.user?.id) {
        setIsSuperAdmin(false);
        return;
      }

      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', authData.user.id)
        .single();

      if (error) {
        console.error('Error al verificar rol:', error);
        setIsSuperAdmin(false);
        return;
      }

      setIsSuperAdmin(userData?.rol === 'super-admin');
    } catch (error) {
      console.error('Error al verificar super-admin:', error);
      setIsSuperAdmin(false);
    }
  };

  useEffect(() => {
    let channel: any = null;
    
    const inicializar = async () => {
      if (ordenId) {
        await cargarOrden();
        await verificarSuperAdmin();
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

  // Mapear estado_actual a fase (solo estados normales del flujo)
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
  
  // Verificar si está en estado especial (Bodega o Chatarrizado)
  const esEstadoEspecial = () => {
    return orden?.estado_actual === 'Bodega' || orden?.estado_actual === 'Chatarrizado';
  };

  // Calcular step a partir de una orden, respetando fase_anterior en estados especiales
  const calcularStepDesdeOrden = (ordenFuente: any): number => {
    if (!ordenFuente) return 0;

    const esEspecial =
      ordenFuente.estado_actual === 'Bodega' ||
      ordenFuente.estado_actual === 'Chatarrizado';

    if (esEspecial) {
      if (ordenFuente.fase_anterior) {
        const faseAnterior = FASES.find((f) => f.id === ordenFuente.fase_anterior);
        return faseAnterior?.step || 0;
      }
      // Si no hay fase_anterior (órdenes antiguas), mostrar solo recepción
      return 0;
    }

    const faseId = mapEstadoAFase(ordenFuente.estado_actual);
    return FASES.find((f) => f.id === faseId)?.step || 0;
  };

  // Obtener el step máximo navegable basado en fase_anterior o estado_actual
  const getMaxStepNavegable = () => {
    if (!orden) return 0;

    if (esEstadoEspecial()) {
      if (orden.fase_anterior) {
        const faseAnterior = FASES.find((f) => f.id === orden.fase_anterior);
        return faseAnterior?.step || 0;
      }
      return 0;
    }

    const faseId = mapEstadoAFase(orden.estado_actual);
    return FASES.find((f) => f.id === faseId)?.step || 0;
  };

  // Actualizar step cuando cambia la fase de la orden
  useEffect(() => {
    if (orden) {
      // Si está en Bodega o Chatarrizado, mantener el step actual o ir al máximo navegable
      if (esEstadoEspecial()) {
        const maxStep = getMaxStepNavegable();
        if (currentStep > maxStep) {
          setCurrentStep(maxStep);
        }
      } else {
        const faseId = mapEstadoAFase(orden.estado_actual);
        const faseActual = FASES.find(f => f.id === faseId);
        if (faseActual && faseActual.step !== currentStep) {
          setCurrentStep(faseActual.step);
        }
      }
      // Actualizar nota de la orden
      setNotaOrden(orden.nota_orden || '');
    }
  }, [orden?.estado_actual, orden?.nota_orden, orden?.fase_anterior]);

  const handleCopyId = () => {
    if (orden?.codigo) {
      navigator.clipboard.writeText(orden.codigo);
      setCopiedId(true);
      toast.success('ID copiado al portapapeles');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const cargarOrden = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Intentar cargar desde localStorage primero
      const ordenLocal = getOrdenFromLocalStorage();
      
      if (ordenLocal && ordenLocal.id === parseInt(ordenId)) {
        console.log('📦 Cargando orden desde localStorage');
        setOrden(ordenLocal);
        
        // Determinar step actual respetando fase_anterior en Bodega/Chatarrizado
        setCurrentStep(calcularStepDesdeOrden(ordenLocal));
        
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
        
        // Determinar step actual respetando fase_anterior en Bodega/Chatarrizado
        setCurrentStep(calcularStepDesdeOrden(data));
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
              estado_actual: payload.new?.estado_actual,
              aprobado_cliente: payload.new?.aprobado_cliente,
              terminos_aceptados: payload.new?.terminos_aceptados,
              firma_cliente: payload.new?.firma_cliente ? 'Sí tiene' : 'No tiene',
              fecha_aceptacion: payload.new?.fecha_aceptacion_terminos,
              fecha_firma: payload.new?.fecha_firma_cliente
            });
            
            // Detectar cambio de estado
            const estadoAnterior = payload.old?.estado_actual;
            const estadoNuevo = payload.new?.estado_actual;
            
            if (estadoAnterior && estadoNuevo && estadoAnterior !== estadoNuevo) {
              console.log('🔄 Cambio de estado detectado:', {
                anterior: estadoAnterior,
                nuevo: estadoNuevo
              });
              
              // Mostrar notificación al usuario
              toast.success(`Estado actualizado: ${estadoNuevo}`);
            }
            
            // Detectar cuando el cliente rechaza la cotización
            const aprobadoAnterior = payload.old?.aprobado_cliente;
            const aprobadoNuevo = payload.new?.aprobado_cliente;
            
            if (aprobadoAnterior !== aprobadoNuevo && aprobadoNuevo === false) {
              console.log('❌ Cliente rechazó la cotización - Enviando notificaciones');
              toast.warning('El cliente rechazó la cotización');
              
              // Enviar notificaciones de rechazo
              try {
                // Notificar por email
                await notificarCotizacionRechazada(ordenId);
                console.log('✅ Email de rechazo enviado');
              } catch (emailError) {
                console.error('⚠️ Error al enviar email de rechazo:', emailError);
              }
              
              try {
                // Notificar por WhatsApp (abre ventana)
                await notificarCotizacionRechazadaWhatsApp(ordenId);
                console.log('✅ WhatsApp de rechazo abierto');
              } catch (whatsappError) {
                console.error('⚠️ Error al abrir WhatsApp de rechazo:', whatsappError);
              }
            }
            
            // Recargar la orden completa con todas las relaciones
            try {
              const ordenCompleta = await obtenerOrdenPorId(ordenId);
              console.log('✅ Orden completa recargada:', {
                id: ordenCompleta.id,
                estado_actual: ordenCompleta.estado_actual,
                aprobado_cliente: ordenCompleta.aprobado_cliente,
                terminos_aceptados: ordenCompleta.terminos_aceptados,
                firma_cliente: ordenCompleta.firma_cliente ? 'Sí tiene' : 'No tiene',
                fecha_aceptacion: ordenCompleta.fecha_aceptacion_terminos,
                fecha_firma: ordenCompleta.fecha_firma_cliente
              });
              
              // Actualizar estado de la orden
              setOrden(ordenCompleta);
              saveOrdenToLocalStorage(ordenCompleta);
              
              // Actualizar el paso actual según el nuevo estado, respetando fase_anterior
              const nuevoStep = calcularStepDesdeOrden(ordenCompleta);
              setCurrentStep(nuevoStep);
              
              console.log('📍 Vista actualizada al paso:', nuevoStep, '(', ordenCompleta.estado_actual, ')');
            } catch (error) {
              console.error('❌ Error recargando orden:', error);
              // Fallback: usar solo los datos del payload
              if (payload.new) {
                const nuevaOrden = payload.new as any;
                setOrden(nuevaOrden);
                saveOrdenToLocalStorage(nuevaOrden);
                
                // Actualizar el paso actual respetando fase_anterior
                const nuevoStep = calcularStepDesdeOrden(nuevaOrden);
                setCurrentStep(nuevoStep);
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
    // Si está en Bodega o Chatarrizado, permitir navegar hasta fase_anterior
    if (esEstadoEspecial()) {
      const maxStep = getMaxStepNavegable();
      if (step <= maxStep) {
        setCurrentStep(step);
      }
      return;
    }
    
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
        // Limpiar repuestos del diagnóstico al retroceder
        camposALimpiar.repuestos_diagnostico = null;
      } else if (faseActual === 'cotizacion') {
        camposALimpiar.fecha_cotizacion = null; // fecha_inicio de cotización
        camposALimpiar.fecha_aprobacion = null;
        camposALimpiar.tecnico_cotiza = null;
        camposALimpiar.fecha_solicitud_repuestos = null;
        camposALimpiar.fecha_recepcion_repuestos = null;
        // Limpiar repuestos de cotización y estado de aprobación al retroceder
        camposALimpiar.repuestos_cotizacion = null;
        camposALimpiar.aprobado_cliente = null;
        camposALimpiar.envio_cotizacion = false;
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
      
      // Limpiar caché de repuestos en localStorage si se retrocede de cotización o diagnóstico
      if (typeof window !== 'undefined') {
        if (faseActual === 'cotizacion') {
          window.localStorage.removeItem(`repuestos_cotizacion_${ordenId}`);
        } else if (faseActual === 'diagnostico') {
          window.localStorage.removeItem(`repuestos_diagnostico_${ordenId}`);
        }
      }

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
    // Solo super-admin puede retroceder
    if (!isSuperAdmin) return false;
    
    // Bloquear si está en bodega o chatarrizado
    if (orden?.estado_actual === 'Bodega' || orden?.estado_actual === 'Chatarrizado') {
      return false;
    }
    
    const faseId = mapEstadoAFase(orden?.estado_actual);
    const currentPhaseStep = FASES.find(f => f.id === faseId)?.step || 0;
    return currentPhaseStep > 0; // Puede retroceder si no está en recepción
  };

  // Verificar si la fase actual ya fue iniciada
  const faseYaIniciada = () => {
    if (!orden) return true;
    const faseId = mapEstadoAFase(orden.estado_actual);
    
    // Solo Diagnóstico y Reparación requieren ser iniciadas
    // Recepción, Cotización y Entrega están siempre disponibles
    if (faseId !== 'diagnostico' && faseId !== 'reparacion') {
      return true; // Siempre "iniciada" para otras fases
    }
    
    // Mapear fase a campo de fecha_inicio solo para diagnóstico y reparación
    const camposFechaInicio: Record<string, string> = {
      'diagnostico': 'fecha_inicio_diagnostico',
      'reparacion': 'fecha_inicio_reparacion'
    };
    
    const campoFecha = camposFechaInicio[faseId];
    return campoFecha ? !!orden[campoFecha] : true;
  };

  // Manejar inicio de fase (solo para Diagnóstico y Reparación)
  const handleIniciarFase = async () => {
    if (!orden) return;
    
    setIsIniciandoFase(true);
    try {
      const now = new Date().toISOString();
      const faseId = mapEstadoAFase(orden.estado_actual);
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Solo Diagnóstico y Reparación requieren ser iniciadas
      const camposFechaInicio: Record<string, string> = {
        'diagnostico': 'fecha_inicio_diagnostico',
        'reparacion': 'fecha_inicio_reparacion'
      };
      
      const campoFecha = camposFechaInicio[faseId];
      
      if (!campoFecha) {
        toast.error('Esta fase no requiere ser iniciada');
        setIsIniciandoFase(false);
        return;
      }
      
      const camposActualizacion: any = {
        [campoFecha]: now,
        ultima_actualizacion: now
      };
      
      await supabase
        .from('ordenes')
        .update(camposActualizacion)
        .eq('id', ordenId);
      
      // Actualizar estado local
      const ordenActualizada = {
        ...orden,
        ...camposActualizacion
      };
      setOrden(ordenActualizada);
      saveOrdenToLocalStorage(ordenActualizada);
      
      toast.success(`Fase de ${FASES.find(f => f.id === faseId)?.label} iniciada`);
    } catch (error) {
      console.error('Error al iniciar fase:', error);
      toast.error('Error al iniciar la fase');
    } finally {
      setIsIniciandoFase(false);
    }
  };

  // Verificar si puede iniciar fase (no está en recepción, bodega, chatarrizado o finalizada)
  const puedeIniciarFase = () => {
    if (!orden) return false;
    
    const estadosBloqueados = ['Recepción', 'Bodega', 'Chatarrizado', 'Finalizada'];
    if (estadosBloqueados.includes(orden.estado_actual)) return false;
    
    return !faseYaIniciada();
  };

  // Guardar datos de la fase actual
  const handleGuardarFase = async () => {
    if (!orden) return;
    
    setIsGuardando(true);
    try {
      const faseActual = FASES[currentStep].id;
      
      // Llamar a la función de guardar correspondiente según la fase
      switch (faseActual) {
        case 'recepcion':
          // En recepción, los datos (accesorios y fotos) se guardan automáticamente
          // Solo mostramos un mensaje de confirmación
          toast.success('Datos de recepción guardados');
          break;
        case 'diagnostico':
          if (typeof (window as any).guardarDatosDiagnostico === 'function') {
            await (window as any).guardarDatosDiagnostico();
            toast.success('Datos de diagnóstico guardados');
          }
          break;
        case 'cotizacion':
          if (typeof (window as any).guardarDatosCotizacion === 'function') {
            await (window as any).guardarDatosCotizacion();
            toast.success('Datos de cotización guardados');
          }
          break;
        case 'reparacion':
          if (typeof (window as any).guardarDatosReparacion === 'function') {
            await (window as any).guardarDatosReparacion();
            toast.success('Datos de reparación guardados');
          }
          break;
        case 'entrega':
          if (typeof (window as any).guardarDatosEntrega === 'function') {
            await (window as any).guardarDatosEntrega();
            toast.success('Datos de entrega guardados');
          }
          break;
        default:
          toast.info('No hay datos para guardar en esta fase');
      }
    } catch (error) {
      console.error('Error al guardar datos de la fase:', error);
      toast.error('Error al guardar los datos');
    } finally {
      setIsGuardando(false);
    }
  };

  const puedeAvanzar = () => {
    // Bloquear avance si está esperando repuestos
    if (orden?.estado_actual === 'Esperando repuestos') {
      return false;
    }
    
    // Bloquear si está en bodega o chatarrizado
    if (orden?.estado_actual === 'Bodega' || orden?.estado_actual === 'Chatarrizado') {
      return false;
    }

    const faseId = mapEstadoAFase(orden?.estado_actual);
    const currentPhaseStep = FASES.find(f => f.id === faseId)?.step || 0;

    // Validación especial para fase de recepción
    if (faseId === 'recepcion') {
      // Solo permitir avanzar si tiene términos aceptados y firma del cliente
      return orden?.terminos_aceptados && orden?.firma_cliente;
    }

    // Bloquear avance si la fase actual no ha sido iniciada (excepto recepción)
    if (!faseYaIniciada()) {
      return false;
    }

    return currentPhaseStep < FASES.length - 1; // Puede avanzar si no está en la última fase
  };

  const handleAvanzarFase = async () => {
    // Bloquear avance si está esperando repuestos
    if (orden?.estado_actual === 'Esperando repuestos') {
      toast.error('No se puede avanzar mientras se esperan repuestos');
      return;
    }
    
    // Si está en Cotización o Esperando aceptación, validar respuesta del cliente
    if ((orden?.estado_actual === 'Cotización' || orden?.estado_actual === 'Esperando aceptación') && orden?.aprobado_cliente === null) {
      toast.error('Debe esperar a que el cliente responda la cotización');
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
      let siguienteFase = FASES[currentPhaseStep + 1];
      const faseActual = FASES[currentPhaseStep].id;
      const now = new Date().toISOString();
      const tecnicoId = await obtenerTecnicoActual();
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Si el cliente rechazó la cotización, saltar directamente a Entrega
      if (faseActual === 'cotizacion' && orden?.aprobado_cliente === false) {
        siguienteFase = FASES.find(f => f.id === 'entrega') || siguienteFase;
      }
      
      // Preparar campos según fase actual y siguiente
      const camposActualizacion: any = {
        estado_actual: siguienteFase.label,
        ultima_actualizacion: now
      };

      // Cerrar fase actual
      if (faseActual === 'recepcion') {
        camposActualizacion.fecha_fin_recepcion = now;
        camposActualizacion.tecnico_recepcion = tecnicoId;
        // NO establecer fecha_inicio_diagnostico aquí - el técnico debe iniciarla manualmente
      } else if (faseActual === 'diagnostico') {
        camposActualizacion.fecha_fin_diagnostico = now;
        camposActualizacion.tecnico_diagnostico = tecnicoId;
        // NO establecer fecha_cotizacion aquí - el técnico debe iniciarla manualmente

        // Al avanzar desde diagnóstico, guardar comentarios y técnico seleccionado
        if (typeof window !== 'undefined' && (window as any).guardarDatosDiagnostico) {
          const datosDiagnostico = await (window as any).guardarDatosDiagnostico();
          if (!datosDiagnostico) {
            setIsAvanzando(false);
            return; // Detener si no hay datos (validación falló)
          }
          // Aplicar los datos de diagnóstico a camposActualizacion
          Object.assign(camposActualizacion, datosDiagnostico);
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
        
        camposActualizacion.tecnico_cotiza = tecnicoId;
        
        // Si el cliente rechazó, ir directo a entrega
        if (orden.aprobado_cliente === false) {
          // No establecer fecha_aprobacion ni fecha_inicio_reparacion
          // Ir directamente a entrega sin reparar
        } else if (orden.aprobado_cliente === true) {
          // Cliente aprobó, continuar con reparación
          if (!orden.fecha_aprobacion) {
            camposActualizacion.fecha_aprobacion = now;
          }
          // NO establecer fecha_inicio_reparacion aquí - el técnico debe iniciarla manualmente
        }
      } else if (faseActual === 'reparacion') {
        // Al avanzar desde reparación, obtener el técnico seleccionado
        if (typeof window !== 'undefined' && (window as any).guardarDatosReparacion) {
          const datosReparacion = await (window as any).guardarDatosReparacion();
          if (!datosReparacion) {
            setIsAvanzando(false);
            return; // Detener si no hay datos (validación falló)
          }
          Object.assign(camposActualizacion, datosReparacion);
        } else {
           // Fallback si no hay función (no debería pasar)
           camposActualizacion.tecnico_repara = tecnicoId;
        }

        camposActualizacion.fecha_fin_reparacion = now;
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
      // Usar templates específicos si el cliente rechazó la cotización
      const esRechazoACotizacion = faseActual === 'cotizacion' && orden.aprobado_cliente === false;
      
      try {
        if (esRechazoACotizacion) {
          // Notificación específica de cotización rechazada
          await notificarCotizacionRechazada(ordenId);
          console.log('✅ Email de cotización rechazada enviado');
        } else {
          // Email de cambio de fase normal
          await notificarCambioFase(ordenId, siguienteFase.label);
        }
      } catch (emailError) {
        console.error('⚠️ Error al enviar correo:', emailError);
      }
      
      try {
        if (esRechazoACotizacion) {
          // WhatsApp específico de cotización rechazada
          await notificarCotizacionRechazadaWhatsApp(ordenId);
          console.log('✅ WhatsApp de cotización rechazada abierto');
        } else {
          // WhatsApp de cambio de fase normal
          await notificarCambioFaseWhatsApp(ordenId, siguienteFase.label);
        }
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
    if (!orden?.firma_entrega) {
      toast.error('Debe tener la firma del cliente antes de finalizar la orden');
      return;
    }

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

  // Formatear fecha para mostrar
  const formatearFechaCorta = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Manejar envío a bodega
  const handleEnviarBodega = async () => {
    setIsProcesingAction(true);
    setShowAccionesMenu(false);
    try {
      const now = new Date().toISOString();
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Guardar la fase anterior antes de cambiar a Bodega
      const faseAnterior = mapEstadoAFase(orden.estado_actual);
      
      await supabase
        .from('ordenes')
        .update({
          fecha_bodega: now,
          fase_anterior: faseAnterior, // Guardar fase para navegación y restaurar al liberar
          estado_actual: 'Bodega',
          ultima_actualizacion: now
        })
        .eq('id', ordenId);

      const ordenActualizada = {
        ...orden,
        fecha_bodega: now,
        fase_anterior: faseAnterior,
        estado_actual: 'Bodega',
        ultima_actualizacion: now
      };
      setOrden(ordenActualizada);
      saveOrdenToLocalStorage(ordenActualizada);

      toast.success('Producto enviado a bodega');

      // Notificar por WhatsApp
      try {
        await notificarBodegaWhatsApp(ordenId, formatearFechaCorta(now));
      } catch (whatsappError) {
        console.error('⚠️ Error al abrir WhatsApp:', whatsappError);
      }
    } catch (error) {
      console.error('Error al enviar a bodega:', error);
      toast.error('Error al enviar a bodega');
    } finally {
      setIsProcesingAction(false);
    }
  };

  // Manejar chatarrizado (IRREVERSIBLE)
  const handleChatarrizar = async () => {
    // Confirmar antes de chatarrizar (es irreversible)
    if (!confirm('⚠️ ATENCIÓN: El chatarrizado es IRREVERSIBLE. ¿Está seguro de continuar?')) {
      setShowAccionesMenu(false);
      return;
    }
    
    setIsProcesingAction(true);
    setShowAccionesMenu(false);
    try {
      const now = new Date().toISOString();
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Guardar la fase anterior si no existe (puede venir de bodega)
      const faseAnterior = orden.fase_anterior || mapEstadoAFase(orden.estado_actual);
      
      await supabase
        .from('ordenes')
        .update({
          fecha_chatarrizado: now,
          fecha_bodega: null, // Limpiar bodega si existía
          fase_anterior: faseAnterior,
          estado_actual: 'Chatarrizado',
          ultima_actualizacion: now
        })
        .eq('id', ordenId);

      const ordenActualizada = {
        ...orden,
        fecha_chatarrizado: now,
        fecha_bodega: null,
        fase_anterior: faseAnterior,
        estado_actual: 'Chatarrizado',
        ultima_actualizacion: now
      };
      setOrden(ordenActualizada);
      saveOrdenToLocalStorage(ordenActualizada);

      toast.success('Producto chatarrizado');

      // Notificar por WhatsApp
      try {
        await notificarChatarrizadoWhatsApp(ordenId, formatearFechaCorta(now));
      } catch (whatsappError) {
        console.error('⚠️ Error al abrir WhatsApp:', whatsappError);
      }
    } catch (error) {
      console.error('Error al chatarrizar:', error);
      toast.error('Error al chatarrizar');
    } finally {
      setIsProcesingAction(false);
    }
  };

  // Manejar liberación (solo desde bodega, NO desde chatarrizado)
  const handleLiberar = async () => {
    // Solo se puede liberar desde bodega
    if (orden.estado_actual !== 'Bodega') {
      toast.error('Solo se puede liberar productos en bodega');
      return;
    }
    
    setIsProcesingAction(true);
    setShowAccionesMenu(false);
    try {
      const now = new Date().toISOString();
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Restaurar el estado según la fase anterior
      const faseAnterior = orden.fase_anterior || 'recepcion';
      const estadoMap: Record<string, string> = {
        'recepcion': 'Recepción',
        'diagnostico': 'Diagnóstico',
        'cotizacion': 'Cotización',
        'reparacion': 'Reparación',
        'entrega': 'Entrega'
      };
      const estadoRestaurar = estadoMap[faseAnterior] || 'Recepción';
      
      await supabase
        .from('ordenes')
        .update({
          fecha_bodega: null,
          fase_anterior: null,
          estado_actual: estadoRestaurar,
          ultima_actualizacion: now
        })
        .eq('id', ordenId);

      const ordenActualizada = {
        ...orden,
        fecha_bodega: null,
        fase_anterior: null,
        estado_actual: estadoRestaurar,
        ultima_actualizacion: now
      };
      setOrden(ordenActualizada);
      saveOrdenToLocalStorage(ordenActualizada);

      toast.success(`Producto liberado - Estado restaurado a ${estadoRestaurar}`);
    } catch (error) {
      console.error('Error al liberar:', error);
      toast.error('Error al liberar');
    } finally {
      setIsProcesingAction(false);
    }
  };

  // Manejar eliminación de orden (solo super-admin)
  const handleEliminarOrden = async () => {
    if (!isSuperAdmin) {
      toast.error('Solo los super-admins pueden eliminar órdenes');
      return;
    }

    setIsProcesingAction(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      console.log('🗑️ Eliminando orden:', ordenId);
      
      // Eliminar la orden (las relaciones se eliminarán en cascada si están configuradas)
      const { error } = await supabase
        .from('ordenes')
        .delete()
        .eq('id', ordenId);

      if (error) {
        console.error('❌ Error al eliminar orden:', error);
        throw error;
      }

      console.log('✅ Orden eliminada exitosamente');
      toast.success('Orden eliminada exitosamente');
      
      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('ordenActual');
      }
      
      // Redirigir al panel de órdenes
      router.push('/paneladmin?section=ordenes');
    } catch (error) {
      console.error('Error al eliminar orden:', error);
      toast.error('Error al eliminar la orden. Verifique que no tenga datos relacionados.');
    } finally {
      setIsProcesingAction(false);
    }
  };

  const renderCurrentForm = () => {
    if (!orden) return null;

    const faseIniciada = faseYaIniciada();
    
    // Los componentes usan useEffect para sincronizarse con los cambios de orden
    switch (FASES[currentStep].id) {
      case 'recepcion':
        return <RecepcionForm orden={orden} onSuccess={cargarOrden} />;
      case 'diagnostico':
        return <DiagnosticoForm orden={orden} onSuccess={cargarOrden} faseIniciada={faseIniciada} />;
      case 'cotizacion':
        return <CotizacionForm orden={orden} onSuccess={cargarOrden} faseIniciada={faseIniciada} />;
      case 'reparacion':
        return <ReparacionForm orden={orden} onSuccess={cargarOrden} faseIniciada={faseIniciada} />;
      case 'entrega':
        return <EntregaForm orden={orden} onSuccess={cargarOrden} faseIniciada={faseIniciada} />;
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
                    
                    {/* Botón para copiar ID */}
                    <button
                      onClick={handleCopyId}
                      className={`p-1.5 rounded-md transition-colors ${
                        theme === 'light'
                          ? 'hover:bg-gray-200 text-gray-500'
                          : 'hover:bg-gray-700 text-gray-400'
                      }`}
                      title="Copiar ID de orden"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>

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

                    {/* Menú de acciones (3 puntos) */}
                    <div className="relative">
                      <button
                        onClick={() => setShowAccionesMenu(!showAccionesMenu)}
                        disabled={isProcesingAction}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                          theme === 'light'
                            ? 'hover:bg-gray-100 text-gray-600'
                            : 'hover:bg-gray-700 text-gray-400'
                        } disabled:opacity-50`}
                        title="Más acciones"
                      >
                        {isProcesingAction ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        ) : (
                          <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>

                      {/* Dropdown menu */}
                      {showAccionesMenu && (
                        <>
                          {/* Overlay para cerrar el menú */}
                          <div 
                            className="fixed inset-0 z-20" 
                            onClick={() => setShowAccionesMenu(false)}
                          />
                          
                          <div className={`absolute right-0 top-full mt-1 w-56 rounded-lg shadow-lg border z-30 ${
                            theme === 'light' 
                              ? 'bg-white border-gray-200' 
                              : 'bg-gray-800 border-gray-700'
                          }`}>
                            <div className="py-1">
                              {/* Retroceder fase */}
                              {puedeRetroceder() && (
                                <button
                                  onClick={() => {
                                    setShowAccionesMenu(false);
                                    setShowRetrocederModal(true);
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                    theme === 'light'
                                      ? 'hover:bg-orange-50 text-orange-700'
                                      : 'hover:bg-orange-900/20 text-orange-400'
                                  }`}
                                >
                                  <ChevronLeftIcon className="w-4 h-4" />
                                  Retroceder fase
                                </button>
                              )}

                              {/* Separador */}
                              {puedeRetroceder() && (
                                <div className={`my-1 border-t ${
                                  theme === 'light' ? 'border-gray-200' : 'border-gray-700'
                                }`} />
                              )}

                              {/* Enviar a bodega - solo si no está en bodega ni chatarrizado */}
                              {orden.estado_actual !== 'Bodega' && orden.estado_actual !== 'Chatarrizado' && (
                                <button
                                  onClick={handleEnviarBodega}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                    theme === 'light'
                                      ? 'hover:bg-amber-50 text-amber-700'
                                      : 'hover:bg-amber-900/20 text-amber-400'
                                  }`}
                                >
                                  <Warehouse className="w-4 h-4" />
                                  Enviar a bodega
                                </button>
                              )}

                              {/* Chatarrizar - solo si no está chatarrizado */}
                              {orden.estado_actual !== 'Chatarrizado' && (
                                <button
                                  onClick={handleChatarrizar}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                    theme === 'light'
                                      ? 'hover:bg-red-50 text-red-700'
                                      : 'hover:bg-red-900/20 text-red-400'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Chatarrizar
                                </button>
                              )}

                              {/* Liberar - SOLO si está en Bodega (chatarrizado es irreversible) */}
                              {orden.estado_actual === 'Bodega' && (
                                <>
                                  <div className={`my-1 border-t ${
                                    theme === 'light' ? 'border-gray-200' : 'border-gray-700'
                                  }`} />
                                  <button
                                    onClick={handleLiberar}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                      theme === 'light'
                                        ? 'hover:bg-green-50 text-green-700'
                                        : 'hover:bg-green-900/20 text-green-400'
                                    }`}
                                  >
                                    <Unlock className="w-4 h-4" />
                                    Liberar producto
                                  </button>
                                </>
                              )}

                              {/* Eliminar orden - SOLO super-admin */}
                              {isSuperAdmin && (
                                <>
                                  <div className={`my-1 border-t ${
                                    theme === 'light' ? 'border-gray-200' : 'border-gray-700'
                                  }`} />
                                  <button
                                    onClick={() => {
                                      setShowAccionesMenu(false);
                                      if (window.confirm(
                                        `¿Está seguro de eliminar la orden ${orden.codigo}?\n\n` +
                                        'Esta acción NO se puede deshacer.\n' +
                                        'Se eliminarán todos los datos asociados a esta orden.'
                                      )) {
                                        handleEliminarOrden();
                                      }
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                      theme === 'light'
                                        ? 'hover:bg-red-50 text-red-700'
                                        : 'hover:bg-red-900/20 text-red-400'
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar orden
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
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
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                orden.estado_actual === 'Bodega' 
                  ? 'bg-amber-500 text-white' :
                orden.estado_actual === 'Chatarrizado' 
                  ? 'bg-red-600 text-white' :
                orden.estado_actual === 'Esperando repuestos' 
                  ? 'bg-orange-500 text-white' :
                orden.estado_actual === 'Cotización' 
                  ? 'bg-blue-500 text-white' :
                orden.estado_actual === 'Esperando aceptación' 
                  ? 'bg-purple-600 text-white' :
                orden.estado_actual === 'Diagnóstico' 
                  ? 'bg-purple-500 text-white' :
                orden.estado_actual === 'Reparación' 
                  ? 'bg-indigo-500 text-white' :
                orden.estado_actual === 'Finalizada' 
                  ? 'bg-green-500 text-white' :
                orden.estado_actual === 'Recepción'
                  ? 'bg-sky-500 text-white' : 'bg-gray-500 text-white'
              }`}>
                {orden.estado_actual === 'Bodega' && <Warehouse className="w-3 h-3" />}
                {orden.estado_actual === 'Chatarrizado' && <Trash2 className="w-3 h-3" />}
                {orden.estado_actual || 'Sin estado'}
                {/* Mostrar fecha si está en Bodega o Chatarrizado */}
                {orden.estado_actual === 'Bodega' && orden.fecha_bodega && (
                  <span className="opacity-90">• {formatearFechaCorta(orden.fecha_bodega)}</span>
                )}
                {orden.estado_actual === 'Chatarrizado' && orden.fecha_chatarrizado && (
                  <span className="opacity-90">• {formatearFechaCorta(orden.fecha_chatarrizado)}</span>
                )}
              </span>
            </div>

            {/* Tercera fila: Botones de acción (solo en móvil) */}
            <div className="flex items-center gap-2 sm:hidden">
              {/* Botón Iniciar Fase en móvil */}
              {puedeIniciarFase() && (
                <button
                  onClick={handleIniciarFase}
                  disabled={isIniciandoFase || isAvanzando}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isIniciandoFase ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <span>Iniciar Fase</span>
                      <Play className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
              {/* Botón Guardar en móvil */}
              {!puedeIniciarFase() && (
                <button
                  onClick={handleGuardarFase}
                  disabled={isGuardando || isAvanzando || isRetrocediendo}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isGuardando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar</span>
                    </>
                  )}
                </button>
              )}
              {/* Botón Avanzar/Finalizar en móvil */}
              {orden?.estado_actual === 'Entrega'
                ? (
                    orden?.firma_entrega && (
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
                    )
                  )
                : (
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
              {/* Botón Iniciar Fase en desktop */}
              {puedeIniciarFase() && (
                <button
                  onClick={handleIniciarFase}
                  disabled={isIniciandoFase || isAvanzando}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isIniciandoFase ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <span>Iniciar Fase</span>
                      <Play className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
              {/* Botón Guardar en desktop */}
              {!puedeIniciarFase() && (
                <button
                  onClick={handleGuardarFase}
                  disabled={isGuardando || isAvanzando || isRetrocediendo}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isGuardando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar</span>
                    </>
                  )}
                </button>
              )}
              {orden?.estado_actual === 'Entrega'
                ? (
                    orden?.firma_entrega && (
                      <button
                        onClick={handleFinalizarOrden}
                        disabled={isAvanzando || isRetrocediendo}
                        className={`flex items-center gap-2 px-4 py-2 min-w-[160px] rounded-lg text-sm font-medium transition-colors ${
                          theme === 'light'
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Finalizar orden"
                      >
                        <span>Finalizar orden</span>
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    )
                  )
                : (
                    puedeAvanzar() && (
                      <button
                        onClick={handleAvanzarFase}
                        disabled={isAvanzando || isRetrocediendo}
                        className={`flex items-center gap-2 px-4 py-2 min-w-[160px] rounded-lg text-sm font-medium transition-colors ${
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
              const maxStep = getMaxStepNavegable();
              const isChatarrizado = orden?.estado_actual === 'Chatarrizado';
              
              // En estado especial: completadas hasta maxStep, actual es donde está el usuario
              const isCompleted = esEstadoEspecial() 
                ? index < currentStep && index < maxStep
                : index < currentPhaseStep;
              const isCurrent = index === currentStep;
              // Clickeable hasta maxStep en estado especial, o hasta currentPhaseStep normalmente
              const isClickable = esEstadoEspecial() 
                ? index <= maxStep 
                : index <= currentPhaseStep;

              // Colores según estado
              const getButtonClasses = () => {
                if (esEstadoEspecial()) {
                  if (isCurrent) {
                    // Color del anillo según estado
                    const ringColor = isChatarrizado 
                      ? 'ring-red-200 dark:ring-red-900' 
                      : 'ring-cyan-200 dark:ring-cyan-900';
                    return `bg-yellow-500 text-white ring-4 ${ringColor} cursor-pointer`;
                  }
                  if (index <= maxStep) {
                    // Fases navegables - verdes si completadas
                    if (index < currentStep) {
                      return 'bg-green-500 text-white cursor-pointer hover:bg-green-600';
                    }
                    // Fases futuras pero navegables
                    const hoverColor = isChatarrizado 
                      ? 'hover:bg-red-400 dark:hover:bg-red-500' 
                      : 'hover:bg-cyan-400 dark:hover:bg-cyan-500';
                    const bgColor = isChatarrizado 
                      ? 'bg-red-300 dark:bg-red-700' 
                      : 'bg-cyan-300 dark:bg-cyan-700';
                    return `${bgColor} text-white cursor-pointer ${hoverColor}`;
                  }
                  // Fases no navegables
                  return 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed';
                }
                // Estado normal
                if (isCompleted) return 'bg-green-500 text-white cursor-pointer hover:bg-green-600';
                if (isCurrent) return 'bg-yellow-500 text-white ring-4 ring-yellow-200 dark:ring-yellow-900 cursor-pointer';
                return 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed';
              };

              // Color de línea conectora
              const getLineColor = () => {
                if (esEstadoEspecial()) {
                  if (index < currentStep && index < maxStep) return 'bg-green-500';
                  if (index < maxStep) {
                    return isChatarrizado 
                      ? 'bg-red-300 dark:bg-red-700' 
                      : 'bg-cyan-300 dark:bg-cyan-700';
                  }
                  return 'bg-gray-300 dark:bg-gray-600';
                }
                return index < currentPhaseStep ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600';
              };

              return (
                <React.Fragment key={`${fase.id}-${index}-${currentPhaseStep}`}>
                  <div className="flex flex-col items-center flex-1">
                    <button
                      onClick={() => isClickable && handleStepChange(index)}
                      disabled={!isClickable}
                      className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-700 ease-in-out ${getButtonClasses()}`}
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
                    <div className={`flex-1 h-1 mx-2 transition-all duration-700 ease-in-out ${getLineColor()}`} />
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
                spellCheck={true}
                lang="es"
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
