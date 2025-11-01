"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Notification, NotificationContextType } from '../types/notifications';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove notification if duration is specified
    if (newNotification.duration) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
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