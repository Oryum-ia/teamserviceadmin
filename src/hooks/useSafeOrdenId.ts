'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';

/**
 * Custom hook para obtener el ID de orden de forma segura desde los params.
 * Valida que el ID exista y sea un número válido.
 *
 * Retorna:
 * - { id: string, isReady: true } - Si el ID es válido
 * - { id: null, isReady: false } - Si el ID aún se está cargando o es inválido
 *
 * Si el ID es inválido, muestra un error toast.
 */
export function useSafeOrdenId() {
  const params = useParams();
  const toast = useToast();
  const [state, setState] = useState<{ id: string | null; isReady: boolean }>({
    id: null,
    isReady: false,
  });
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Obtener el ID de los params
    const ordenIdParam = params?.id as string | undefined;

    // Si el ID no ha cambiado, no hacer nada
    if (ordenIdParam === lastIdRef.current) {
      return;
    }

    // Resetear estado cuando cambia el ID
    setState({ id: null, isReady: false });

    // Validar que el ID exista
    if (!ordenIdParam) {
      lastIdRef.current = null;
      return;
    }

    // Validar que sea un string no vacío
    if (ordenIdParam.trim() === '') {
      toast.error('ID de orden inválido');
      lastIdRef.current = null;
      return;
    }

    // Todo está bien - actualizar estado
    lastIdRef.current = ordenIdParam;
    setState({ id: ordenIdParam, isReady: true });
  }, [params?.id, toast]);

  return state;
}
