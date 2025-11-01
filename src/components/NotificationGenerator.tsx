"use client";

import { useEffect } from 'react';
import { useNotifications, useOrderNotifications } from '../contexts/NotificationContext';

const sampleNotifications = [
  {
    type: 'order_authorized',
    orderData: {
      orderNumber: '25-0124',
      customerName: 'Martínez Luz',
      warrantyType: 'Garantía 25-0124',
      coverage: 'Cobertura completa',
      amount: 85000,
      currency: 'CRC',
      customerPhone: '+506 8888-9999',
      customerAddress: 'San José, Costa Rica'
    }
  },
  {
    type: 'order_authorized',
    orderData: {
      orderNumber: '25-0110',
      customerName: 'González María',
      warrantyType: 'CLEAN MAXX',
      coverage: 'Garantía extendida',
      amount: 125000,
      currency: 'CRC',
      customerPhone: '+506 7777-8888',
      customerAddress: 'Cartago, Costa Rica'
    }
  },
  {
    type: 'warranty_expiration',
    warrantyData: {
      customerName: 'Rodríguez Carlos',
      warrantyType: 'Garantía Premium',
      daysUntilExpiration: 15
    }
  },
  {
    type: 'order_authorized',
    orderData: {
      orderNumber: '25-0121',
      customerName: 'Mora Yolanda',
      warrantyType: 'Garantía Estándar',
      coverage: 'Reparación y mantenimiento',
      amount: 65000,
      currency: 'CRC',
      customerPhone: '+506 6666-7777',
      customerAddress: 'Alajuela, Costa Rica'
    }
  },
  {
    type: 'warranty_expiration',
    warrantyData: {
      customerName: 'Pérez Ana',
      warrantyType: 'CLEAN MAXX',
      daysUntilExpiration: 7
    }
  }
];

// Función para generar fecha aleatoria en las últimas 24 horas
const getRandomRecentDate = () => {
  const now = new Date();
  const hoursAgo = Math.floor(Math.random() * 24); // Últimas 24 horas
  const minutesAgo = Math.floor(Math.random() * 60); // Minutos adicionales
  return new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
};

