"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { Usuario, UserRole } from '@/types/database.types';
import { crearUsuario, actualizarUsuario } from '@/lib/services/usuarioService';
import { cambiarContraseñaUsuario, obtenerUsuarioAutenticado } from '@/lib/services/authService';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuario?: Usuario | null;
}

export default function UsuarioModal({
  isOpen,
  onClose,
  onSuccess,
  usuario,
}: UsuarioModalProps) {
  const { theme } = useTheme();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    rol: 'tecnico' as UserRole,
    sede: '',
    nuevaPassword: '', // Para cambiar password de usuarios existentes
    confirmarNuevaPassword: '',
  });

  // Cargar datos del usuario autenticado y del usuario a editar
  useEffect(() => {
    if (isOpen) {
      // Cargar usuario actual
      obtenerUsuarioAutenticado().then((userData) => {
        setUsuarioActual(userData as Usuario);
      }).catch(console.error);

      if (usuario) {
        console.log('⏩ Precargando datos del usuario:', usuario);
        setFormData({
          email: usuario.email || '',
          password: '',
          confirmPassword: '',
          nombre: usuario.nombre || '',
          rol: usuario.rol || 'tecnico',
          sede: usuario.sede || '',
          nuevaPassword: '',
          confirmarNuevaPassword: '',
        });
      } else {
        console.log('➕ Nuevo usuario - form limpio');
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          nombre: '',
          rol: 'tecnico',
          sede: '',
          nuevaPassword: '',
          confirmarNuevaPassword: '',
        });
      }
      setError('');
      setMostrarCambioPassword(false);
    }
  }, [usuario, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Limpiar errores relacionados con email si el usuario está escribiendo
    if (name === 'email' && error && error.includes('email')) {
      setError('');
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validaciones
      if (!formData.nombre) {
        setError('El nombre es requerido');
        setIsLoading(false);
        return;
      }

      if (!formData.email) {
        setError('El email es requerido');
        setIsLoading(false);
        return;
      }

      // Validar formato de email
      const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!validEmailRegex.test(formData.email)) {
        setError('Por favor ingrese un email válido');
        setIsLoading(false);
        return;
      }

      // Si es nuevo usuario, validar password
      if (!usuario) {
        if (!formData.password) {
          setError('La contraseña es requerida');
          setIsLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setIsLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          setIsLoading(false);
          return;
        }
      }

      if (usuario) {
        // Actualizar usuario existente (solo nombre, rol, sede)
        await actualizarUsuario(usuario.id, {
          nombre: formData.nombre,
          rol: formData.rol,
          sede: formData.sede || undefined,
        });

        // Si es super-admin y hay nueva contraseña, cambiarla
        if (usuarioActual?.rol === 'super-admin' && formData.nuevaPassword) {
          if (formData.nuevaPassword !== formData.confirmarNuevaPassword) {
            setError('Las contraseñas no coinciden');
            setIsLoading(false);
            return;
          }

          if (formData.nuevaPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            setIsLoading(false);
            return;
          }

          await cambiarContraseñaUsuario(usuario.id, formData.nuevaPassword);
        }

        toast.success('Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        await crearUsuario({
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre,
          rol: formData.rol,
          sede: formData.sede || undefined,
        });
        toast.success('Usuario creado exitosamente');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al guardar usuario:', err);

      // Manejar errores específicos de Supabase
      let errorMsg = 'Error al guardar el usuario';
      if (err.message?.includes('already registered')) {
        errorMsg = 'Este email ya está registrado';
      } else if (err.message?.includes('password')) {
        errorMsg = 'Error con la contraseña. Debe tener al menos 6 caracteres';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
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
        className={`relative w-full max-w-md max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
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
            {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div className="p-6 space-y-4">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Nombre */}
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
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}
              >
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!!usuario} // No permitir editar email
                placeholder="Ej: usuario@ejemplo.com"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  usuario ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
                required
              />
              {usuario && (
                <p className={`text-xs mt-1 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  El email no se puede modificar
                </p>
              )}
              {!usuario && (
                <p className={`text-xs mt-1 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Ingresa un email válido para crear la cuenta de usuario
                </p>
              )}
            </div>

            {/* Password (solo para nuevos usuarios) */}
            {!usuario && (
              <>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                    }`}
                  >
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                    minLength={6}
                    required
                  />
                  <p className={`text-xs mt-1 ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
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
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      theme === 'light'
                        ? 'border-gray-300 bg-white text-gray-900'
                        : 'border-gray-600 bg-gray-700 text-gray-100'
                    }`}
                    required
                  />
                </div>
              </>
            )}

            {/* Rol */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}
              >
                Rol *
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
                required
              >
                <option value="tecnico">Técnico</option>
                <option value="admin">Administrador</option>
                <option value="super-admin">Super Admin</option>
              </select>
              <p className={`text-xs mt-1 ${
                theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {formData.rol === 'tecnico' && 'Acceso a diagnóstico y reparación'}
                {formData.rol === 'admin' && 'Acceso completo excepto gestión de usuarios'}
                {formData.rol === 'super-admin' && 'Acceso total al sistema'}
              </p>
            </div>

            {/* Sede */}
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
                onChange={handleChange}
                placeholder="Ej: Montería, Cartagena, etc."
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                }`}
              />
            </div>

            {/* Cambio de contraseña (solo para super-admin editando usuarios) */}
            {usuario && usuarioActual?.rol === 'super-admin' && (
              <>
                <div className={`pt-4 border-t ${
                  theme === 'light' ? 'border-gray-200' : 'border-gray-700'
                }`}>
                  <button
                    type="button"
                    onClick={() => setMostrarCambioPassword(!mostrarCambioPassword)}
                    className={`text-sm font-medium flex items-center space-x-1 ${
                      theme === 'light' ? 'text-yellow-600 hover:text-yellow-700' : 'text-yellow-400 hover:text-yellow-300'
                    }`}
                  >
                    <span>{mostrarCambioPassword ? '▼' : '▶'}</span>
                    <span>Cambiar contraseña</span>
                  </button>
                </div>

                {mostrarCambioPassword && (
                  <>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}
                      >
                        Nueva contraseña
                      </label>
                      <input
                        type="password"
                        name="nuevaPassword"
                        value={formData.nuevaPassword}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                          theme === 'light'
                            ? 'border-gray-300 bg-white text-gray-900'
                            : 'border-gray-600 bg-gray-700 text-gray-100'
                        }`}
                        minLength={6}
                      />
                      <p className={`text-xs mt-1 ${
                        theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        Mínimo 6 caracteres
                      </p>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}
                      >
                        Confirmar nueva contraseña
                      </label>
                      <input
                        type="password"
                        name="confirmarNuevaPassword"
                        value={formData.confirmarNuevaPassword}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                          theme === 'light'
                            ? 'border-gray-300 bg-white text-gray-900'
                            : 'border-gray-600 bg-gray-700 text-gray-100'
                        }`}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className={`flex items-center justify-end space-x-3 p-6 border-t ${
              theme === 'light' ? 'border-gray-200' : 'border-gray-700'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </span>
              ) : usuario ? (
                'Actualizar'
              ) : (
                'Crear Usuario'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
