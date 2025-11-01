export interface Notification {
  id: string;
  type: 'order_authorized' | 'warranty_info' | 'system_alert' | 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  duration?: number; // Duration in ms, if undefined it will stay until manually closed
  actionButton?: {
    text: string;
    action: () => void;
  };
  data?: NotificationData;
}

export interface NotificationData {
  orderInfo?: OrderInfo;
  warrantyInfo?: WarrantyInfo;
  customerInfo?: CustomerInfo;
}

export interface OrderInfo {
  orderId: string;
  orderNumber: string;
  status: 'authorized' | 'pending' | 'completed' | 'cancelled';
  amount?: number;
  currency?: string;
  date: Date;
  description?: string;
}

export interface WarrantyInfo {
  warrantyId: string;
  warrantyType: string;
  expirationDate: Date;
  coverage: string;
  terms?: string;
}

export interface CustomerInfo {
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export type NotificationType = Notification['type'];

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  getUnreadCount: () => number;
}