export function NotificationGenerator() {
  const { addNotification } = useNotifications();
  const { notifyOrderAuthorized, notifyWarrantyExpiration } = useOrderNotifications();

  useEffect(() => {
    // Generar notificaciones ficticias al cargar el componente
    const generateSampleNotifications = () => {
      sampleNotifications.forEach((notification, index) => {
        setTimeout(() => {
          const notificationDate = getRandomRecentDate();
          
          if (notification.type === 'order_authorized' && notification.orderData) {
            const warrantyExpiration = new Date(notificationDate);
            warrantyExpiration.setFullYear(warrantyExpiration.getFullYear() + 1); // 1 año de garantía
            
            // Crear notificación con timestamp personalizado
            const notificationId = addNotification({
              type: 'order_authorized',
              title: 'Orden Autorizada',
              message: `La orden ${notification.orderData.orderNumber} ha sido autorizada exitosamente para ${notification.orderData.customerName}.`,
              data: {
                orderInfo: {
                  orderId: `ORD-${Date.now()}-${index}`,
                  orderNumber: notification.orderData.orderNumber,
                  status: 'authorized',
                  amount: notification.orderData.amount,
                  currency: notification.orderData.currency,
                  date: notificationDate,
                  description: `Orden autorizada con ${notification.orderData.warrantyType}`
                },
                warrantyInfo: {
                  warrantyId: `W-${Date.now()}-${index}`,
                  warrantyType: notification.orderData.warrantyType,
                  expirationDate: warrantyExpiration,
                  coverage: notification.orderData.coverage,
                },
                customerInfo: {
                  customerId: `C-${Date.now()}-${index}`,
                  name: notification.orderData.customerName,
                  phone: notification.orderData.customerPhone,
                  address: notification.orderData.customerAddress,
                }
              }
            });
          } else if (notification.type === 'warranty_expiration' && notification.warrantyData) {
            const expirationDate = new Date(notificationDate);
            expirationDate.setDate(expirationDate.getDate() + notification.warrantyData.daysUntilExpiration);
            
            addNotification({
              type: 'warranty_info',
              title: 'Advertencia de Garantía',
              message: `La garantía de ${notification.warrantyData.customerName} expira en ${notification.warrantyData.daysUntilExpiration} días.`,
              data: {
                warrantyInfo: {
                  warrantyId: `W-${Date.now()}-${index}`,
                  warrantyType: notification.warrantyData.warrantyType,
                  expirationDate: expirationDate,
                  coverage: 'Ver detalles de la garantía',
                },
                customerInfo: {
                  customerId: `C-${Date.now()}-${index}`,
                  name: notification.warrantyData.customerName,
                }
              }
            });
          }
        }, index * 500); // Espaciar las notificaciones por 500ms
      });
    };

    // Generar notificaciones iniciales después de un pequeño delay
    const initialDelay = setTimeout(generateSampleNotifications, 1000);

    // Opcionalmente, generar notificaciones periódicas (cada 30 segundos)
    const periodicNotifications = setInterval(() => {
      const randomNotification = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)];
      
      if (randomNotification.type === 'order_authorized' && randomNotification.orderData) {
        const orderNumber = `25-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
        const warrantyExpiration = new Date();
        warrantyExpiration.setFullYear(warrantyExpiration.getFullYear() + 1);
        
        addNotification({
          type: 'order_authorized',
          title: 'Nueva Orden Autorizada',
          message: `La orden ${orderNumber} ha sido autorizada para ${randomNotification.orderData.customerName}.`,
          data: {
            orderInfo: {
              orderId: `ORD-${Date.now()}`,
              orderNumber: orderNumber,
              status: 'authorized',
              amount: randomNotification.orderData.amount,
              currency: randomNotification.orderData.currency,
              date: new Date(),
              description: `Orden autorizada con ${randomNotification.orderData.warrantyType}`
            },
            warrantyInfo: {
              warrantyId: `W-${Date.now()}`,
              warrantyType: randomNotification.orderData.warrantyType,
              expirationDate: warrantyExpiration,
              coverage: randomNotification.orderData.coverage,
            },
            customerInfo: {
              customerId: `C-${Date.now()}`,
              name: randomNotification.orderData.customerName,
              phone: randomNotification.orderData.customerPhone,
              address: randomNotification.orderData.customerAddress,
            }
          }
        });
      }
    }, 30000); // Cada 30 segundos

    // Cleanup
    return () => {
      clearTimeout(initialDelay);
      clearInterval(periodicNotifications);
    };
  }, [addNotification]);

  return null; // Este componente no renderiza nada
}

// Hook personalizado para controlar la generación de notificaciones
export function useSampleNotifications() {
  const { notifyOrderAuthorized, notifyWarrantyExpiration } = useOrderNotifications();

  const generateOrderNotification = () => {
    const customers = ['Martínez Luz', 'González María', 'Rodríguez Carlos', 'Mora Yolanda', 'Pérez Ana'];
    const warrantyTypes = ['Garantía 25-0124', 'CLEAN MAXX', 'Garantía Premium', 'Garantía Estándar'];
    const locations = ['San José', 'Cartago', 'Alajuela', 'Heredia', 'Puntarenas'];
    
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    const randomWarranty = warrantyTypes[Math.floor(Math.random() * warrantyTypes.length)];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomAmount = Math.floor(Math.random() * 100000) + 50000;
    const orderNumber = `25-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    
    notifyOrderAuthorized({
      orderNumber,
      customerName: randomCustomer,
      warrantyType: randomWarranty,
      warrantyExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      coverage: 'Cobertura completa',
      amount: randomAmount,
      currency: 'CRC',
      customerPhone: '+506 8888-9999',
      customerAddress: `${randomLocation}, Costa Rica`
    });
  };

  const generateWarrantyNotification = () => {
    const customers = ['Cliente A', 'Cliente B', 'Cliente C', 'Cliente D'];
    const warrantyTypes = ['CLEAN MAXX', 'Garantía Premium', 'Garantía Estándar'];
    const daysOptions = [7, 15, 30, 45];
    
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    const randomWarranty = warrantyTypes[Math.floor(Math.random() * warrantyTypes.length)];
    const randomDays = daysOptions[Math.floor(Math.random() * daysOptions.length)];
    
    notifyWarrantyExpiration({
      customerName: randomCustomer,
      warrantyType: randomWarranty,
      expirationDate: new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000),
      daysUntilExpiration: randomDays
    });
  };

  return {
    generateOrderNotification,
    generateWarrantyNotification
  };
}