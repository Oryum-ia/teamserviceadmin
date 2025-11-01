import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Overlay con difuminado elegante */}
        <div 
          className={`fixed inset-0 backdrop-blur-md transition-all duration-300 ease-out ${
            theme === 'light' ? 'bg-black/20' : 'bg-black/40'
          }`}
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative transform overflow-hidden rounded-3xl backdrop-blur-xl px-4 pb-4 pt-5 text-left shadow-2xl transition-all duration-300 ease-out scale-100 sm:my-8 sm:w-full sm:max-w-lg sm:p-6 ${
          theme === 'light' 
            ? 'bg-white/95 border border-white/20' 
            : 'bg-gray-800/95 border border-gray-700/50'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className={`transition-colors duration-200 ${
                theme === 'light' 
                  ? 'text-gray-400 hover:text-gray-500' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className={`${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            {children}
          </div>
          
          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                theme === 'light'
                  ? 'bg-slate-600 hover:bg-slate-700 focus:ring-slate-500'
                  : 'bg-slate-700 hover:bg-slate-600 focus:ring-slate-400'
              }`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}