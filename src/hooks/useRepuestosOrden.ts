"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  obtenerRepuestosDelModelo,
  guardarRepuestosDiagnostico,
  obtenerRepuestosDiagnostico,
  guardarRepuestosCotizacion,
  obtenerRepuestosCotizacion,
} from '@/lib/services/repuestoService';
import { updateOrdenFields } from '@/lib/ordenLocalStorage';
import { ejecutarConReintentos } from '@/lib/utils/saveHelpers';

// ============================================================================
// Tipos
// ============================================================================

export interface RepuestoBase {
  codigo: string;
  descripcion: string;
  cantidad: string | number;
  pieza_causante: string;
}

export interface RepuestoCotizacion extends RepuestoBase {
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  iva: number;
  en_stock: boolean;
  cubierto_garantia?: boolean;
  motivo_garantia?: string;
}

// ============================================================================
// Normalización
// ============================================================================

export function normalizarRepuestoBase(item: any): RepuestoBase {
  return {
    codigo: typeof item?.codigo === 'string' ? item.codigo : '',
    descripcion: typeof item?.descripcion === 'string' ? item.descripcion : '',
    cantidad:
      typeof item?.cantidad === 'number' || typeof item?.cantidad === 'string'
        ? item.cantidad
        : '1',
    pieza_causante: typeof item?.pieza_causante === 'string' ? item.pieza_causante : '',
  };
}

export function normalizarListaRepuestosBase(items: unknown): RepuestoBase[] {
  if (!Array.isArray(items)) return [];
  return items.filter(item => item && typeof item === 'object').map(normalizarRepuestoBase);
}


function normalizarRepuestoCotizacion(item: any): RepuestoCotizacion {
  return {
    codigo: typeof item?.codigo === 'string' ? item.codigo : '',
    descripcion: typeof item?.descripcion === 'string' ? item.descripcion : '',
    cantidad: typeof item?.cantidad === 'number' ? item.cantidad : Number(item?.cantidad) || 1,
    pieza_causante: typeof item?.pieza_causante === 'string' ? item.pieza_causante : '',
    precio_unitario: typeof item?.precio_unitario === 'number' ? item.precio_unitario : 0,
    descuento: typeof item?.descuento === 'number' ? item.descuento : 0,
    iva: typeof item?.iva === 'number' ? item.iva : 0,
    en_stock: typeof item?.en_stock === 'boolean' ? item.en_stock : true,
    cubierto_garantia: typeof item?.cubierto_garantia === 'boolean' ? item.cubierto_garantia : false,
    motivo_garantia: typeof item?.motivo_garantia === 'string' ? item.motivo_garantia : '',
  };
}

// ============================================================================
// Hook: useRepuestosOrden
// Fuente única de verdad para repuestos de una orden.
//
// - `repuestos_diagnostico` (columna JSONB en ordenes) es la fuente canónica
//   de la lista base de repuestos (código, descripción, cantidad, justificación).
// - `repuestos_cotizacion` solo agrega campos de pricing (precio, descuento,
//   iva, en_stock) y siempre se sincroniza con la base de diagnóstico.
//
// Guardado inmediato en agregar/eliminar. Debounce de 1.5s en edición de campos.
// ============================================================================

interface UseRepuestosOrdenOptions {
  ordenId: string;
  modeloId?: string;
  /** Datos de la orden (para leer repuestos_diagnostico inline si ya vienen) */
  orden?: any;
}

