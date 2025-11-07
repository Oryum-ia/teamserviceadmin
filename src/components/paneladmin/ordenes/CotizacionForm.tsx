"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Loader2, MessageCircle } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { updateOrdenFields } from '@/lib/ordenLocalStorage';
import { actualizarCotizacion, marcarEsperaRepuestos } from '@/lib/services/ordenService';
import { notificarCotizacionWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';
import { notificarCambioFase } from '@/lib/services/emailNotificationService';
import { obtenerRepuestosDelModelo, obtenerRepuestosDiagnostico, guardarRepuestosCotizacion, obtenerRepuestosCotizacion } from '@/lib/services/repuestoService';

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
}

export default function CotizacionForm({ orden, onSuccess }: CotizacionFormProps) {
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

  // Usuario automático (con caché)
  const [usuarioCotizacion, setUsuarioCotizacion] = React.useState(() => {
    // Intentar cargar desde localStorage inmediatamente
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('usuario_actual_nombre');
      if (cached) return cached;
    }
    return 'Cargando...';
  });

  React.useEffect(() => {
    const obtenerUsuarioActual = async () => {
      try {
        // Verificar si ya está en localStorage
        const cached = localStorage.getItem('usuario_actual_nombre');
        if (cached && cached !== 'Cargando...') {
          setUsuarioCotizacion(cached);
          return;
        }
        
        const { supabase } = await import('@/lib/supabaseClient');
        
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) return;
        
        const userId = authData.user.id;
        
        // Buscar el nombre en la tabla usuarios
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('nombre, email')
          .eq('id', userId)
          .single();
        
        let nombreUsuario;
        if (userError) {
          nombreUsuario = authData.user.email || 'Usuario no identificado';
        } else {
          nombreUsuario = userData?.nombre || userData?.email || authData.user.email || 'Usuario no identificado';
        }
        
        // Guardar en caché
        localStorage.setItem('usuario_actual_nombre', nombreUsuario);
        setUsuarioCotizacion(nombreUsuario);
      } catch (error) {
        setUsuarioCotizacion('Usuario no identificado');
      }
    };
    
    obtenerUsuarioActual();
  }, []);

  const [formData, setFormData] = useState({
    tipo: orden.cotizacion?.tipo || orden.tipo_orden || 'Reparación',
    comentarios: orden.cotizacion?.comentarios || '',
    reemplazar_equipo: orden.cotizacion?.reemplazar_equipo || false,
    tecnico_reparacion_id: orden.tecnico_repara || ''
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
      ultima_actualizacion: orden.ultima_actualizacion
    });
    
    setFormData({
      tipo: orden.cotizacion?.tipo || orden.tipo_orden || 'Reparación',
      comentarios: orden.cotizacion?.comentarios || '',
      reemplazar_equipo: orden.cotizacion?.reemplazar_equipo || false,
      tecnico_reparacion_id: orden.tecnico_repara || ''
    });
  }, [orden.tipo_orden, orden.tecnico_repara, orden.ultima_actualizacion]);

  // Cargar repuestos
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [cargandoRepuestos, setCargandoRepuestos] = useState(false);
  const [repuestosCargados, setRepuestosCargados] = useState(false);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
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
        
        // Buscar usuarios con rol 'tecnico'
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nombre, email')
          .eq('rol', 'tecnico')
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

  // Funciones de cálculo (definidas antes para poder usarlas en useEffect)
  const calcularSubtotalRepuesto = (repuesto: Repuesto): number => {
    const subtotal = repuesto.cantidad * repuesto.precio_unitario;
    const conDescuento = subtotal - (subtotal * repuesto.descuento / 100);
    return conDescuento;
  };

  const calcularIvaRepuesto = (repuesto: Repuesto): number => {
    const subtotal = calcularSubtotalRepuesto(repuesto);
    return subtotal * repuesto.iva / 100;
  };

  const calcularTotalRepuesto = (repuesto: Repuesto): number => {
    return calcularSubtotalRepuesto(repuesto) + calcularIvaRepuesto(repuesto);
  };

  const calcularTotalesConRepuestos = (repuestosArray: Repuesto[]) => {
    // Si es retrabajo, el total es 0
    if (orden.es_retrabajo) {
      return { subtotal: 0, iva: 0, total: 0, valor_revision: 0 };
    }
    
    // Obtener valor de revisión del modelo
    const valorRevision = orden.equipo?.modelo?.valor_revision || 0;
    
    // Calcular subtotal de repuestos
    const subtotalRepuestos = repuestosArray.reduce((acc, r) => acc + calcularSubtotalRepuesto(r), 0);
    
    // Subtotal total = repuestos + valor revisión
    const subtotal = subtotalRepuestos + valorRevision;
    
    // IVA solo sobre repuestos (no sobre valor_revision)
    const iva = repuestosArray.reduce((acc, r) => acc + calcularIvaRepuesto(r), 0);
    
    const total = subtotal + iva;
    
    return { subtotal, iva, total, valor_revision: valorRevision };
  };

  // Cargar repuestos: primero de localStorage, luego de cotización, luego de diagnóstico
  useEffect(() => {
    const cargarRepuestos = async () => {
      if (repuestosCargados) return;

      console.log('🔍 Cargando repuestos para cotización...');
      setCargandoRepuestos(true);
      
      try {
        // 0. Intentar cargar desde localStorage primero
        const cacheKey = `repuestos_cotizacion_${orden.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const repuestosCache = JSON.parse(cached);
            console.log('📦 Repuestos cargados desde localStorage:', repuestosCache.length);
            setRepuestos(repuestosCache);
            setRepuestosCargados(true);
            setCargandoRepuestos(false);
            return;
          } catch (e) {
            console.warn('⚠️ Error parseando caché de repuestos');
          }
        }
        
        // 1. Intentar cargar repuestos guardados de cotización
        const repuestosCotizacion = await obtenerRepuestosCotizacion(orden.id);
        if (repuestosCotizacion && repuestosCotizacion.length > 0) {
          console.log('✅ Repuestos de cotización encontrados:', repuestosCotizacion.length);
          setRepuestos(repuestosCotizacion);
          localStorage.setItem(cacheKey, JSON.stringify(repuestosCotizacion));
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
          localStorage.setItem(cacheKey, JSON.stringify(repuestosMapeados));
          // Guardar inmediatamente en cotización con totales
          const totalesIniciales = calcularTotalesConRepuestos(repuestosMapeados);
          await guardarRepuestosCotizacion(orden.id, repuestosMapeados, totalesIniciales);
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
            localStorage.setItem(cacheKey, JSON.stringify(repuestosMapeados));
            const totalesIniciales = calcularTotalesConRepuestos(repuestosMapeados);
            await guardarRepuestosCotizacion(orden.id, repuestosMapeados, totalesIniciales);
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
  const puedeEditarGeneral = estado === 'Cotización' || estado === 'Esperando repuestos' || estado === 'Esperando aceptación';
  const bloqueadoPorAceptacion = estado === 'Esperando aceptación' || !!aprobadoCliente;
  const puedeEditarRepuestos = (estado === 'Cotización' || estado === 'Esperando repuestos') && !bloqueadoPorAceptacion;
  const puedeEditarCamposCotizacion = (estado === 'Cotización' || estado === 'Esperando repuestos') && !aprobadoCliente;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const parseCurrency = (value: string): number => {
    // Remover todo excepto números, puntos y guiones
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    // Si está vacío, devolver 0
    if (!cleaned || cleaned === '-' || cleaned === '.') {
      return 0;
    }
    // Convertir a número usando Number() que maneja mejor números grandes
    const num = Number(cleaned);
    // Si no es un número finito válido, devolver 0
    return isFinite(num) ? num : 0;
  };

  const formatPercent = (value: number): string => {
    return `%${value.toFixed(2).replace(/\.00$/, '')}`;
  };

  const parsePercent = (value: string): number => {
    // Remover todo excepto números, puntos y guiones
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    // Si está vacío, devolver 0
    if (!cleaned || cleaned === '-' || cleaned === '.') {
      return 0;
    }
    // Convertir a número
    const num = Number(cleaned);
    // Si no es un número finito válido, devolver 0
    // No limitar entre 0-100 para permitir cualquier porcentaje
    return isFinite(num) ? num : 0;
  };

  const formatNumberWithCommas = (value: number): string => {
    if (!Number.isFinite(value)) return '';
    return value.toLocaleString('es-CO');
  };

  // Guardar con debounce optimizado
  const guardarConDebounce = (nuevosRepuestos: Repuesto[]) => {
    // Limpiar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Crear nuevo timeout de 5 segundos
    saveTimeoutRef.current = setTimeout(async () => {
      // Calcular totales con los nuevos repuestos
      const totalesCalculados = calcularTotalesConRepuestos(nuevosRepuestos);
      await guardarRepuestosCotizacion(orden.id, nuevosRepuestos, totalesCalculados);
      // Actualizar caché
      const cacheKey = `repuestos_cotizacion_${orden.id}`;
      localStorage.setItem(cacheKey, JSON.stringify(nuevosRepuestos));
    }, 5000);
  };

  // Limpiar timeout al desmontar
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Guardar datos al avanzar de fase (exponer función para que sea llamada desde el botón avanzar)
  React.useEffect(() => {
    // Agregar función al objeto orden para que pueda ser llamada desde page.tsx
    if (orden && typeof window !== 'undefined') {
      (window as any).guardarDatosCotizacion = async () => {
        const { supabase } = await import('@/lib/supabaseClient');
        
        const updateData: any = {
          tipo_orden: formData.tipo,
          tecnico_repara: formData.tecnico_reparacion_id || null,
          ultima_actualizacion: new Date().toISOString()
        };
        
        await supabase
          .from('ordenes')
          .update(updateData)
          .eq('id', orden.id);
        
        // Actualizar localStorage
        updateOrdenFields(updateData);
        
        console.log('✅ Datos de cotización guardados:', updateData);
        
        return updateData;
      };
    }
  }, [formData, aprobacionMarca, orden?.id]);

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
    // Guardar inmediatamente al eliminar
    const totalesCalculados = calcularTotalesConRepuestos(nuevosRepuestos);
    await guardarRepuestosCotizacion(orden.id, nuevosRepuestos, totalesCalculados);
    // Actualizar caché
    const cacheKey = `repuestos_cotizacion_${orden.id}`;
    localStorage.setItem(cacheKey, JSON.stringify(nuevosRepuestos));
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
      // Guardar inmediatamente
      const totalesCalculados = calcularTotalesConRepuestos(nuevosRepuestos);
      await guardarRepuestosCotizacion(orden.id, nuevosRepuestos, totalesCalculados);
      // Actualizar caché
      const cacheKey = `repuestos_cotizacion_${orden.id}`;
      localStorage.setItem(cacheKey, JSON.stringify(nuevosRepuestos));
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
        usuario_cotizacion: usuarioCotizacion,
        comentarios: formData.comentarios,
        reemplazar_equipo: formData.reemplazar_equipo,
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
        tecnico_repara: formData.tecnico_reparacion_id || null,
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
      const trackingUrl = process.env.NEXT_PUBLIC_TRACKING_URL || 'https://gleeful-mochi-2bc33c.netlify.app/';
      const cotizacionUrl = `${trackingUrl}?orden=${orden.codigo}`;
      
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
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Cotización
        </h2>
        <p className={`text-sm ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {puedeEditarGeneral 
            ? 'Complete la cotización para el cliente'
            : 'Cotización completada - Solo lectura'}
        </p>
      </div>

      {!puedeEditarGeneral && (
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'
        }`}>
          <p className={`text-sm ${
            theme === 'light' ? 'text-blue-800' : 'text-blue-300'
          }`}>
            Esta cotización ya fue completada y la orden avanzó a la siguiente fase.
          </p>
        </div>
      )}

      {/* Mensaje de retrabajo */}
      {orden.es_retrabajo && (
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'light' ? 'bg-orange-50 border-orange-200' : 'bg-orange-900/20 border-orange-800'
        }`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className={`text-sm font-medium ${
              theme === 'light' ? 'text-orange-800' : 'text-orange-300'
            }`}>
              Esta orden es un retrabajo. La cotización es sin costo (Total: $0).
            </p>
          </div>
        </div>
      )}

      {/* Mensaje de aprobación del cliente */}
      {aprobadoCliente && estado === 'Esperando aceptación' && (
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-800'
        }`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-sm font-medium ${
              theme === 'light' ? 'text-green-800' : 'text-green-300'
            }`}>
              ¡El cliente ha aprobado la cotización! Puede avanzar a la siguiente fase.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Período de Cotización */}
        <div className={`rounded-lg border p-4 ${
          theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'
        }`}>
          <h3 className={`text-sm font-medium mb-3 ${
            theme === 'light' ? 'text-blue-900' : 'text-blue-300'
          }`}>
            Período de Cotización
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={`text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-blue-700' : 'text-blue-400'
              }`}>
                Fecha de inicio
              </p>
              <p className={`text-sm ${
                theme === 'light' ? 'text-blue-900' : 'text-blue-200'
              }`}>
                {orden.fecha_cotizacion ? new Date(orden.fecha_cotizacion).toLocaleString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'No registrada'}
              </p>
            </div>
            <div>
              <p className={`text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-blue-700' : 'text-blue-400'
              }`}>
                Fecha de finalización
              </p>
              <p className={`text-sm ${
                theme === 'light' ? 'text-blue-900' : 'text-blue-200'
              }`}>
                {orden.fecha_aprobacion ? new Date(orden.fecha_aprobacion).toLocaleString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'En proceso'}
              </p>
            </div>
          </div>
        </div>

        {/* Usuario que cotiza */}
        <div className={`rounded-lg border p-4 ${
          theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium mb-1 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Usuario que cotiza
              </p>
              <p className={`text-sm font-medium ${
                theme === 'light' ? 'text-gray-900' : 'text-gray-200'
              }`}>
                {usuarioCotizacion || 'Cargando...'}
              </p>
            </div>
          </div>
        </div>

        {/* Tipo y Reemplazar equipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Tipo (establecido al crear la orden)
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              disabled
              className={`w-full px-4 py-2 border rounded-lg ${
                theme === 'light'
                  ? 'border-gray-300 bg-gray-100 text-gray-600'
                  : 'border-gray-600 bg-gray-800 text-gray-400'
              }`}
            >
              <option value="Reparación">Reparación</option>
              <option value="Mantenimiento">Mantenimiento</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="reemplazar_equipo"
              checked={formData.reemplazar_equipo}
              onChange={(e) => setFormData({ ...formData, reemplazar_equipo: e.target.checked })}
            disabled={!puedeEditarCamposCotizacion}
            className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500 disabled:opacity-50"
            />
            <label
              htmlFor="reemplazar_equipo"
              className={`ml-2 text-sm ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}
            >
              Reemplazar equipo
            </label>
          </div>
        </div>

        {/* Tabla de Repuestos */}
        <div>
          <div className="mb-3">
            <label className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Repuestos y Servicios
            </label>
            {repuestos.length > 0 && (
              <p className={`text-xs mt-1 ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {repuestos.length} repuesto(s) {cargandoRepuestos ? 'cargando...' : 'del diagnóstico'}
              </p>
            )}
          </div>
          
          {repuestos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={`w-full border rounded-lg ${
                theme === 'light' ? 'border-gray-200' : 'border-gray-700'
              }`}>
                <thead className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}>
                  <tr>
                    <th className={`px-3 py-2 text-left text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>Código</th>
                    <th className={`px-3 py-2 text-left text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>Descripción</th>
                    <th className={`px-3 py-2 text-center text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>Cant.</th>
                    <th className={`px-3 py-2 text-right text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>Precio unit</th>
                    <th className={`px-3 py-2 text-center text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>Dto.</th>
                    <th className={`px-3 py-2 text-center text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>IVA</th>
                    <th className={`px-3 py-2 text-right text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>Valor</th>
                    <th className={`px-3 py-2 text-center text-xs font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}>En stock</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
                }`}>
                  {repuestos.map((repuesto, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={repuesto.codigo}
                          readOnly
                          className={`w-24 px-2 py-1 border rounded text-sm ${
                            theme === 'light'
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
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            theme === 'light'
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
                          className={`w-16 px-2 py-1 border rounded text-sm text-center ${
                            theme === 'light'
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
                          className={`w-32 px-2 py-1 border rounded text-sm text-right ${
                            theme === 'light'
                              ? 'border-gray-300 bg-white text-gray-900'
                              : 'border-gray-600 bg-gray-700 text-gray-100'
                          } disabled:opacity-50`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={repuesto.descuento === 0 ? '' : `${formatNumberWithCommas(repuesto.descuento)}%`}
                          onChange={(e) => {
                            const valor = parsePercent(e.target.value);
                            actualizarRepuesto(index, 'descuento', valor);
                          }}
                          disabled={!puedeEditarRepuestos}
                          className={`w-24 px-2 py-1 border rounded text-sm text-center ${
                            theme === 'light'
                              ? 'border-gray-300 bg-white text-gray-900'
                              : 'border-gray-600 bg-gray-700 text-gray-100'
                          } disabled:opacity-50`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={repuesto.iva === 0 ? '' : `${formatNumberWithCommas(repuesto.iva)}%`}
                          onChange={(e) => {
                            const valor = parsePercent(e.target.value);
                            actualizarRepuesto(index, 'iva', valor);
                          }}
                          disabled={!puedeEditarRepuestos}
                          className={`w-24 px-2 py-1 border rounded text-sm text-center ${
                            theme === 'light'
                              ? 'border-gray-300 bg-white text-gray-900'
                              : 'border-gray-600 bg-gray-700 text-gray-100'
                          } disabled:opacity-50`}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={`text-sm font-medium ${
                          theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                        }`}>
                          {formatCurrency(calcularTotalRepuesto(repuesto))}
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
              <div className={`mt-4 p-4 rounded-lg border ${
                theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
              }`}>
                <div className="flex items-center justify-end gap-8">
                  {totales.valor_revision > 0 && (
                    <div className="text-right">
                      <p className={`text-xs font-medium ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        Valor Revisión
                      </p>
                      <p className={`text-lg font-bold ${
                        theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                      }`}>
                        {formatCurrency(totales.valor_revision)}
                      </p>
                    </div>
                  )}
                  
                  <div className="text-right">
                    <p className={`text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      Subtotal
                    </p>
                    <p className={`text-lg font-bold ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {formatCurrency(totales.subtotal)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      IVA
                    </p>
                    <p className={`text-lg font-bold ${
                      theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                    }`}>
                      {formatCurrency(totales.iva)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      Total
                    </p>
                    <p className={`text-2xl font-bold ${
                      theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'
                    }`}>
                      {formatCurrency(totales.total)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-4 text-center border-2 border-dashed rounded-lg ${
              theme === 'light' ? 'border-gray-300 bg-gray-50' : 'border-gray-600 bg-gray-700'
            }`}>
              <p className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                No hay repuestos agregados
              </p>
            </div>
          )}
        </div>

        {/* Comentarios */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Comentarios de cotización
          </label>
          <textarea
            name="comentarios"
            value={formData.comentarios}
            onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
            rows={4}
            placeholder="Notas adicionales sobre la cotización..."
            disabled={!puedeEditarCamposCotizacion}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              theme === 'light'
                ? 'border-gray-300 bg-white text-gray-900'
                : 'border-gray-600 bg-gray-700 text-gray-100'
            } disabled:opacity-50 disabled:text-black`}
          />
        </div>


        {/* Alistamiento para reparación */}
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-800'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'light' ? 'text-green-900' : 'text-green-300'
          }`}>
            Alistamiento para reparación
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Fecha de solicitud de repuestos *
              </label>
              <input
                type="text"
                value={orden.fecha_solicitud_repuestos ? new Date(orden.fecha_solicitud_repuestos).toLocaleString('es-CO', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : ''}
                disabled
                className={`w-full px-4 py-2 border rounded-lg ${
                  theme === 'light'
                    ? 'border-gray-300 bg-gray-100 text-gray-600'
                    : 'border-gray-600 bg-gray-800 text-gray-400'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Fecha de recepción de repuestos
              </label>
              <input
                type="text"
                value={orden.fecha_recepcion_repuestos ? new Date(orden.fecha_recepcion_repuestos).toLocaleString('es-CO', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : ''}
                disabled
                className={`w-full px-4 py-2 border rounded-lg ${
                  theme === 'light'
                    ? 'border-gray-300 bg-gray-100 text-gray-600'
                    : 'border-gray-600 bg-gray-800 text-gray-400'
                }`}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Usuario que repara *
            </label>
            <select
              value={formData.tecnico_reparacion_id}
              onChange={(e) => setFormData({ ...formData, tecnico_reparacion_id: e.target.value })}
              disabled={!puedeEditarCamposCotizacion}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
              } disabled:opacity-50 disabled:text-black`}
            >
              <option value="">Seleccionar técnico...</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nombre || tecnico.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Acción: Enviar cotización (cambia estado_actual a "Esperando aceptación") */}
      {(estado === 'Cotización' || estado === 'Esperando repuestos') && !aprobadoCliente && !orden.envio_cotizacion && (
        <div className={`mt-6 p-4 rounded-lg border ${
          theme === 'light' ? 'bg-purple-50 border-purple-200' : 'bg-purple-900/20 border-purple-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className={`text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-purple-900' : 'text-purple-300'
              }`}>
                Enviar cotización al cliente
              </h3>
              <p className={`text-xs ${
                theme === 'light' ? 'text-purple-700' : 'text-purple-400'
              }`}>
                Esto actualizará el estado a "Esperando aceptación" mientras el cliente responde.
              </p>
            </div>
            <button
              onClick={handleEnviarCotizacion}
              disabled={isLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                theme === 'light'
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
