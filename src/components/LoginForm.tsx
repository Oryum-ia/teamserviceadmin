"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import { Logo } from "@/components/Logo";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("🔐 Iniciando sesión con Supabase...");

      // Autenticación con Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("❌ Error de autenticación:", authError);
        setError("Usuario o contraseña incorrectos");
        return;
      }

      if (data.user) {
        console.log("✅ Autenticación exitosa:", data.user.id);

        try {
          // AUTORECUPERACIÓN DE USUARIO (Auth Reset) 
          // 1. Intentar buscar por ID (comportamiento normal)
          let { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          // 2. Si no se encuentra por ID, buscar por EMAIL (Caso de "Rescate")
          if (!userData && !userError) {
            console.warn("⚠️ Usuario no encontrado por ID, intentando recuperar por email...");
            
            const { data: userByEmail, error: emailError } = await supabase
              .from('usuarios')
              .select('*')
              .eq('email', email)
              .maybeSingle();

            if (userByEmail) {
              console.log("✅ Usuario encontrado por email. Usando registro existente (ID: " + userByEmail.id + ")");
              // Usamos los datos del usuario encontrado por email
              // NOTA: Existirá una discrepancia entre auth.uid() y user.id, pero preservamos los datos históricos
              userData = userByEmail;
            }
          }

          if (userError) {
            console.error("❌ Error al obtener datos del usuario:", userError);
            setError("Error al cargar datos del usuario");
            await supabase.auth.signOut();
            return;
          }

          // Si el usuario no existe en la tabla tras ambos intentos
          if (!userData) {
            console.error("❌ Usuario no encontrado en tabla usuarios ni por ID ni Email");
            setError("Usuario no registrado correctamente. Contacta al administrador.");
            await supabase.auth.signOut();
            return;
          }

          if (!userData.activo) {
            console.warn("⚠️ Usuario inactivo intentando iniciar sesión:", userData.email);
            setError("El usuario está inactivo. Contacta al administrador.");
            await supabase.auth.signOut();
            return;
          }

          console.log("✅ Datos de usuario obtenidos:", userData);

          // Almacenar sesión de usuario
          if (typeof window !== 'undefined') {
            const userSession = {
              email: userData.email,
              rol: userData.rol,
              nombre: userData.nombre,
              activo: userData.activo,
              isAuthenticated: true,
              loginTime: new Date().toISOString(),
              userId: data.user.id
            };
            localStorage.setItem('userSession', JSON.stringify(userSession));
            localStorage.setItem('auth_token', data.session?.access_token || '');

            console.log('✅ Sesión guardada:', userSession);
          }

          // Dar un pequeño delay para asegurar que localStorage se guarde
          await new Promise(resolve => setTimeout(resolve, 100));

          console.log('🔄 Redirigiendo a /paneladmin...');
          router.push("/paneladmin");
        } catch (dbError) {
          console.error("❌ Error en consulta de base de datos:", dbError);
          setError("Error al acceder a la base de datos");
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error("❌ Error inesperado:", error);
      setError("Error al iniciar sesión. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    handleLogin(e);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Logo theme="light" className="scale-125" />
      </div>

      {/* Título */}
      <div className="text-center mb-4">
        <h2 className="text-gray-800 dark:text-gray-100 text-lg font-semibold mb-1">
          Bienvenido
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          Ingresa tus credenciales para continuar
        </p>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-xs mb-3 flex items-start">
          <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Campo de Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Correo electrónico
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-colors text-sm"
              placeholder="correo@ejemplo.com"
              required
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>
        </div>

        {/* Campo de Contraseña */}
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-colors text-sm"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-sm"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando sesión...
            </span>
          ) : (
            "Iniciar sesión"
          )}
        </button>
      </form>
    </div>
  );
}
