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
        return {
          cotizacionInfo: {
            ordenId: datosAdicionales.orden_id || '',
            numeroOrden: datosAdicionales.numero_orden || '',
            clienteNombre: datosAdicionales.cliente_nombre || '',
            total: parseFloat(datosAdicionales.total) || 0,
            faseActual: datosAdicionales.fase_actual || '',
          },
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

    return () => {
      supabase.removeChannel(channel);
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

  const markAsRead = useCallback(async (id: string) => {
    // Actualizar en Supabase
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', id);

      if (error) throw error;

      // Actualizar en el estado local
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  }, []);

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