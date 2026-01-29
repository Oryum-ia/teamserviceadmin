'use client'

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Componente que monitorea y mantiene la sesión de Supabase activa
 * Refresca el token automáticamente para que NUNCA expire mientras el usuario esté activo
 */
export default function SessionMonitor() {
  const router = useRouter();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // Verificar sesión cada 2 minutos (solo para detectar si se perdió)
    const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutos
    
    // Refrescar token cada 15 minutos para mantener sesión activa indefinidamente
    const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutos

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error al verificar sesión:', error);
          return;
        }

        if (!session) {
          console.warn('⚠️ Sesión perdida, redirigiendo al login...');
          // Limpiar localStorage
          window.localStorage.removeItem('teamservice_user');
          router.push('/login');
          return;
        }

        console.log('✅ Sesión activa verificada');
      } catch (error) {
        console.error('❌ Error en verificación de sesión:', error);
      }
    };

    const refreshSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.warn('⚠️ No hay sesión para refrescar');
          return;
        }

        console.log('🔄 Refrescando token para mantener sesión activa indefinidamente...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Error al refrescar token:', refreshError);
        } else {
          console.log('✅ Token refrescado exitosamente - Sesión extendida');
        }
      } catch (error) {
        console.error('❌ Error en refresco de sesión:', error);
      }
    };

    // Verificar inmediatamente al montar
    checkSession();
    
    // Refrescar inmediatamente al montar
    refreshSession();

    // Configurar verificación periódica (cada 2 minutos)
    checkIntervalRef.current = setInterval(checkSession, CHECK_INTERVAL);
    
    // Configurar refresco automático periódico (cada 15 minutos)
    refreshIntervalRef.current = setInterval(refreshSession, REFRESH_INTERVAL);

    // Listener para eventos de visibilidad (cuando el usuario vuelve a la pestaña)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Pestaña visible, verificando y refrescando sesión...');
        checkSession();
        refreshSession(); // Refrescar también al volver a la pestaña
      }
    };

    // Listener para actividad del usuario (mantener sesión activa)
    const handleUserActivity = () => {
      // Refrescar sesión cuando hay actividad del usuario
      // Usar debounce para no hacer demasiadas llamadas
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = setInterval(refreshSession, REFRESH_INTERVAL);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Escuchar eventos de actividad del usuario
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true, once: true });
    });

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [router]);

  // Este componente no renderiza nada
  return null;
}
