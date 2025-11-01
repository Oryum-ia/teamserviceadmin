"use client";

import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from './ThemeProvider';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const { theme } = useTheme();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStyles = (type: string) => {
    const baseStyles = theme === 'light'
      ? 'bg-white border shadow-lg'
      : 'bg-gray-800 border shadow-lg';

    const borderColor = {
      success: 'border-green-500',
      error: 'border-red-500',
      warning: 'border-yellow-500',
      info: 'border-blue-500'
    }[type] || 'border-gray-300';

    return `${baseStyles} ${borderColor}`;
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getStyles(toast.type)} rounded-lg p-4 flex items-start gap-3 animate-slide-in-right border-l-4`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-100'
            }`}>
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
              theme === 'light'
                ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                : 'hover:bg-gray-700 text-gray-500 hover:text-gray-300'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
