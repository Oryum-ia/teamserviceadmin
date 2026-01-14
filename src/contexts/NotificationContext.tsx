"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Notification, NotificationContextType } from '../types/notifications';
import { supabase } from '../lib/supabaseClient';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Parsear datos adicionales según el tipo de notificación
  const parseNotificationData = useCallback((tipo: string, datosAdicionales: any) => {
    if (!datosAdicionales) return undefined;

    switch (tipo) {
      case 'pqr_nuevo':
        return {
          pqrInfo: {
            pqrId: datosAdicionales.pqr_id || '',
            radicado: datosAdicionales.radicado || '',
            tipoSolicitud: datosAdicionales.tipo_solicitud || '',
            prioridad: datosAdicionales.prioridad || '',
            email: datosAdicionales.email || '',
            telefono: datosAdicionales.telefono || '',
            ciudad: datosAdicionales.ciudad || '',
            asunto: datosAdicionales.asunto || '',
          },
        };
      case 'encuesta_nueva':
        return {
          encuestaInfo: {
            encuestaId: datosAdicionales.encuesta_id || '',
            nombre: datosAdicionales.nombre || '',
            email: datosAdicionales.email || '',
            sede: datosAdicionales.sede || '',
            promedio: parseFloat(datosAdicionales.promedio) || 0,
            nps: parseInt(datosAdicionales.nps) || 0,
            atencion: parseInt(datosAdicionales.atencion) || 0,
            calidad: parseInt(datosAdicionales.calidad) || 0,
            tiempo: parseInt(datosAdicionales.tiempo) || 0,
            productos: parseInt(datosAdicionales.productos) || 0,
            satisfaccion: parseInt(datosAdicionales.satisfaccion) || 0,
            comentarios: datosAdicionales.comentarios,
          },
        };
      case 'cotizacion_aceptada':
      case 'cotizacion_rechazada':
        return {
          cotizacionInfo: {
            ordenId: datosAdicionales.orden_id || '',
            numeroOrden: datosAdicionales.numero_orden || '',
            clienteNombre: datosAdicionales.cliente_nombre || '',
            total: parseFloat(datosAdicionales.total) || 0,
            faseActual: datosAdicionales.fase_actual || '',
          },
        };
      case 'terminos_aceptados':
        return {
          orderInfo: {
            orderId: datosAdicionales.orden_id || '',
            orderNumber: datosAdicionales.numero_orden || '',
            status: 'pending',
            date: new Date(),
            description: `Términos aceptados por ${datosAdicionales.cliente_nombre || 'Cliente'}`
          },
          customerInfo: {
            customerId: '',
            name: datosAdicionales.cliente_nombre || '',
          }
        };
      case 'diagnostico_completado':
      case 'reparacion_completada':
        return {
          orderInfo: {
            orderId: datosAdicionales.orden_id || '',
            orderNumber: datosAdicionales.numero_orden || '',
            status: 'completed',
            date: new Date(),
            description: datosAdicionales.tecnico_nombre 
              ? `Completado por ${datosAdicionales.tecnico_nombre}`
              : 'Completado'
          },
          customerInfo: {
            customerId: '',
            name: datosAdicionales.cliente_nombre || '',
          }
        };
      default:
        return undefined;
    }
  }, []);

  const mapSupabaseNotification = useCallback((record: any): Notification => ({
    id: record.id,
    type: record.tipo,
    title: record.titulo,
    message: record.mensaje,
    timestamp: new Date(record.created_at),
    isRead: record.leida,
    referenciaId: record.referencia_id,
    referenciaTipo: record.referencia_tipo,
    data: parseNotificationData(record.tipo, record.datos_adicionales),
  }), [parseNotificationData]);

  // Cargar notificaciones desde Supabase
  const loadNotifications = useCallback(async () => {
    try {
      const { data: notificaciones, error } = await supabase
        .from('notificaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (notificaciones) {
        const mappedNotifications: Notification[] = notificaciones.map(mapSupabaseNotification);

        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mapSupabaseNotification]);

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    loadNotifications();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('notificaciones_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
        },
        (payload) => {
          const newNotification = mapSupabaseNotification(payload.new as any);
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificaciones',
        },
        (payload) => {
          const updatedNotification = mapSupabaseNotification(payload.new as any);
          setNotifications((prev) => {
            const exists = prev.some((notif) => notif.id === updatedNotification.id);
            if (!exists) {
              return [updatedNotification, ...prev];
            }

            return prev.map((notif) =>
              notif.id === updatedNotification.id ? updatedNotification : notif
            );
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notificaciones',
        },
        (payload) => {
          const deletedId = (payload.old as any)?.id;
          if (!deletedId) return;
          setNotifications((prev) => prev.filter((notif) => notif.id !== deletedId));
        }
      )
      .subscribe();

    // Suscribirse a cambios en ordenes para detectar eventos críticos (Términos y Rechazos)
    // NOTA: Las notificaciones se crean via triggers en Supabase, aquí solo logueamos para debug
    const ordenesChannel = supabase
      .channel('ordenes_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ordenes',
        },
        (payload) => {
          const newItem = payload.new as any;
          const oldItem = payload.old as any;

          // 1. Detectar términos aceptados (la notificación se crea via trigger en Supabase)
          if (newItem.terminos_aceptados === true && oldItem.terminos_aceptados !== true) {
            console.log('🔔 Términos aceptados detectados en realtime - orden:', newItem.codigo);
            // La notificación se insertará en la tabla por el trigger y llegará via el canal de notificaciones
          }

          // 2. Detectar rechazo de cotización (la notificación se crea via trigger en Supabase)
          if (newItem.aprobado_cliente === false && oldItem.aprobado_cliente !== false) {
            console.log('🔔 Rechazo de cotización detectado en realtime - orden:', newItem.codigo);
            // La notificación se insertará en la tabla por el trigger y llegará via el canal de notificaciones
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(ordenesChannel);
    };
  }, [loadNotifications, mapSupabaseNotification]);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    // Auto-remove notification if duration is specified
    if (newNotification.duration) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  // Verificar si un ID es un UUID válido de Supabase (no generado localmente)
  const isSupabaseId = useCallback((id: string): boolean => {
    // UUIDs de Supabase tienen formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    // Si es un ID de Supabase, actualizar en la base de datos
    if (isSupabaseId(id)) {
      try {
        const { error } = await supabase
          .from('notificaciones')
          .update({ leida: true })
          .eq('id', id);

        if (error) {
          console.error('Error al marcar notificación como leída en Supabase:', error);
        }
      } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
      }
    }

    // Siempre actualizar en el estado local
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, [isSupabaseId]);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    // Separar las notificaciones de Supabase de las locales
    const supabaseNotifications = unreadNotifications.filter(n => isSupabaseId(n.id));
    
    // Actualizar solo las de Supabase en la base de datos
    if (supabaseNotifications.length > 0) {
      try {
        const supabaseIds = supabaseNotifications.map(n => n.id);

        const { error } = await supabase
          .from('notificaciones')
          .update({ leida: true })
          .in('id', supabaseIds);

        if (error) {
          console.error('Error al marcar notificaciones como leídas en Supabase:', error);
        }
      } catch (error) {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
      }
    }

    // Actualizar todas (locales y de Supabase) en el estado local
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  }, [notifications, isSupabaseId]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(notification => !notification.isRead).length;
  }, [notifications]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Custom hook for creating order authorization notifications
