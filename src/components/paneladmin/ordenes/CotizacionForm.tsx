"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Loader2, MessageCircle } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { updateOrdenFields } from '@/lib/ordenLocalStorage';
import { formatearFechaColombiaLarga, crearTimestampColombia } from '@/lib/utils/dateUtils';
import { actualizarCotizacion, marcarEsperaRepuestos } from '@/lib/services/ordenService';
import { notificarCotizacionWhatsApp, notificarCambioFaseWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';
import { notificarCambioFase } from '@/lib/services/emailNotificationService';
import { obtenerRepuestosDelModelo, obtenerRepuestosDiagnostico, guardarRepuestosCotizacion, obtenerRepuestosCotizacion } from '@/lib/services/repuestoService';
import { PercentageInput } from '@/components/ui/PercentageInput';
import {
  calculateSubtotalAfterDiscount,
  calculateIvaAmount,
  calculateItemTotal,
  calculateFinalTotals,
  formatCurrency,
  formatNumberWithCommas,
  parseCurrency,
  type PriceItem,
  type PriceTotals,
} from '@/lib/utils/pricing.utils';

interface Repuesto {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  iva: number;
  en_stock: boolean;
}

interface CotizacionFormProps {
  orden: any;
  onSuccess: () => void;
  faseIniciada?: boolean;
}

export default function CotizacionForm({ orden, onSuccess, faseIniciada = true }: CotizacionFormProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [esperandoRepuestos, setEsperandoRepuestos] = useState(false);

  // Sincronizar aprobación del cliente en tiempo real
  const [aprobadoCliente, setAprobadoCliente] = useState(orden.aprobado_cliente || false);

  React.useEffect(() => {
    console.log('🔄 Actualizando aprobación del cliente:', {
      aprobado_cliente: orden.aprobado_cliente,
      estado_actual: orden.estado_actual
    });
    setAprobadoCliente(orden.aprobado_cliente || false);
  }, [orden.aprobado_cliente]);

  // ID del técnico que cotiza (inicializado con el de la orden o null)
  const [tecnicoCotizaId, setTecnicoCotizaId] = useState<string>(orden.tecnico_cotiza || '');

  // Usuario automático (solo para mostrar nombre si no hay lista cargada aún)
  const [usuarioCotizacionNombre, setUsuarioCotizacionNombre] = React.useState('');

  React.useEffect(() => {
    const obtenerUsuarioActual = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          // Si no hay técnico asignado en la orden, asignar el usuario actual por defecto
          if (!orden.tecnico_cotiza && !tecnicoCotizaId) {
            setTecnicoCotizaId(authData.user.id);
          }

          // Obtener nombre para mostrar fallbacks
          if (!usuarioCotizacionNombre) {
            setUsuarioCotizacionNombre(authData.user.email || '');
          }
        }
      } catch (error) {
        console.error('Error al obtener usuario actual:', error);
      }
    };

    obtenerUsuarioActual();
  }, [orden.tecnico_cotiza, tecnicoCotizaId, usuarioCotizacionNombre]); // Added tecnicoCotizaId and usuarioCotizacionNombre to dependencies

  const [formData, setFormData] = useState({
    tipo: orden.cotizacion?.tipo || orden.tipo_orden || 'Reparación',
    comentarios: orden.comentarios_cotizacion || orden.cotizacion?.comentarios || '',
    tecnico_reparacion_id: orden.tecnico_repara || '',
    precio_envio: orden.precio_envio || 0
  });

  // Datos de aprobación de marca (para garantías)
  const [aprobacionMarca, setAprobacionMarca] = useState({
    estado_garantia: orden.aprobacion_marca?.estado_garantia || 'Aprobado',
    evaluador: orden.aprobacion_marca?.evaluador || '',
    fecha_pedido: orden.aprobacion_marca?.fecha_pedido || null,
    fecha_pago: orden.aprobacion_marca?.fecha_pago || null,
    comentarios_garantia: orden.aprobacion_marca?.comentarios_garantia || ''
  });

  // Sincronizar con cambios en la orden (cuando vuelves de otra fase)
  useEffect(() => {
    console.log('🔄 Sincronizando CotizacionForm con orden:', {
      tipo_orden: orden.tipo_orden,
      tecnico_repara: orden.tecnico_repara,
      precio_envio: orden.precio_envio,
      ultima_actualizacion: orden.ultima_actualizacion
    });

    setFormData({
      tipo: orden.cotizacion?.tipo || orden.tipo_orden || 'Reparación',
      comentarios: orden.comentarios_cotizacion || orden.cotizacion?.comentarios || '',
      tecnico_reparacion_id: orden.tecnico_repara || '',
      precio_envio: orden.precio_envio || 0
    });
  }, [orden.tipo_orden, orden.tecnico_repara, orden.precio_envio, orden.ultima_actualizacion, orden.comentarios_cotizacion]);

  // ============================================================================
  // FORCE FRESH DATA ON ORDER CHANGE (F5 refresh)
  // ============================================================================

  /**
   * Reset repuestosCargados flag when order ID changes
   * This ensures fresh data is loaded from database on every page refresh
   */
  useEffect(() => {
    console.log('🔄 Orden ID cambió, forzando recarga de repuestos desde BD');
    setRepuestosCargados(false);
    setRepuestos([]);
  }, [orden.id]);

  // Cargar repuestos
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [cargandoRepuestos, setCargandoRepuestos] = useState(false);
  const [repuestosCargados, setRepuestosCargados] = useState(false);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const comentariosTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [guardandoComentarios, setGuardandoComentarios] = React.useState(false);

  // Estado temporal para el input de precio de envío (mientras se edita)
  const [precioEnvioInput, setPrecioEnvioInput] = React.useState('');
  const [editandoPrecioEnvio, setEditandoPrecioEnvio] = React.useState(false);

  // Lista de técnicos (con caché)
  const [tecnicos, setTecnicos] = useState<any[]>(() => {
    // Cargar desde localStorage inmediatamente
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('tecnicos_lista');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  // Cargar lista de técnicos
  useEffect(() => {
    const cargarTecnicos = async () => {
      try {
        // Si ya hay técnicos en caché, no hacer petición
        const cached = localStorage.getItem('tecnicos_lista');
        if (cached) {
          console.log('📦 Técnicos cargados desde localStorage');
          return;
        }

        console.log('🌐 Cargando técnicos desde Supabase');
        const { supabase } = await import('@/lib/supabaseClient');

        // Buscar usuarios con rol 'tecnico' o 'super-admin'
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nombre, email')
          .in('rol', ['tecnico', 'super-admin'])
          .order('nombre');

        if (!error && data) {
          console.log('✅ Técnicos encontrados:', data.length);
          setTecnicos(data);
          localStorage.setItem('tecnicos_lista', JSON.stringify(data));
        } else if (error) {
          console.error('Error al cargar técnicos:', error);
        }
      } catch (error) {
        console.error('Error al cargar técnicos:', error);
      }
    };

    cargarTecnicos();
  }, []);

  // ============================================================================
  // CALCULATION FUNCTIONS - Using enterprise-grade pricing utilities
  // ============================================================================

  /**
   * Calculates totals for all spare parts
   * Uses pure functions from pricing.utils.ts
   * @pure - depends only on input parameters
   */
  const calcularTotalesConRepuestos = (repuestosArray: Repuesto[]): PriceTotals => {
    // Si es retrabajo, el total es 0
    if (orden.es_retrabajo) {
      return { subtotal: 0, iva: 0, total: 0, valor_revision: 0, precio_envio: 0 };
    }

    // Obtener valor de revisión de la orden (ya no del modelo)
    const valorRevision = orden.valor_revision || 0;

    // Precio de envío
    const precioEnvio = formData.precio_envio || 0;

    // Calculate final totals using pure utility functions
    return calculateFinalTotals(repuestosArray, precioEnvio, valorRevision);
  };

  // ============================================================================
  // LOAD SPARE PARTS - Always from database, no localStorage cache
  // ============================================================================

  /**
   * Loads spare parts from database in priority order:
   * 1. Saved quotation parts (repuestos_cotizacion table)
   * 2. Diagnosis parts (repuestos_diagnostico table)
   * 3. Model default parts (repuestos_modelo table)
   * 
   * NO localStorage cache to ensure multi-user synchronization
   */
  useEffect(() => {
    const cargarRepuestos = async () => {
      if (repuestosCargados) return;

      console.log('🔍 Cargando repuestos desde BD (sin caché)...');
      setCargandoRepuestos(true);

      try {
        // 1. Intentar cargar repuestos guardados de cotización (SIEMPRE desde BD)
        const repuestosCotizacion = await obtenerRepuestosCotizacion(orden.id);
        if (repuestosCotizacion && repuestosCotizacion.length > 0) {
          console.log('✅ Repuestos de cotización encontrados:', repuestosCotizacion.length);
          setRepuestos(repuestosCotizacion);
          setRepuestosCargados(true);
          return;
        }

        // 2. Cargar repuestos del diagnóstico
        const repuestosDiagnostico = await obtenerRepuestosDiagnostico(orden.id);
        if (repuestosDiagnostico && repuestosDiagnostico.length > 0) {
          console.log('✅ Repuestos de diagnóstico encontrados:', repuestosDiagnostico.length);
          const repuestosMapeados = repuestosDiagnostico.map((r: any) => ({
            codigo: r.codigo || '',
            descripcion: r.descripcion || '',
            cantidad: r.cantidad || 1,
            precio_unitario: 0,
            descuento: 0,
            iva: 0,
            en_stock: true
          }));
          setRepuestos(repuestosMapeados);
          // ⚠️ Solo guardar en BD si estamos en fase de cotización
          // Esto evita sobrescribir datos reales cuando se ve desde otras fases
          const enFaseCotizacion = orden.estado_actual === 'Cotización' ||
            orden.estado_actual === 'Esperando repuestos' ||
            orden.estado_actual === 'Esperando aceptación';
          if (enFaseCotizacion) {
            const totalesIniciales = calcularTotalesConRepuestos(repuestosMapeados);
            await guardarRepuestosCotizacion(orden.id, repuestosMapeados, totalesIniciales);
          }
          setRepuestosCargados(true);
          return;
        }

        // 3. Si no hay, cargar del modelo
        if (orden.equipo?.modelo_id) {
          console.log('🔍 Cargando repuestos del modelo');
          const repuestosModelo = await obtenerRepuestosDelModelo(orden.equipo.modelo_id);

          if (repuestosModelo && repuestosModelo.length > 0) {
            const repuestosMapeados = repuestosModelo.map((r: any) => ({
              codigo: r.codigo || '',
              descripcion: r.descripcion || '',
              cantidad: r.cantidad || 1,
              precio_unitario: 0,
              descuento: 0,
              iva: 0,
              en_stock: true
            }));
            setRepuestos(repuestosMapeados);
            // ⚠️ Solo guardar en BD si estamos en fase de cotización
            const enFaseCotizacion = orden.estado_actual === 'Cotización' ||
              orden.estado_actual === 'Esperando repuestos' ||
              orden.estado_actual === 'Esperando aceptación';
            if (enFaseCotizacion) {
              const totalesIniciales = calcularTotalesConRepuestos(repuestosMapeados);
              await guardarRepuestosCotizacion(orden.id, repuestosMapeados, totalesIniciales);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error al cargar repuestos:', error);
      } finally {
        setCargandoRepuestos(false);
        setRepuestosCargados(true);
      }
    };

    cargarRepuestos();
  }, [orden.id, orden.equipo?.modelo_id, repuestosCargados]);

  const estado = orden.estado_actual;
  const puedeEditarGeneral = (estado === 'Cotización' || estado === 'Esperando repuestos' || estado === 'Esperando aceptación') && faseIniciada;
  const bloqueadoPorAceptacion = estado === 'Esperando aceptación' || !!aprobadoCliente;
  const puedeEditarRepuestos = (estado === 'Cotización' || estado === 'Esperando repuestos') && !bloqueadoPorAceptacion && faseIniciada;
  const puedeEditarCamposCotizacion = (estado === 'Cotización' || estado === 'Esperando repuestos') && !aprobadoCliente && faseIniciada;

  // Note: formatCurrency, parseCurrency, and formatNumberWithCommas are now imported from pricing.utils.ts

  // ============================================================================
  // SAVE WITH DEBOUNCE - No localStorage, only database
  // ============================================================================

  /**
   * Saves spare parts to database with 5-second debounce
   * NO localStorage to ensure data consistency across users
   */
  const guardarConDebounce = (nuevosRepuestos: Repuesto[]) => {
    // Limpiar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Crear nuevo timeout de 5 segundos
    saveTimeoutRef.current = setTimeout(async () => {
      const totalesCalculados = calcularTotalesConRepuestos(nuevosRepuestos);
      await guardarRepuestosCotizacion(orden.id, nuevosRepuestos, totalesCalculados);
      console.log('💾 Repuestos guardados en BD (sin caché local)');
    }, 5000);
  };

  // Limpiar timeouts al desmontar
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (comentariosTimeoutRef.current) {
        clearTimeout(comentariosTimeoutRef.current);
      }
    };
  }, []);

  // Guardar comentarios con debounce de 3 segundos
  const guardarComentariosConDebounce = (comentarios: string) => {
    if (comentariosTimeoutRef.current) {
      clearTimeout(comentariosTimeoutRef.current);
    }

    comentariosTimeoutRef.current = setTimeout(async () => {
      try {
        setGuardandoComentarios(true);
        const { supabase } = await import('@/lib/supabaseClient');
        await supabase
          .from('ordenes')
          .update({
            comentarios_cotizacion: comentarios,
            ultima_actualizacion: new Date().toISOString()
          })
          .eq('id', orden.id);
        console.log('✅ Comentarios de cotización guardados automáticamente');
      } catch (error) {
        console.error('Error al guardar comentarios:', error);
      } finally {
        setGuardandoComentarios(false);
      }
    }, 3000);
  };

  // Guardar datos sin validaciones (solo para botón Guardar)
  React.useEffect(() => {
    // Agregar función al objeto orden para que pueda ser llamada desde page.tsx
    if (orden && typeof window !== 'undefined') {
      (window as any).guardarDatosCotizacion = async () => {
        try {
          // Cancelar cualquier debounce pendiente
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }

          const { supabase } = await import('@/lib/supabaseClient');

          // Guardar datos básicos de la orden (sin validaciones)
          const updateData: any = {
            tipo_orden: formData.tipo || 'Reparación',
            tecnico_repara: formData.tecnico_reparacion_id || null,
            tecnico_cotiza: tecnicoCotizaId || null,
            precio_envio: formData.precio_envio || 0,
            comentarios_cotizacion: formData.comentarios || '',
            total: calcularTotalesConRepuestos(repuestos).total,
            ultima_actualizacion: new Date().toISOString()
          };

          await supabase
            .from('ordenes')
            .update(updateData)
            .eq('id', orden.id);

          // Guardar repuestos inmediatamente en BD (sin caché)
          const totalesCalculados = calcularTotalesConRepuestos(repuestos);
          await guardarRepuestosCotizacion(orden.id, repuestos, totalesCalculados);

          // Actualizar localStorage de orden
          updateOrdenFields(updateData);

          console.log('✅ Datos de cotización guardados (sin validaciones):', updateData);
          console.log('✅ Repuestos guardados:', repuestos.length);

          return updateData;
        } catch (error) {
          console.error('Error al guardar datos de cotización:', error);
          throw error;
        }
      };
    }

  }, [formData, orden?.id, repuestos, tecnicoCotizaId]);

  const agregarRepuesto = () => {
    const nuevosRepuestos = [...repuestos, {
      codigo: '',
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      iva: 0,
      en_stock: true
    }];
    setRepuestos(nuevosRepuestos);
    guardarConDebounce(nuevosRepuestos);
  };

  const eliminarRepuesto = async (index: number) => {
    const nuevosRepuestos = repuestos.filter((_, i) => i !== index);
    setRepuestos(nuevosRepuestos);
    // Guardar inmediatamente al eliminar (sin caché)
    const totalesCalculados = calcularTotalesConRepuestos(nuevosRepuestos);
    await guardarRepuestosCotizacion(orden.id, nuevosRepuestos, totalesCalculados);
    console.log('🗑️ Repuesto eliminado y guardado en BD');
  };

  const actualizarRepuesto = async (index: number, campo: keyof Repuesto, valor: any) => {
    const nuevosRepuestos = [...repuestos];
    nuevosRepuestos[index] = { ...nuevosRepuestos[index], [campo]: valor };
    setRepuestos(nuevosRepuestos);

    // Si se modifica el campo en_stock, guardar inmediatamente y verificar estado
    if (campo === 'en_stock') {
      // Cancelar debounce si existe
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Guardar inmediatamente (sin caché)
      const totalesCalculados = calcularTotalesConRepuestos(nuevosRepuestos);
      await guardarRepuestosCotizacion(orden.id, nuevosRepuestos, totalesCalculados);
      console.log('📦 Stock actualizado y guardado en BD');
      // Verificar y actualizar estado
      await verificarYActualizarEstadoStock(nuevosRepuestos);
    } else {
      // Para otros campos, usar debounce
      guardarConDebounce(nuevosRepuestos);
    }
  };

  const verificarYActualizarEstadoStock = async (repuestosActuales: Repuesto[]) => {
    try {
      const todosEnStock = repuestosActuales.every(r => r.en_stock);
      const nuevoEstado = todosEnStock ? 'Cotización' : 'Esperando repuestos';
      const estadoAnterior = orden.estado_actual;

      // Solo actualizar si el estado es diferente al actual
      if (nuevoEstado !== estadoAnterior) {
        const { supabase } = await import('@/lib/supabaseClient');
        const now = new Date().toISOString();
        const camposActualizacion: any = {
          estado_actual: nuevoEstado,
          ultima_actualizacion: now
        };

        // Si cambia de Cotización a Esperando repuestos -> fecha_solicitud_repuestos
        if (estadoAnterior === 'Cotización' && nuevoEstado === 'Esperando repuestos') {
          camposActualizacion.fecha_solicitud_repuestos = now;
        }

        // Si cambia de Esperando repuestos a Cotización -> fecha_recepcion_repuestos
        if (estadoAnterior === 'Esperando repuestos' && nuevoEstado === 'Cotización') {
          camposActualizacion.fecha_recepcion_repuestos = now;
        }

        await supabase
          .from('ordenes')
          .update(camposActualizacion)
          .eq('id', orden.id);

        // Actualizar estado local para reflejar cambios inmediatamente
        orden.estado_actual = nuevoEstado;
        orden.ultima_actualizacion = now;
        if (camposActualizacion.fecha_solicitud_repuestos) {
          orden.fecha_solicitud_repuestos = now;
        }
        if (camposActualizacion.fecha_recepcion_repuestos) {
          orden.fecha_recepcion_repuestos = now;
        }

        toast.success(`Estado actualizado a: ${nuevoEstado}`);
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const calcularTotales = () => {
    return calcularTotalesConRepuestos(repuestos);
  };

  const handleMarcarEsperaRepuestos = async () => {
    setEsperandoRepuestos(true);
    try {
      // Guardar la cotización actual primero
      const cotizacionData = {
        tipo: formData.tipo,
        tecnico_cotiza: tecnicoCotizaId,
        comentarios: formData.comentarios,
        repuestos: repuestos,
        fecha_cotizacion: new Date().toISOString(),
        ...calcularTotales()
      };

      await actualizarCotizacion(orden.id, cotizacionData);

      // Marcar como esperando repuestos (no cambia la fase)
      await marcarEsperaRepuestos(orden.id);

      toast.success('Orden marcada como esperando repuestos');
      // No llamamos onSuccess() para evitar recargar la página
    } catch (error) {
      console.error('Error al marcar espera de repuestos:', error);
      toast.error(error instanceof Error ? error.message : 'Error al marcar espera de repuestos');
    } finally {
      setEsperandoRepuestos(false);
    }
  };

  const handleGuardar = async () => {
    setIsLoading(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const now = new Date().toISOString();

      // Preparar datos de actualización
      const updateData: any = {
        tipo_orden: formData.tipo,
        comentarios_cotizacion: formData.comentarios,
        total: calcularTotales().total,
        fecha_cotizacion: now,
        tecnico_cotiza: tecnicoCotizaId || null,
        tecnico_repara: formData.tecnico_reparacion_id || null,
        precio_envio: formData.precio_envio || 0,
        ultima_actualizacion: now
      };

      await supabase
        .from('ordenes')
        .update(updateData)
        .eq('id', orden.id);

      // Actualizar localStorage
      updateOrdenFields(updateData);

      toast.success('Datos de cotización guardados');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar cotización');
    } finally {
      setIsLoading(false);
    }
  };

  const totales = calcularTotales();

  const handleEnviarCotizacion = async () => {
    // Bloquear envío si la fase no ha sido iniciada
    if (!faseIniciada) {
      toast.error('Debe iniciar la fase de cotización antes de enviar al cliente');
      return;
    }

    setIsLoading(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const now = new Date().toISOString();

      console.log('📤 Actualizando orden ID:', orden.id);

      // Actualizar estado y envio_cotizacion
      const { data, error } = await supabase
        .from('ordenes')
        .update({
          estado_actual: 'Esperando aceptación',
          envio_cotizacion: true,
          ultima_actualizacion: now
        })
        .eq('id', orden.id)
        .select('id, estado_actual, envio_cotizacion, ultima_actualizacion')
        .single();

      if (error) {
        console.error('❌ Error al actualizar:', error);
        throw error;
      }

      console.log('✅ Actualización exitosa:', data);

      // Actualizar objeto local
      orden.estado_actual = 'Esperando aceptación';
      orden.envio_cotizacion = true;
      orden.ultima_actualizacion = now;

      updateOrdenFields({
        estado_actual: 'Esperando aceptación',
        envio_cotizacion: true,
        ultima_actualizacion: now
      });
      toast.success('Estado actualizado a "Esperando aceptación"');

      // Enviar notificaciones por email y WhatsApp
      const trackingUrl = process.env.NEXT_PUBLIC_TRACKING_URL || 'https://tscosta.com.co/';
      const cotizacionUrl = `${trackingUrl}estado-producto?codigo=${orden.codigo}`;

      try {
        // Email automático con notificación de cotización
        await notificarCambioFase(orden.id, 'Cotización');
      } catch (emailError) {
        console.error('⚠️ Error al enviar correo:', emailError);
      }

      try {
        // WhatsApp manual (abre ventana con mensaje de cotización)
        await notificarCotizacionWhatsApp(orden.id, cotizacionUrl, totales.total);
      } catch (whatsappError) {
        console.error('⚠️ Error al abrir WhatsApp:', whatsappError);
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error al enviar cotización:', error);
      toast.error(error instanceof Error ? error.message : 'Error al enviar cotización');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
            Cotización
          </h2>
          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
            {puedeEditarGeneral
              ? 'Complete la cotización para el cliente'
              : 'Cotización completada - Solo lectura'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => notificarCambioFaseWhatsApp(orden.id, 'Cotización')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm"
        >
          <MessageCircle className="w-5 h-5" />
          <span>WhatsApp</span>
        </button>
      </div>

      {!faseIniciada && (estado === 'Cotización' || estado === 'Esperando repuestos') && (
        <div className={`mb-6 p-4 rounded-lg border ${theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/20 border-amber-800'
          }`}>
          <p className={`text-sm font-medium ${theme === 'light' ? 'text-amber-800' : 'text-amber-300'
            }`}>
            ⚠️ Debe presionar "Iniciar Fase" para comenzar a trabajar en esta cotización.
          </p>
        </div>
      )}

      {!puedeEditarGeneral && faseIniciada && (
        <div className={`mb-6 p-4 rounded-lg border ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'
          }`}>
          <p className={`text-sm ${theme === 'light' ? 'text-blue-800' : 'text-blue-300'
            }`}>
            Esta cotización ya fue completada y la orden avanzó a la siguiente fase.
          </p>
        </div>
      )}

      {/* Mensaje de retrabajo */}
      {orden.es_retrabajo && (
        <div className={`mb-6 p-4 rounded-lg border ${theme === 'light' ? 'bg-orange-50 border-orange-200' : 'bg-orange-900/20 border-orange-800'
          }`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className={`text-sm font-medium ${theme === 'light' ? 'text-orange-800' : 'text-orange-300'
              }`}>
              Esta orden es un retrabajo. La cotización es sin costo (Total: $0).
            </p>
          </div>
        </div>
      )}

      {/* Mensaje de aprobación del cliente */}
      {aprobadoCliente && (
        <div className={`mb-6 p-6 rounded-lg border ${theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-800'
          }`}>
          <div className="flex items-start gap-3 mb-4">
            <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className={`text-base font-semibold mb-1 ${theme === 'light' ? 'text-green-800' : 'text-green-300'
                }`}>
                ✅ Cotización Aceptada por el Cliente
              </p>
              {orden.fecha_aprobacion && (
                <p className={`text-sm ${theme === 'light' ? 'text-green-700' : 'text-green-400'
                  }`}>
                  Fecha de aprobación: {formatearFechaColombiaLarga(orden.fecha_aprobacion)}
                </p>
              )}
              {estado === 'Esperando aceptación' && (
                <p className={`text-sm mt-2 ${theme === 'light' ? 'text-green-700' : 'text-green-400'
                  }`}>
                  Puede avanzar a la siguiente fase.
                </p>
              )}
            </div>
          </div>

          {/* Tabla de Factura - Cliente Aceptó */}
          <div className={`mt-4 rounded-lg border overflow-hidden ${theme === 'light' ? 'bg-white border-green-300' : 'bg-gray-800 border-green-700'
            }`}>
            <div className={`px-4 py-3 font-semibold ${theme === 'light' ? 'bg-green-100 text-green-900' : 'bg-green-900/40 text-green-200'
              }`}>
              💵 Factura a Cobrar
            </div>
            <div className="p-4">
              <table className="w-full">
                <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
                  }`}>
                  <tr>
                    <td className={`py-2 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>Subtotal (Repuestos y Servicios)</td>
                    <td className={`py-2 text-sm font-medium text-right ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>{formatCurrency(totales.subtotal)}</td>
                  </tr>
                  <tr>
                    <td className={`py-2 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>IVA</td>
                    <td className={`py-2 text-sm font-medium text-right ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>{formatCurrency(totales.iva)}</td>
                  </tr>
                  {totales.precio_envio > 0 && (
                    <tr>
                      <td className={`py-2 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>Precio de Envío</td>
                      <td className={`py-2 text-sm font-medium text-right ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                        }`}>{formatCurrency(totales.precio_envio)}</td>
                    </tr>
                  )}
                  <tr className={`border-t-2 ${theme === 'light' ? 'border-green-300' : 'border-green-700'
                    }`}>
                    <td className={`py-3 text-base font-bold ${theme === 'light' ? 'text-green-900' : 'text-green-200'
                      }`}>TOTAL A PAGAR</td>
                    <td className={`py-3 text-xl font-bold text-right ${theme === 'light' ? 'text-green-700' : 'text-green-400'
                      }`}>{formatCurrency(totales.total)}</td>
                  </tr>
                </tbody>
              </table>
              <p className={`text-xs mt-3 italic ${theme === 'light' ? 'text-green-700' : 'text-green-400'
                }`}>
                ✅ El valor de revisión NO se cobra porque el cliente aceptó la reparación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de rechazo del cliente */}
      {orden.aprobado_cliente === false && estado === 'Entrega' && (
        <div className={`mb-6 p-6 rounded-lg border ${theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-800'
          }`}>
          <div className="flex items-start gap-3 mb-4">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className={`text-base font-semibold mb-1 ${theme === 'light' ? 'text-red-800' : 'text-red-300'
                }`}>
                ❌ Cotización Rechazada por el Cliente
              </p>
              <p className={`text-sm ${theme === 'light' ? 'text-red-700' : 'text-red-400'
                }`}>
                El equipo será devuelto sin reparación.
              </p>
            </div>
          </div>

          {/* Tabla de Cobro - Cliente Rechazó */}
          {totales.valor_revision > 0 && (
            <div className={`mt-4 rounded-lg border overflow-hidden ${theme === 'light' ? 'bg-white border-red-300' : 'bg-gray-800 border-red-700'
              }`}>
              <div className={`px-4 py-3 font-semibold ${theme === 'light' ? 'bg-red-100 text-red-900' : 'bg-red-900/40 text-red-200'
                }`}>
                💵 Cobro por Revisión
              </div>
              <div className="p-4">
                <table className="w-full">
                  <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
                    }`}>
                    <tr>
                      <td className={`py-2 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>Valor de Revisión Técnica</td>
                      <td className={`py-2 text-sm font-medium text-right ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                        }`}>{formatCurrency(totales.valor_revision)}</td>
                    </tr>
                    <tr className={`border-t-2 ${theme === 'light' ? 'border-red-300' : 'border-red-700'
                      }`}>
                      <td className={`py-3 text-base font-bold ${theme === 'light' ? 'text-red-900' : 'text-red-200'
                        }`}>TOTAL A PAGAR</td>
                      <td className={`py-3 text-xl font-bold text-right ${theme === 'light' ? 'text-red-700' : 'text-red-400'
                        }`}>{formatCurrency(totales.valor_revision)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className={`text-xs mt-3 italic ${theme === 'light' ? 'text-red-700' : 'text-red-400'
                  }`}>
                  ⚠️ Solo se cobra el valor de revisión porque el cliente rechazó la reparación.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {/* Período de Cotización */}
        <div className={`rounded-lg border p-4 ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'
          }`}>
          <h3 className={`text-sm font-medium mb-3 ${theme === 'light' ? 'text-blue-900' : 'text-blue-300'
            }`}>
            Período de Cotización
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={`text-xs font-medium mb-1 ${theme === 'light' ? 'text-blue-700' : 'text-blue-400'
                }`}>
                Fecha de inicio
              </p>
              <p className={`text-sm ${theme === 'light' ? 'text-blue-900' : 'text-blue-200'
                }`}>
                {orden.fecha_cotizacion ? formatearFechaColombiaLarga(orden.fecha_cotizacion) : 'No registrada'}
              </p>
            </div>
            <div>
              <p className={`text-xs font-medium mb-1 ${theme === 'light' ? 'text-blue-700' : 'text-blue-400'
                }`}>
                Fecha de finalización
              </p>
              <p className={`text-sm ${theme === 'light' ? 'text-blue-900' : 'text-blue-200'
                }`}>
                {orden.fecha_aprobacion ? formatearFechaColombiaLarga(orden.fecha_aprobacion) : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>

        {/* Usuario que cotiza */}
        <div className={`rounded-lg border p-4 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
          }`}>
          <div className="flex items-center justify-between">
            <div className="w-full">
              <label className={`block text-xs font-medium mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                Usuario que cotiza
              </label>
              <select
                value={tecnicoCotizaId}
                onChange={(e) => setTecnicoCotizaId(e.target.value)}
                disabled={!puedeEditarGeneral}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-800 text-gray-100'
                  } disabled:opacity-50`}
              >
                <option value="">Seleccionar técnico...</option>
                {tecnicos.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.nombre || tech.email || 'Sin nombre'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tipo y Reemplazar equipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
              Tipo (establecido al crear la orden)
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              disabled
              className={`w-full px-4 py-2 border rounded-lg ${theme === 'light'
                ? 'border-gray-300 bg-gray-100 text-gray-600'
                : 'border-gray-600 bg-gray-800 text-gray-400'
                }`}
            >
              <option value="Reparación">Reparación</option>
              <option value="Mantenimiento">Mantenimiento</option>
            </select>
          </div>

        </div>

        {/* Tabla de Repuestos */}
        <div>
          <div className="mb-3">
            <label className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
              Repuestos y Servicios
            </label>
            {repuestos.length > 0 && (
              <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                {repuestos.length} repuesto(s) {cargandoRepuestos ? 'cargando...' : 'del diagnóstico'}
              </p>
            )}
          </div>

          {repuestos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={`w-full border rounded-lg ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'
                }`}>
                <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}>
                  <tr>
                    <th className={`px-3 py-2 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>Código</th>
                    <th className={`px-3 py-2 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>Descripción</th>
                    <th className={`px-3 py-2 text-center text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>Cant.</th>
                    <th className={`px-3 py-2 text-right text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>Precio unit</th>
                    <th className={`px-3 py-2 text-center text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>Dto.</th>
                    <th className={`px-3 py-2 text-center text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>IVA</th>
                    <th className={`px-3 py-2 text-right text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>Valor</th>
                    <th className={`px-3 py-2 text-center text-xs font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>En stock</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
                  }`}>
                  {repuestos.map((repuesto, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={repuesto.codigo}
                          readOnly
                          className={`w-24 px-2 py-1 border rounded text-sm ${theme === 'light'
                            ? 'border-gray-300 bg-blue-50 text-gray-900'
                            : 'border-gray-600 bg-blue-900/30 text-gray-100'
                            }`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={repuesto.descripcion}
                          readOnly
                          className={`w-full px-2 py-1 border rounded text-sm ${theme === 'light'
                            ? 'border-gray-300 bg-blue-50 text-gray-900'
                            : 'border-gray-600 bg-blue-900/30 text-gray-100'
                            }`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={repuesto.cantidad}
                          readOnly
                          className={`w-16 px-2 py-1 border rounded text-sm text-center ${theme === 'light'
                            ? 'border-gray-300 bg-blue-50 text-gray-900'
                            : 'border-gray-600 bg-blue-900/30 text-gray-100'
                            }`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={repuesto.precio_unitario === 0 ? '' : repuesto.precio_unitario}
                          onChange={(e) => {
                            const valor = parseCurrency(e.target.value);
                            actualizarRepuesto(index, 'precio_unitario', valor);
                          }}
                          disabled={!puedeEditarRepuestos}
                          className={`w-32 px-2 py-1 border rounded text-sm text-right ${theme === 'light'
                            ? 'border-gray-300 bg-white text-gray-900'
                            : 'border-gray-600 bg-gray-700 text-gray-100'
                            } disabled:opacity-50`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <PercentageInput
                          value={repuesto.descuento}
                          onChange={(valor) => actualizarRepuesto(index, 'descuento', valor)}
                          disabled={!puedeEditarRepuestos}
                          theme={theme}
                          className="w-24"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <PercentageInput
                          value={repuesto.iva}
                          onChange={(valor) => actualizarRepuesto(index, 'iva', valor)}
                          disabled={!puedeEditarRepuestos}
                          theme={theme}
                          className="w-24"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                          }`}>
                          {formatCurrency(calculateItemTotal(repuesto))}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={repuesto.en_stock}
                          onChange={(e) => actualizarRepuesto(index, 'en_stock', e.target.checked)}
                          disabled={!puedeEditarRepuestos}
                          className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales horizontales */}
              <div className={`mt-4 p-4 rounded-lg border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
                }`}>
                <div className="flex items-center justify-end gap-8">
                  <div className="text-right">
                    <p className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                      Subtotal Repuestos
                    </p>
                    <p className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>
                      {formatCurrency(totales.subtotal)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                      IVA
                    </p>
                    <p className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>
                      {formatCurrency(totales.iva)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`text-xs font-medium mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                      Precio de Envío
                    </p>
                    <input
                      type="text"
                      value={editandoPrecioEnvio ? precioEnvioInput : (formData.precio_envio === 0 ? '' : formatCurrency(formData.precio_envio))}
                      onFocus={() => {
                        setEditandoPrecioEnvio(true);
                        setPrecioEnvioInput(formData.precio_envio === 0 ? '' : formData.precio_envio.toString());
                      }}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Permitir solo números
                        const cleaned = inputValue.replace(/[^0-9]/g, '');
                        setPrecioEnvioInput(cleaned);
                      }}
                      onBlur={() => {
                        const valor = precioEnvioInput === '' ? 0 : Number(precioEnvioInput);
                        setFormData({ ...formData, precio_envio: valor });
                        setEditandoPrecioEnvio(false);
                        setPrecioEnvioInput('');
                      }}
                      disabled={!puedeEditarCamposCotizacion}
                      placeholder="$0"
                      className={`w-32 px-2 py-1 border rounded text-sm text-right ${theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                        } disabled:opacity-50`}
                    />
                  </div>

                  <div className="text-right">
                    <p className={`text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                      Total a Cobrar
                    </p>
                    <p className={`text-2xl font-bold ${theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'
                      }`}>
                      {formatCurrency(totales.total)}
                    </p>
                  </div>
                </div>

                {/* Nota sobre valor de revisión */}
                {totales.valor_revision > 0 && (
                  <div className={`mt-3 pt-3 border-t ${theme === 'light' ? 'border-gray-300' : 'border-gray-600'
                    }`}>
                    <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                      📌 <strong>Valor de Revisión:</strong> {formatCurrency(totales.valor_revision)} - Solo se cobra si el cliente <strong>rechaza</strong> la cotización.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`p-4 text-center border-2 border-dashed rounded-lg ${theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-700'
              }`}>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                No hay repuestos agregados
              </p>
            </div>
          )}
        </div>

        {/* Comentarios */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
            Comentarios de cotización
          </label>
          <div className="relative">
            <textarea
              name="comentarios"
              value={formData.comentarios}
              onChange={(e) => {
                setFormData({ ...formData, comentarios: e.target.value });
                if (puedeEditarCamposCotizacion) {
                  guardarComentariosConDebounce(e.target.value);
                }
              }}
              rows={4}
              placeholder="Notas adicionales sobre la cotización..."
              disabled={!puedeEditarCamposCotizacion}
              spellCheck={true}
              lang="es"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                ? 'border-gray-300 bg-white text-gray-900'
                : 'border-gray-600 bg-gray-700 text-gray-100'
                } disabled:opacity-50 disabled:text-black`}
            />
            {guardandoComentarios && (
              <span className={`absolute bottom-2 right-2 text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                Guardando...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Acción: Enviar cotización (cambia estado_actual a "Esperando aceptación") */}
      {(estado === 'Cotización' || estado === 'Esperando repuestos') && !aprobadoCliente && !orden.envio_cotizacion && (
        <div className={`mt-6 p-4 rounded-lg border ${theme === 'light' ? 'bg-purple-50 border-purple-200' : 'bg-purple-900/20 border-purple-800'
          }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className={`text-sm font-medium mb-1 ${theme === 'light' ? 'text-purple-900' : 'text-purple-300'
                }`}>
                Enviar cotización al cliente
              </h3>
              <p className={`text-xs ${theme === 'light' ? 'text-purple-700' : 'text-purple-400'
                }`}>
                Esto actualizará el estado a "Esperando aceptación" mientras el cliente responde.
              </p>
            </div>
            <button
              onClick={handleEnviarCotizacion}
              disabled={isLoading || !faseIniciada}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${theme === 'light'
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <span>✉️</span>
                  <span>Enviar cotización</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

