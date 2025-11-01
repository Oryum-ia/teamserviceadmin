import React from 'react';
import {
  AlertTriangle,
  X,
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative rounded-lg shadow-xl max-w-md w-full ${
          theme === 'light' ? 'bg-white' : 'bg-dark-bg-secondary border border-dark-bg-tertiary'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-dark-bg-tertiary'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                theme === 'light' ? 'bg-red-100' : 'bg-red-900/30'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  theme === 'light' ? 'text-red-600' : 'text-red-400'
                }`} />
              </div>
              <h3 className={`text-lg font-semibold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Cerrar sesión
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`${
                theme === 'light'
                  ? 'text-gray-400 hover:text-gray-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className={`text-sm mb-6 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              ¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder al panel de administración.
            </p>

            {/* Buttons */}
            <div className="flex space-x-3 justify-end">
              <button
                onClick={onClose}
                className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors duration-200 ${
                  theme === 'light'
                    ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                    : 'text-white bg-dark-bg-tertiary border-lime-400/30 hover:bg-lime-400/10 hover:border-lime-400/50'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;