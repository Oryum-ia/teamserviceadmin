import React, { useState } from 'react';
import {
  User,
  Mail,
  Key,
  Edit,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';

const Perfil: React.FC = () => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: 'admin_tscosta',
    nombres: 'TS COSTA SAS',
    email: 'admin@tscostasas.com',
    password: 'password123',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    console.log('Guardando datos:', formData);
    setIsEditing(false);
    // Aquí iría la lógica para guardar en el backend
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Revertir cambios si es necesario
  };

  return (
    <div className={`h-full p-6 overflow-y-auto ${
      theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'
    }`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className={`rounded-lg shadow-sm border mb-6 ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-800 border-gray-700'
        }`}>
          <div className={`px-6 py-4 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-gray-700'
          }`}>
            <div className="flex items-center justify-between">
              <h1 className={`text-2xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Perfil de Administrador
              </h1>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar Perfil</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className={`px-4 py-2 border rounded-lg transition-colors duration-200 ${
                      theme === 'light'
                        ? 'text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200'
                        : 'text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Guardar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className="px-6 py-6">
            <div className="flex justify-center mb-6">
              <div className={`h-24 w-24 rounded-full flex items-center justify-center ${
                theme === 'light' ? 'bg-amber-100' : 'bg-amber-900/30'
              }`}>
                <User className={`h-12 w-12 ${
                  theme === 'light' ? 'text-amber-600' : 'text-amber-400'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de datos */}
        <div className={`rounded-lg shadow-sm border ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-800 border-gray-700'
        }`}>
          <div className="px-6 py-6 space-y-6">
            {/* Nombre de usuario */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Nombre de usuario
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">
                  {formData.username}
                </p>
              )}
            </div>

            {/* Nombres */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombres (nombre completo o razón social)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => handleInputChange('nombres', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">
                  {formData.nombres}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 flex items-center ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                <Mail className="h-4 w-4 mr-2" />
                Correo electrónico
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">
                  {formData.email}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className={`block text-sm font-medium mb-2 flex items-center ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                <Key className="h-4 w-4 mr-2" />
                Contraseña
              </label>
              <div className="relative">
                {isEditing ? (
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span className="text-gray-900 dark:text-white font-mono">
                      {showPassword ? formData.password : '••••••••••••'}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;