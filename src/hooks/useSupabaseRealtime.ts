/**
 * Hook personalizado para manejar actualizaciones en tiempo real de Supabase
 * Maneja INSERT, UPDATE y DELETE automáticamente
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseRealtimeOptions<T> {
  /** Nombre de la tabla en Supabase */
  table: string;
  /** Función para obtener los datos iniciales */
  fetchData: () => Promise<T[]>;
  /** Función para extraer el ID único de cada item (default: item => item.id) */
  keyExtractor?: (item: T) => string;
  /** Habilitar/deshabilitar realtime (default: true) */
  enabled?: boolean;
  /** Filtro adicional para la suscripción (opcional) */
  filter?: string;
  /** Callback cuando se inserta un nuevo registro */
  onInsert?: (newItem: T) => void;
  /** Callback cuando se actualiza un registro */
  onUpdate?: (updatedItem: T) => void;
  /** Callback cuando se elimina un registro */
  onDelete?: (deletedId: string) => void;
}

export function useSupabaseRealtime<T = any>({
  table,
  fetchData,
  keyExtractor = (item: any) => item.id,
  enabled = true,
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseSupabaseRealtimeOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await fetchData();
      setData(items);
    } catch (err) {
      console.error(`Error al cargar datos de ${table}:`, err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, table]);

  // Recargar datos manualmente
  const refetch = useCallback(() => {
    return loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Configurar suscripción en tiempo real
  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel;
    let errorCount = 0;
    const MAX_ERRORS = 3;

    const setupRealtimeSubscription = () => {
      channel = supabase.channel(`${table}_realtime_${Date.now()}`);

      // Configurar filtro si existe
      const subscriptionConfig: any = {
        event: '*',
        schema: 'public',
        table: table,
      };

      if (filter) {
        subscriptionConfig.filter = filter;
      }

      channel
        .on('postgres_changes', subscriptionConfig, (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          switch (eventType) {
            case 'INSERT':
              if (newRecord) {
                const newItem = newRecord as T;
                setData((prev) => [newItem, ...prev]);
                onInsert?.(newItem);
              }
              break;

            case 'UPDATE':
              if (newRecord) {
                const updatedItem = newRecord as T;
                setData((prev) => {
                  const itemId = keyExtractor(updatedItem);
                  const exists = prev.some((item) => keyExtractor(item) === itemId);

                  if (!exists) {
                    return [updatedItem, ...prev];
                  }

                  return prev.map((item) =>
                    keyExtractor(item) === itemId ? updatedItem : item
                  );
                });
                onUpdate?.(updatedItem);
              }
              break;

            case 'DELETE':
              if (oldRecord) {
                const deletedId = keyExtractor(oldRecord as T);
                setData((prev) => prev.filter((item) => keyExtractor(item) !== deletedId));
                onDelete?.(deletedId);
              }
              break;
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Suscripción activa para tabla: ${table}`);
            errorCount = 0;
          } else if (status === 'CHANNEL_ERROR') {
            errorCount++;
            console.warn(`⚠️ Error en suscripción para tabla: ${table} (${errorCount}/${MAX_ERRORS})`);
            if (errorCount >= MAX_ERRORS) {
              console.warn(`🛑 Demasiados errores de realtime para ${table}, desconectando canal.`);
              supabase.removeChannel(channel);
            }
          } else if (status === 'TIMED_OUT') {
            console.warn(`⏱️ Timeout en suscripción para tabla: ${table}, desconectando.`);
            supabase.removeChannel(channel);
          }
        });
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [enabled, table, filter, keyExtractor, onInsert, onUpdate, onDelete]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