export function useRepuestosOrden({ ordenId, modeloId, orden }: UseRepuestosOrdenOptions) {
  const [repuestosBase, setRepuestosBase] = useState<RepuestoBase[]>([]);
  const [repuestosCotizacion, setRepuestosCotizacion] = useState<RepuestoCotizacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargado, setCargado] = useState(false);

  // Refs para evitar stale closures
  const repuestosBaseRef = useRef<RepuestoBase[]>([]);
  const repuestosCotizacionRef = useRef<RepuestoCotizacion[]>([]);
  const isSavingRef = useRef(false);
  const hasPendingSaveRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncBase = useCallback((items: RepuestoBase[]) => {
    repuestosBaseRef.current = items;
    setRepuestosBase(items);
  }, []);

  const syncCotizacion = useCallback((items: RepuestoCotizacion[]) => {
    repuestosCotizacionRef.current = items;
    setRepuestosCotizacion(items);
  }, []);

  // Reset al cambiar de orden
  useEffect(() => {
    syncBase([]);
    syncCotizacion([]);
    setCargado(false);
  }, [ordenId, syncBase, syncCotizacion]);

  // ============================================================================
  // Carga inicial
  // ============================================================================
  useEffect(() => {
    if (cargado || !ordenId) return;

    const cargar = async () => {
      setCargando(true);
      try {
        // 1. Intentar desde la prop orden (inline)
        if (orden && Array.isArray(orden.repuestos_diagnostico) && orden.repuestos_diagnostico.length > 0) {
          const base = normalizarListaRepuestosBase(orden.repuestos_diagnostico);
          syncBase(base);
          await cargarDatosCotizacion(base);
          setCargado(true);
          return;
        }

        // 2. Cargar desde BD
        const repuestosGuardados = await obtenerRepuestosDiagnostico(ordenId);
        if (repuestosGuardados && repuestosGuardados.length > 0) {
          const base = normalizarListaRepuestosBase(repuestosGuardados);
          syncBase(base);
          updateOrdenFields({ repuestos_diagnostico: base } as any);
          await cargarDatosCotizacion(base);
          setCargado(true);
          return;
        }

        // 3. Cargar del modelo
        if (modeloId) {
          const repuestosModelo = await obtenerRepuestosDelModelo(modeloId);
          if (repuestosModelo && repuestosModelo.length > 0) {
            const base = normalizarListaRepuestosBase(
              repuestosModelo.map((r: any) => ({
                codigo: r.codigo || '',
                descripcion: r.descripcion || '',
                cantidad: r.cantidad || 1,
                pieza_causante: r.causante || '',
              }))
            );
            syncBase(base);
            // Guardar inmediatamente
            await guardarRepuestosDiagnostico(ordenId, base);
            updateOrdenFields({ repuestos_diagnostico: base } as any);
          }
        }
      } catch (error) {
        console.error('❌ Error al cargar repuestos:', error);
      } finally {
        setCargando(false);
        setCargado(true);
      }
    };

    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenId, modeloId, cargado]);

  /**
   * Carga datos de cotización existentes y los sincroniza con la base de diagnóstico.
   * Si hay repuestos en cotización, los mergea con la base para mantener consistencia.
   */
  const cargarDatosCotizacion = async (base: RepuestoBase[]) => {
    try {
      const cotizacionExistente = await obtenerRepuestosCotizacion(ordenId);
      if (cotizacionExistente && cotizacionExistente.length > 0) {
        // Crear un mapa de datos de cotización por código+descripción
        const cotizacionMap = new Map<string, any>();
        cotizacionExistente.forEach((r: any) => {
          const key = `${r.codigo}||${r.descripcion}`;
          cotizacionMap.set(key, r);
        });

        // Mergear: base de diagnóstico + datos de pricing de cotización
        const mergeados = base.map((rb) => {
          const key = `${rb.codigo}||${rb.descripcion}`;
          const cotData = cotizacionMap.get(key);
          return normalizarRepuestoCotizacion({
            ...rb,
            cantidad: Number(rb.cantidad) || 1,
            precio_unitario: cotData?.precio_unitario ?? 0,
            descuento: cotData?.descuento ?? 0,
            iva: cotData?.iva ?? 0,
            en_stock: cotData?.en_stock ?? true,
            cubierto_garantia: cotData?.cubierto_garantia ?? false,
            motivo_garantia: cotData?.motivo_garantia ?? '',
          });
        });
        syncCotizacion(mergeados);
      } else {
        // No hay cotización, crear desde base con precios en 0
        const iniciales = base.map((rb) =>
          normalizarRepuestoCotizacion({
            ...rb,
            cantidad: Number(rb.cantidad) || 1,
            precio_unitario: 0,
            descuento: 0,
            iva: 0,
            en_stock: true,
            cubierto_garantia: false,
            motivo_garantia: '',
          })
        );
        syncCotizacion(iniciales);
      }
    } catch (error) {
      console.error('❌ Error al cargar datos de cotización:', error);
    }
  };

  // ============================================================================
  // Guardado inmediato de repuestos base (diagnóstico)
  // ============================================================================
  const guardarBaseInmediato = async (items: RepuestoBase[]) => {
    try {
      await ejecutarConReintentos(
        () => guardarRepuestosDiagnostico(ordenId, items),
        2,
        'guardar repuestos base'
      );
      updateOrdenFields({ repuestos_diagnostico: items } as any);
      console.log('💾 Repuestos base guardados:', items.length);
    } catch (error) {
      console.error('❌ Error al guardar repuestos base:', error);
    }
  };

  // ============================================================================
  // Guardado con debounce para edición de campos
  // ============================================================================
  const guardarBaseConDebounce = useCallback(
    (items: RepuestoBase[]) => {
      hasPendingSaveRef.current = true;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        try {
          const current = repuestosBaseRef.current;
          await ejecutarConReintentos(
            () => guardarRepuestosDiagnostico(ordenId, current),
            2,
            'debounce guardar repuestos base'
          );
          updateOrdenFields({ repuestos_diagnostico: current } as any);
          hasPendingSaveRef.current = false;
          console.log('💾 Repuestos base guardados (debounce):', current.length);
        } catch (error) {
          console.error('❌ Error debounce guardar repuestos base:', error);
        } finally {
          isSavingRef.current = false;
        }
      }, 1500);
    },
    [ordenId]
  );

  // Flush al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (hasPendingSaveRef.current) {
        const current = repuestosBaseRef.current;
        guardarRepuestosDiagnostico(ordenId, current)
          .then(() => {
            updateOrdenFields({ repuestos_diagnostico: current } as any);
            console.log('💾 Flush repuestos base al desmontar');
          })
          .catch((err) => console.error('❌ Error flush repuestos base:', err));
      }
    };
  }, [ordenId]);

  // ============================================================================
  // Operaciones de diagnóstico (repuestos base)
  // ============================================================================

  const agregarRepuesto = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const nuevo: RepuestoBase = { codigo: '', descripcion: '', cantidad: '1', pieza_causante: '' };
    const nuevos = [...repuestosBaseRef.current, nuevo];
    syncBase(nuevos);
    // También agregar a cotización
    const nuevoCot: RepuestoCotizacion = {
      ...nuevo,
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      iva: 0,
      en_stock: true,
      cubierto_garantia: false,
      motivo_garantia: '',
    };
    syncCotizacion([...repuestosCotizacionRef.current, nuevoCot]);
    await guardarBaseInmediato(nuevos);
  };

  const eliminarRepuesto = async (index: number) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const nuevosBase = repuestosBaseRef.current.filter((_, i) => i !== index);
    const nuevosCot = repuestosCotizacionRef.current.filter((_, i) => i !== index);
    syncBase(nuevosBase);
    syncCotizacion(nuevosCot);
    await guardarBaseInmediato(nuevosBase);
  };

  const actualizarRepuestoBase = (index: number, campo: keyof RepuestoBase, valor: any) => {
    if (!repuestosBaseRef.current[index]) return;
    const nuevos = [...repuestosBaseRef.current];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    syncBase(nuevos);

    // Sincronizar campo en cotización también
    if (repuestosCotizacionRef.current[index]) {
      const nuevosCot = [...repuestosCotizacionRef.current];
      if (campo === 'cantidad') {
        nuevosCot[index] = { ...nuevosCot[index], [campo]: Number(valor) || 1 };
      } else {
        nuevosCot[index] = { ...nuevosCot[index], [campo]: valor };
      }
      syncCotizacion(nuevosCot);
    }

    guardarBaseConDebounce(nuevos);
  };

  // ============================================================================
  // Operaciones de cotización (campos de pricing)
  // ============================================================================

  const actualizarRepuestoCotizacion = (
    index: number,
    campo: keyof RepuestoCotizacion,
    valor: any
  ) => {
    if (!repuestosCotizacionRef.current[index]) return;
    const nuevosCot = [...repuestosCotizacionRef.current];
    nuevosCot[index] = { ...nuevosCot[index], [campo]: valor };
    syncCotizacion(nuevosCot);

    // Si se cambia un campo base, sincronizar también
    const camposBase: (keyof RepuestoBase)[] = ['codigo', 'descripcion', 'cantidad', 'pieza_causante'];
    if (camposBase.includes(campo as keyof RepuestoBase)) {
      const nuevosBase = [...repuestosBaseRef.current];
      if (nuevosBase[index]) {
        if (campo === 'cantidad') {
          nuevosBase[index] = { ...nuevosBase[index], [campo]: valor };
        } else {
          nuevosBase[index] = { ...nuevosBase[index], [campo]: valor };
        }
        syncBase(nuevosBase);
        guardarBaseConDebounce(nuevosBase);
      }
    }
  };

  // ============================================================================
  // Flush manual (para botón Guardar)
  // ============================================================================
  const flushRepuestos = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const currentBase = repuestosBaseRef.current;
    await ejecutarConReintentos(
      () => guardarRepuestosDiagnostico(ordenId, currentBase),
      3,
      'flush manual repuestos base'
    );
    updateOrdenFields({ repuestos_diagnostico: currentBase } as any);
    hasPendingSaveRef.current = false;
  };

  /** Forzar recarga desde BD */
  const recargar = () => {
    setCargado(false);
  };

  return {
    // Estado
    repuestosBase,
    repuestosCotizacion,
    cargando,
    cargado,

    // Refs (para acceso sin stale closures en callbacks)
    repuestosBaseRef,
    repuestosCotizacionRef,

    // Operaciones base (diagnóstico)
    agregarRepuesto,
    eliminarRepuesto,
    actualizarRepuestoBase,

    // Operaciones cotización
    actualizarRepuestoCotizacion,
    syncCotizacion,

    // Utilidades
    flushRepuestos,
    recargar,
    guardarBaseInmediato,
  };
}
