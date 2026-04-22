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
}

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
  };
}

interface UseRepuestosOrdenOptions {
  ordenId: string;
  modeloId?: string;
  orden?: any;
}

export function useRepuestosOrden({ ordenId, modeloId, orden }: UseRepuestosOrdenOptions) {
  const [repuestosBase, setRepuestosBase] = useState<RepuestoBase[]>([]);
  const [repuestosCotizacion, setRepuestosCotizacion] = useState<RepuestoCotizacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargado, setCargado] = useState(false);

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

  useEffect(() => {
    syncBase([]);
    syncCotizacion([]);
    setCargado(false);
  }, [ordenId, syncBase, syncCotizacion]);

  useEffect(() => {
    if (cargado || !ordenId) return;

    const cargar = async () => {
      setCargando(true);
      try {
        if (orden && Array.isArray(orden.repuestos_diagnostico) && orden.repuestos_diagnostico.length > 0) {
          const base = normalizarListaRepuestosBase(orden.repuestos_diagnostico);
          syncBase(base);
          await cargarDatosCotizacion(base);
          setCargado(true);
          return;
        }

        const repuestosGuardados = await obtenerRepuestosDiagnostico(ordenId);
        if (repuestosGuardados && repuestosGuardados.length > 0) {
          const base = normalizarListaRepuestosBase(repuestosGuardados);
          syncBase(base);
          updateOrdenFields({ repuestos_diagnostico: base } as any);
          await cargarDatosCotizacion(base);
          setCargado(true);
          return;
        }

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
  }, [ordenId, modeloId, cargado]);

  const cargarDatosCotizacion = async (base: RepuestoBase[]) => {
    try {
      const cotizacionExistente = await obtenerRepuestosCotizacion(ordenId);
      if (cotizacionExistente && cotizacionExistente.length > 0) {
        const cotizacionMap = new Map<string, any>();
        cotizacionExistente.forEach((r: any) => {
          const key = `${r.codigo}||${r.descripcion}`;
          cotizacionMap.set(key, r);
        });

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
          });
        });
        syncCotizacion(mergeados);
      } else {
        const iniciales = base.map((rb) =>
          normalizarRepuestoCotizacion({
            ...rb,
            cantidad: Number(rb.cantidad) || 1,
            precio_unitario: 0,
            descuento: 0,
            iva: 0,
            en_stock: true,
          })
        );
        syncCotizacion(iniciales);
      }
    } catch (error) {
      console.error('❌ Error al cargar datos de cotización:', error);
    }
  };

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

  const agregarRepuesto = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const nuevo: RepuestoBase = { codigo: '', descripcion: '', cantidad: '1', pieza_causante: '' };
    const nuevos = [...repuestosBaseRef.current, nuevo];
    syncBase(nuevos);
    const nuevoCot: RepuestoCotizacion = {
      ...nuevo,
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      iva: 0,
      en_stock: true,
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

  const actualizarRepuestoCotizacion = (
    index: number,
    campo: keyof RepuestoCotizacion,
    valor: any
  ) => {
    if (!repuestosCotizacionRef.current[index]) return;
    const nuevosCot = [...repuestosCotizacionRef.current];
    nuevosCot[index] = { ...nuevosCot[index], [campo]: valor };
    syncCotizacion(nuevosCot);

    const camposBase: (keyof RepuestoBase)[] = ['codigo', 'descripcion', 'cantidad', 'pieza_causante'];
    if (camposBase.includes(campo as keyof RepuestoBase)) {
      const nuevosBase = [...repuestosBaseRef.current];
      if (nuevosBase[index]) {
        nuevosBase[index] = { ...nuevosBase[index], [campo]: valor };
        syncBase(nuevosBase);
        guardarBaseConDebounce(nuevosBase);
      }
    }
  };

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

  const recargar = () => {
    setCargado(false);
  };

  return {
    repuestosBase,
    repuestosCotizacion,
    cargando,
    cargado,
    repuestosBaseRef,
    repuestosCotizacionRef,
    agregarRepuesto,
    eliminarRepuesto,
    actualizarRepuestoBase,
    actualizarRepuestoCotizacion,
    syncCotizacion,
    flushRepuestos,
    recargar,
    guardarBaseInmediato,
  };
}
