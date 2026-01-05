"use client";

import { useState, useMemo } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  FileText,
  Star,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  Info,
  Search,
  Filter
} from 'lucide-react';
import { Notification } from '../types/notifications';
import { useTheme } from './ThemeProvider';

interface NotificationListModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly notifications: readonly Notification[];
  readonly onNotificationClick: (notification: Notification) => void;
  readonly onMarkAllAsRead: () => void;
  readonly unreadCount: number;
}

type FilterType = 'all' | 'unread' | 'read';

export function NotificationListModal({
  isOpen,
  onClose,
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  unreadCount
}: NotificationListModalProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'pqr_nuevo':
        return <FileText className={`${iconClass} text-orange-500`} />;
      case 'encuesta_nueva':
        return <Star className={`${iconClass} text-yellow-500`} />;
      case 'cotizacion_aceptada':
        return <ThumbsUp className={`${iconClass} text-green-500`} />;
      case 'cotizacion_rechazada':
        return <ThumbsDown className={`${iconClass} text-red-500`} />;
      case 'terminos_aceptados':
        return <FileCheck className={`${iconClass} text-green-600`} />;
      case 'order_authorized':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'warranty_info':
        return <ShieldCheck className={`${iconClass} text-blue-500`} />;
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} text-amber-500`} />;
      case 'system_alert':
        return <AlertCircle className={`${iconClass} text-purple-500`} />;
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `hace ${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `hace ${diffDays}d`;

    return formatDate(date);
  };

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    // Aplicar filtro de estado
    if (filter === 'unread') {
      result = result.filter(n => !n.isRead);
    } else if (filter === 'read') {
      result = result.filter(n => n.isRead);
    }

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, filter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        relative w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden
        flex flex-col
        ${theme === 'light'
          ? 'bg-white'
          : 'bg-dark-bg-secondary border border-lime-400/20'
        }
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-4 sm:p-6 border-b
          ${theme === 'light' ? 'border-gray-200' : 'border-dark-bg-tertiary'}
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-xl
              ${theme === 'light' ? 'bg-mint-100' : 'bg-lime-400/10'}
            `}>
              <Bell className={`h-6 w-6 ${theme === 'light' ? 'text-mint-600' : 'text-lime-400'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Todas las Notificaciones
              </h2>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                {notifications.length} notificaciones • {unreadCount} sin leer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors cursor-pointer
                  ${theme === 'light'
                    ? 'bg-mint-100 text-mint-700 hover:bg-mint-200'
                    : 'bg-lime-400/10 text-lime-400 hover:bg-lime-400/20'
                  }
                `}
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Marcar todas como leídas</span>
                <span className="sm:hidden">Marcar leídas</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`
                p-2 rounded-lg transition-colors cursor-pointer
                ${theme === 'light'
                  ? 'hover:bg-gray-100 text-gray-500'
                  : 'hover:bg-dark-bg-tertiary text-gray-400'
                }
              `}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={`
          flex flex-col sm:flex-row gap-3 p-4 border-b
          ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-dark-bg-tertiary bg-dark-bg-tertiary/30'}
        `}>
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`
              absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4
              ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}
            `} />
            <input
              type="text"
              placeholder="Buscar notificaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 rounded-lg text-sm
                ${theme === 'light'
                  ? 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-mint-500 focus:ring-1 focus:ring-mint-500'
                  : 'bg-dark-bg-secondary border border-dark-bg-tertiary text-white placeholder-gray-500 focus:border-lime-400 focus:ring-1 focus:ring-lime-400'
                }
                outline-none transition-all
              `}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-opacity-50"
            style={{
              backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
            }}
          >
            <button
              onClick={() => setFilter('all')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer
                ${filter === 'all'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-lime-400 text-black'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 hover:text-white'
                }
              `}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer
                ${filter === 'unread'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-lime-400 text-black'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 hover:text-white'
                }
              `}
            >
              Sin leer
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer
                ${filter === 'read'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-lime-400 text-black'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 hover:text-white'
                }
              `}
            >
              Leídas
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className={`
              flex flex-col items-center justify-center py-16
              ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}
            `}>
              <Bell className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No hay notificaciones</p>
              <p className="text-sm opacity-70">
                {searchQuery
                  ? 'No se encontraron resultados para tu búsqueda'
                  : filter === 'unread'
                    ? 'No tienes notificaciones sin leer'
                    : filter === 'read'
                      ? 'No tienes notificaciones leídas'
                      : 'Las notificaciones aparecerán aquí'
                }
              </p>
            </div>
          ) : (
            <div className={`divide-y ${theme === 'light' ? 'divide-gray-100' : 'divide-dark-bg-tertiary'}`}>
              {filteredNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => onNotificationClick(notification)}
                  className={`
                    w-full p-4 sm:p-5 text-left transition-all cursor-pointer
                    ${theme === 'light'
                      ? `hover:bg-gray-50 ${!notification.isRead ? 'bg-mint-50/50' : ''}`
                      : `hover:bg-dark-bg-tertiary/50 ${!notification.isRead ? 'bg-lime-400/5' : ''}`
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`
                      flex-shrink-0 p-2.5 rounded-xl
                      ${theme === 'light' ? 'bg-gray-100' : 'bg-dark-bg-tertiary'}
                    `}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className={`
                            font-semibold truncate
                            ${!notification.isRead
                              ? theme === 'light' ? 'text-gray-900' : 'text-white'
                              : theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                            }
                          `}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className={`
                              flex-shrink-0 w-2 h-2 rounded-full
                              ${theme === 'light' ? 'bg-mint-500' : 'bg-lime-400'}
                            `} />
                          )}
                        </div>
                        <span className={`
                          flex-shrink-0 text-xs
                          ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}
                        `}>
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                      </div>

                      <p className={`
                        mt-1 text-sm line-clamp-2
                        ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}
                      `}>
                        {notification.message}
                      </p>

                      {/* Additional Info Tags */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`
                          inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${theme === 'light'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-dark-bg-tertiary text-gray-400'
                          }
                        `}>
                          {notification.type.replace(/_/g, ' ')}
                        </span>
                        {notification.referenciaTipo && (
                          <span className={`
                            inline-flex items-center px-2 py-0.5 rounded text-xs
                            ${theme === 'light'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-blue-900/20 text-blue-400'
                            }
                          `}>
                            {notification.referenciaTipo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`
          p-4 border-t text-center
          ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-dark-bg-tertiary bg-dark-bg-tertiary/30'}
        `}>
          <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
            Mostrando {filteredNotifications.length} de {notifications.length} notificaciones
          </p>
        </div>
      </div>
    </div>
  );
}