export function useOrderNotifications() {
  const { addNotification } = useNotifications();

  const notifyOrderAuthorized = useCallback((orderData: {
    orderNumber: string;
    customerName: string;
    warrantyType: string;
    warrantyExpiration: Date;
    coverage: string;
    amount?: number;
    currency?: string;
    customerPhone?: string;
    customerAddress?: string;
  }) => {
    return addNotification({
      type: 'order_authorized',
      title: 'Orden Autorizada',
      message: `La orden ${orderData.orderNumber} ha sido autorizada exitosamente para ${orderData.customerName}.`,
      data: {
        orderInfo: {
          orderId: Date.now().toString(),
          orderNumber: orderData.orderNumber,
          status: 'authorized',
          amount: orderData.amount,
          currency: orderData.currency,
          date: new Date(),
          description: `Orden autorizada con garantía ${orderData.warrantyType}`
        },
        warrantyInfo: {
          warrantyId: `W-${Date.now()}`,
          warrantyType: orderData.warrantyType,
          expirationDate: orderData.warrantyExpiration,
          coverage: orderData.coverage,
        },
        customerInfo: {
          customerId: `C-${Date.now()}`,
          name: orderData.customerName,
          phone: orderData.customerPhone,
          address: orderData.customerAddress,
        }
      }
    });
  }, [addNotification]);

  const notifyWarrantyExpiration = useCallback((warrantyData: {
    customerName: string;
    warrantyType: string;
    expirationDate: Date;
    daysUntilExpiration: number;
  }) => {
    return addNotification({
      type: 'warranty_info',
      title: 'Advertencia de Garantía',
      message: `La garantía de ${warrantyData.customerName} expira en ${warrantyData.daysUntilExpiration} días.`,
      data: {
        warrantyInfo: {
          warrantyId: `W-${Date.now()}`,
          warrantyType: warrantyData.warrantyType,
          expirationDate: warrantyData.expirationDate,
          coverage: 'Ver detalles de la garantía',
        },
        customerInfo: {
          customerId: `C-${Date.now()}`,
          name: warrantyData.customerName,
        }
      }
    });
  }, [addNotification]);

  return {
    notifyOrderAuthorized,
    notifyWarrantyExpiration,
  };
}