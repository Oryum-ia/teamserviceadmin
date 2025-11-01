"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2, Eye, EyeOff, User, Key } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { Usuario } from '@/types/database.types';
import { cambiarMiContraseña, obtenerUsuarioAutenticado } from '@/lib/services/authService';
import { actualizarUsuario } from '@/lib/services/usuarioService';

interface PerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PerfilModal({ isOpen, onClose }: PerfilModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    sede: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Cargar datos del usuario autenticado
  useEffect(() => {
    if (isOpen) {
      cargarDatosUsuario();
    }
  }, [isOpen]);

  const cargarDatosUsuario = async () => {
    setIsLoadingData(true);
    try {
      const userData = await obtenerUsuarioAutenticado();
      setUsuario(userData as Usuario);
      setFormData({
        nombre: userData.nombre || '',
        sede: userData.sede || '',
      });
    } catch (err: any) {
      console.error('Error al cargar datos del usuario:', err);
      toast.error('Error al cargar datos del perfil');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleActualizarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!usuario) {
        throw new Error('No se encontraron datos del usuario');
      }

      await actualizarUsuario(usuario.id, {
        nombre: formData.nombre,
        sede: formData.sede || undefined,
      });

      toast.success('Datos actualizados exitosamente');
      await cargarDatosUsuario(); // Recargar datos
    } catch (err: any) {
      console.error('Error al actualizar datos:', err);
      const errorMsg = err.message || 'Error al actualizar datos';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarContraseña = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones
      if (!passwordData.newPassword) {
        throw new Error('La nueva contraseña es requerida');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      await cambiarMiContraseña(passwordData.newPassword);

      toast.success('Contraseña actualizada exitosamente');
      
      // Limpiar campos de contraseña
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      console.error('Error al cambiar contraseña:', err);
      const errorMsg = err.message || 'Error al cambiar contraseña';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
          theme === 'light' ? 'bg-white' : 'bg-gray-800'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}
        >
          <h2
            className={`text-xl font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}
          >
            Mi Perfil
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'hover:bg-gray-100 text-gray-500'
                : 'hover:bg-gray-700 text-gray-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Avatar y datos básicos */}
              <div className="flex items-center space-x-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div
                  className={`h-20 w-20 rounded-full flex items-center justify-center ${
                    theme === 'light'
                      ? 'bg-yellow-100'
                      : 'bg-yellow-500/20 border border-yellow-500/30'
                  }`}
                >
                  <User
                    className={`h-10 w-10 ${
                      theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`text-lg font-semibold ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}
                  >
                    {usuario?.nombre || 'Usuario'}
                  </h3>
                  <p
                    className={`text-sm ${
                      theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    @{usuario?.email}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      usuario?.rol === 'super-admin'
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        : usuario?.rol === 'admin'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                    }`}
                  >
                    {usuario?.rol}
                  </span>
                </div>
              </div>

              {/* Formulario de datos personales */}
              <form onSubmit={handleActualizarDatos} className="space-y-4">
                <h4
                  className={`text-md font-semibold ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  Información Personal
                </h4>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleFormChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    Sede
                  </label>
                  <input
                    type="text"
                    name="sede"
                    value={formData.sede}
                    onChange={handleFormChange}
                    placeholder="Ej: Montería, Cartagena, etc."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando...</span>
                    </span>
                  ) : (
                    'Actualizar Datos'
                  )}
                </button>
              </form>

              {/* Cambio de contraseña */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleCambiarContraseña} className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Key className="h-5 w-5 text-yellow-500" />
                    <h4
                      className={`text-md font-semibold ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}
                    >
                      Cambiar Contraseña
                    </h4>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}
                    >
                      Nueva contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                          theme === 'light'
                            ? 'border-gray-300 bg-white text-gray-900'
                            : 'border-gray-600 bg-gray-700 text-gray-100'
                        }`}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      Mínimo 6 caracteres
                    </p>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}
                    >
                      Confirmar contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                          theme === 'light'
                            ? 'border-gray-300 bg-white text-gray-900'
                            : 'border-gray-600 bg-gray-700 text-gray-100'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-gray-700 hover:bg-gray-800 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Cambiando...</span>
                      </span>
                    ) : (
                      'Cambiar Contraseña'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
