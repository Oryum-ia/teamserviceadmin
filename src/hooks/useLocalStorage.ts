'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook seguro para acceder a localStorage en Next.js
 * Evita errores de hidratación y ReferenceError en SSR
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  // Estado de hidratación - true cuando estamos en el cliente
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Estado del valor
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Marcar como hidratado una vez que el componente se monta en el cliente
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Leer valor de localStorage una vez hidratado
  useEffect(() => {
    if (!isHydrated) return;

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key, isHydrated]);

  // Función para actualizar el valor
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Permitir que value sea una función como en useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        setStoredValue(valueToStore);
        
        // Solo guardar en localStorage en el cliente
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error saving to localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue, isHydrated];
}

/**
 * Check if we're running on the client side
 */
export const isClient = typeof window !== 'undefined';

/**
 * Safely access localStorage
 */
export function safeLocalStorage() {
  if (!isClient) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }
  
  return {
    getItem: (key: string): string | null => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Storage might be full or disabled
      }
    },
    removeItem: (key: string): void => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore
      }
    },
    clear: (): void => {
      try {
        window.localStorage.clear();
      } catch {
        // Ignore
      }
    },
  };
}

/**
 * Get a value from localStorage with proper error handling
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Set a value in localStorage with proper error handling
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (!isClient) return false;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove an item from localStorage
 */
export function removeStorageItem(key: string): boolean {
  if (!isClient) return false;
  
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
