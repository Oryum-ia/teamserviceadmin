"use client";

import { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationModal } from './NotificationModal';
import { Notification } from '../types/notifications';
import { useTheme } from './ThemeProvider';

export function NotificationBell() {
  const { notifications, getUnreadCount, markAsRead } = useNotifications();
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = getUnreadCount();
  const hasUnread = unreadCount > 0;

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    setShowDropdown(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const getNotificationPreview = (notification: Notification) => {
    let preview = notification.message;
    if (preview.length > 50) {
      preview = preview.substring(0, 50) + '...';
    }
    return preview;
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`relative -m-2.5 p-2.5 text-gray-400 transition-colors duration-200 ${
            theme === 'light'
              ? 'hover:text-gray-500'
              : 'hover:text-lime-400'
          }`}
        >
          {hasUnread ? (
            <BellRing className="h-6 w-6" />
          ) : (
            <Bell className="h-6 w-6" />
          )}
          
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-2xl border backdrop-blur-xl z-50 max-h-96 overflow-hidden ${
            theme === 'light'
              ? 'bg-white border-gray-200'
              : 'bg-dark-bg-secondary border-lime-400/30'
          }`}>
            <div className={`p-4 border-b ${
              theme === 'light'
                ? 'border-gray-200'
                : 'border-dark-bg-tertiary'
            }`}>
              <h3 className={`text-lg font-semibold ${
                theme === 'light'
                  ? 'text-gray-900'
                  : 'text-white'
              }`}>
                Notificaciones
              </h3>
              {hasUnread && (
                <p className={`text-sm ${
                  theme === 'light'
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }`}>
                  {unreadCount} sin leer
                </p>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className={`p-6 text-center ${
                  theme === 'light'
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}>
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className={`divide-y ${
                  theme === 'light'
                    ? 'divide-gray-200'
                    : 'divide-dark-bg-tertiary'
                }`}>
                  {notifications.slice(0, 5).map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left transition-colors ${
                        theme === 'light'
                          ? `hover:bg-gray-50 ${!notification.isRead ? 'bg-mint-50' : ''}`
                          : `hover:bg-dark-bg-tertiary/50 ${!notification.isRead ? 'bg-lime-400/5 border-l-2 border-lime-400' : ''}`
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                          !notification.isRead 
                            ? theme === 'light' ? 'bg-mint-500' : 'bg-lime-400'
                            : theme === 'light'
                              ? 'bg-gray-300'
                              : 'bg-gray-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            !notification.isRead 
                              ? theme === 'light'
                                ? 'text-gray-900'
                                : 'text-white'
                              : theme === 'light'
                                ? 'text-gray-600'
                                : 'text-gray-400'
                          }`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs mt-1 ${
                            theme === 'light'
                              ? 'text-gray-500'
                              : 'text-gray-400'
                          }`}>
                            {getNotificationPreview(notification)}
                          </p>
                          <p className={`text-xs mt-1 ${
                            theme === 'light'
                              ? 'text-gray-400'
                              : 'text-gray-500'
                          }`}>
                            {formatRelativeTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {notifications.length > 5 && (
                <div className={`p-4 border-t text-center ${
                  theme === 'light'
                    ? 'border-gray-200'
                    : 'border-gray-700'
                }`}>
                  <button className={`text-sm ${
                    theme === 'light'
                      ? 'text-mint-600 hover:text-mint-800'
                      : 'text-lime-400 hover:text-lime-300'
                  }`}>
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)} 
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMarkAsRead={markAsRead}
      />
    </>
  );
}