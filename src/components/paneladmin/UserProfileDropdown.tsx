import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { Usuario } from '@/types/database.types';
import { obtenerUsuarioAutenticado } from '@/lib/services/authService';
import PerfilModal from './PerfilModal';

interface UserProfileDropdownProps {
  onLogout?: () => void;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ onLogout }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar datos del usuario
  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      const userData = await obtenerUsuarioAutenticado();
      setUsuario(userData as Usuario);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  // Cerrar el dropdown cuando se haga clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    setIsPerfilModalOpen(true);
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout?.();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de perfil */}
      <button
        onClick={toggleDropdown}
        className={`flex items-center space-x-2 transition-colors duration-200 p-2 rounded-lg ${
          theme === 'light'
            ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            : 'text-white hover:text-lime-400 hover:bg-dark-bg-tertiary'
        }`}
        aria-label="Menú de usuario"
      >
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
          theme === 'light' ? 'bg-gray-300' : 'bg-lime-400/20 border border-lime-400/30'
        }`}>
          <User className={`h-5 w-5 ${
            theme === 'light' ? 'text-gray-600' : 'text-lime-400'
          }`} />
        </div>
        <span className="hidden lg:block font-medium text-sm">
          {usuario?.nombre || 'Usuario'}
        </span>
        {/* Indicador de dropdown */}
        <ChevronDown
          className={`hidden lg:block h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg border py-1 z-50 transform transition-all duration-200 ease-out scale-100 opacity-100 ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-dark-bg-secondary border-lime-400/30'
        }`}>
          {/* Header del usuario */}
          <div className={`px-4 py-3 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                theme === 'light' ? 'bg-mint-100' : 'bg-lime-400/20 border border-lime-400/30'
              }`}>
                <User className={`h-5 w-5 ${
                  theme === 'light' ? 'text-mint-600' : 'text-lime-400'
                }`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  {usuario?.nombre || 'Usuario'}
                </p>
                <p className={`text-xs ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {usuario?.rol || 'Usuario'}
                </p>
              </div>
            </div>
          </div>

          {/* Opciones del menú */}
          <div className="py-1">
            {/* Perfil */}
            <button
              onClick={handleProfileClick}
              className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors duration-200 ${
                theme === 'light'
                  ? 'text-gray-700 hover:bg-gray-50'
                  : 'text-white hover:bg-dark-bg-tertiary hover:text-lime-400'
              }`}
            >
              <User className="h-4 w-4 mr-3 text-gray-500" />
              <span>Perfil</span>
            </button>

            {/* Separador */}
            <div className={`border-t my-1 ${
              theme === 'light' ? 'border-gray-200' : 'border-gray-700'
            }`}></div>

            {/* Cerrar sesión */}
            <button
              onClick={handleLogoutClick}
              className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors duration-200 ${
                theme === 'light'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-red-400 hover:bg-red-900/20'
              }`}
            >
              <LogOut className="h-4 w-4 mr-3" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de perfil */}
      <PerfilModal
        isOpen={isPerfilModalOpen}
        onClose={() => {
          setIsPerfilModalOpen(false);
          cargarUsuario(); // Recargar datos al cerrar el modal
        }}
      />
    </div>
  );
};

export default UserProfileDropdown;
