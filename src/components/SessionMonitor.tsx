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
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verificar sesión cada 2 minutos
    const CHECK_INTERVAL = 2 * 60 * 1000;
    // Refrescar token cada 15 minutos
    const REFRESH_INTERVAL = 15 * 60 * 1000;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error al verificar sesión:', error);
          return;
        }

        if (!session) {
          console.warn('⚠️ Sesión perdida, redirigiendo al login...');
          window.localStorage.removeItem('teamservice_user');
          router.push('/');
          return;
        }

        console.log('✅ Sesión activa verificada');
      } catch (error) {
        console.error('❌ Error en verificación de sesión:', error);
      }
    };

    const refreshSession = async () => {
      // Evitar refrescos concurrentes
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) return;

        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Error al refrescar token:', refreshError);
        } else {
          console.log('✅ Token refrescado exitosamente - Sesión extendida');
        }
      } catch (error) {
        console.error('❌ Error en refresco de sesión:', error);
      } finally {
        isRefreshingRef.current = false;
      }
    };

    // Verificar inmediatamente al montar
    checkSession();

    // Configurar verificación periódica (cada 2 minutos)
    checkIntervalRef.current = setInterval(checkSession, CHECK_INTERVAL);
    
    // Configurar refresco automático periódico (cada 15 minutos)
    // NO refrescar inmediatamente al montar - supabase ya lo hace con autoRefreshToken
    refreshIntervalRef.current = setInterval(refreshSession, REFRESH_INTERVAL);

    // Listener para eventos de visibilidad (cuando el usuario vuelve a la pestaña)
    let lastVisibilityRefresh = 0;
    const VISIBILITY_DEBOUNCE = 30_000; // 30 segundos mínimo entre refrescos por visibilidad

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastVisibilityRefresh < VISIBILITY_DEBOUNCE) return;
        lastVisibilityRefresh = now;

        console.log('👁️ Pestaña visible, verificando sesión...');
        checkSession();
        // Solo refrescar si pasó suficiente tiempo
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  return null;
}
