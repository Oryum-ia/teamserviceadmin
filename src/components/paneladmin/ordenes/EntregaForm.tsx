"use client";

import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, MessageCircle } from 'lucide-react';
import { notificarCambioFaseWhatsApp } from '@/lib/whatsapp/whatsappNotificationHelper';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import { convertirDatetimeLocalColombiaAUTC } from '@/lib/utils/dateUtils';
import { subirMultiplesImagenes, eliminarImagenOrden, descargarImagen, actualizarFotosEntrega } from '@/lib/services/imagenService';
import ImagenViewer from './ImagenViewer';
import DropZoneImagenes from './DropZoneImagenes';
import { FirmaDisplay } from '@/components/FirmaPad';
import { updateOrdenFields } from '@/lib/ordenLocalStorage';

interface EntregaFormProps {
  orden: any;
  onSuccess: () => void;
  faseIniciada?: boolean;
}

export default function EntregaForm({ orden, onSuccess, faseIniciada = true }: EntregaFormProps) {
  const { theme } = useTheme();
  const toast = useToast();

  // Fotos de entrega
  const [fotos, setFotos] = useState<string[]>(orden.fotos_entrega || []);
  const [subiendoFotos, setSubiendoFotos] = useState(false);

  // ID del técnico que entrega (inicializado con el de la orden o null)
  const [tecnicoEntregaId, setTecnicoEntregaId] = useState<string>(orden.tecnico_entrega || '');
  const [usuarioEntregaNombre, setUsuarioEntregaNombre] = useState('');

  // Sincronizar usuario actual si no hay técnico asignado
  useEffect(() => {
    const obtenerUsuarioActual = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          if (!orden.tecnico_entrega && !tecnicoEntregaId) {
            setTecnicoEntregaId(authData.user.id);
          }
          if (!usuarioEntregaNombre) {
            setUsuarioEntregaNombre(authData.user.email || '');
          }
        }
      } catch (error) {
        console.error('Error al obtener usuario actual:', error);
      }
    };
    obtenerUsuarioActual();
  }, [orden.tecnico_entrega]);

  // Lista de usuarios para entrega (con caché)
  const [tecnicos, setTecnicos] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('usuarios_entrega_lista');
      if (cached) {
        try { return JSON.parse(cached); } catch (e) { return []; }
      }
    }
    return [];
  });

  // Cargar lista de usuarios
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const cached = localStorage.getItem('usuarios_entrega_lista');
        if (cached) return;

        const { supabase } = await import('@/lib/supabaseClient');
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nombre, email')
          // .in('rol', ['tecnico', 'super-admin']) // Se eliminó filtro por petición del usuario
          .order('nombre');

        if (!error && data) {
          setTecnicos(data);
          localStorage.setItem('usuarios_entrega_lista', JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    };
    cargarUsuarios();
  }, []);

  // Helper para formatear fecha en formato compatible con input datetime-local (hora Colombia)
  const formatForInput = (date: Date) => {
    // Usar Intl para obtener fecha/hora en zona Colombia
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    // Formato sv-SE genera YYYY-MM-DD HH:mm, convertir a formato datetime-local
    const formatted = formatter.format(date);
    return formatted.replace(' ', 'T');
  };

  // Helper para formatear fecha en formato YYYY-MM-DD para input type="date"
  const formatDateForInput = (date: Date | string | null) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(dateObj);
  };

  const tipoEntregaInicial = orden.entrega?.tipo_entrega
    ? orden.entrega.tipo_entrega
    : orden.aprobado_cliente === true
      ? 'Reparado'
      : 'Devuelto';

  const [formData, setFormData] = useState({
    tipo_entrega: tipoEntregaInicial,
    fecha_entrega: orden.fecha_entrega ? formatForInput(new Date(orden.fecha_entrega)) : formatForInput(new Date()),
    fecha_proximo_mantenimiento: formatDateForInput(orden.fecha_proximo_mantenimiento),
    calificacion: (orden.entrega?.calificacion ?? orden.calificacion) || '',
    comentarios_cliente: (orden.entrega?.comentarios_cliente ?? orden.comentarios_cliente) || ''
  });

  useEffect(() => {
    const tipoEntrega = orden.entrega?.tipo_entrega
      ? orden.entrega.tipo_entrega
      : orden.aprobado_cliente === true
        ? 'Reparado'
        : 'Devuelto';

    setFormData(prev => ({
      ...prev,
      tipo_entrega: tipoEntrega,
      fecha_entrega: orden.fecha_entrega
        ? formatForInput(new Date(orden.fecha_entrega))
        : prev.fecha_entrega || formatForInput(new Date()),
      fecha_proximo_mantenimiento: formatDateForInput(orden.fecha_proximo_mantenimiento),
      calificacion: (orden.entrega?.calificacion ?? orden.calificacion) || '',
      comentarios_cliente: (orden.entrega?.comentarios_cliente ?? orden.comentarios_cliente) || ''
    }));
  }, [
    orden.id,
    orden.entrega?.tipo_entrega,
    orden.aprobado_cliente,
    orden.fecha_entrega,
    orden.fecha_proximo_mantenimiento,
    orden.entrega?.calificacion,
    orden.entrega?.comentarios_cliente,
    orden.calificacion,
    orden.comentarios_cliente
  ]);

  // Exponer función para guardar datos desde el padre
  React.useEffect(() => {
    (window as any).guardarDatosEntrega = async () => {
      // Los datos de entrega se guardan automáticamente con onBlur en los campos
      // Esta función solo confirma que todo está guardado
      console.log('✅ Datos de entrega confirmados (guardado automático)');
      return {
        tipo_entrega: formData.tipo_entrega,
        fecha_entrega: formData.fecha_entrega,
        fecha_proximo_mantenimiento: formData.fecha_proximo_mantenimiento,
        tecnico_entrega: tecnicoEntregaId
      };
    };

    return () => {
      delete (window as any).guardarDatosEntrega;
    };
  }, [formData, tecnicoEntregaId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    // Validar archivos
    const MAX_SIZE = 300 * 1024 * 1024; // 300MB
    const archivosValidos: File[] = [];
    const archivosInvalidos: string[] = [];

    files.forEach(file => {
      // Validar tipo
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        archivosInvalidos.push(`${file.name} (Tipo no válido)`);
        return;
      }
      
      // Validar tamaño
      if (file.size > MAX_SIZE) {
        archivosInvalidos.push(`${file.name} (Excede 300MB)`);
        return;
      }

      archivosValidos.push(file);
    });

    if (archivosInvalidos.length > 0) {
      toast.error(`Algunos archivos no se pudieron subir:\n${archivosInvalidos.join('\n')}`);
    }

    if (archivosValidos.length === 0) return;

    setSubiendoFotos(true);
    try {
      const urls = await subirMultiplesImagenes(orden.id, archivosValidos, 'entrega');
      const nuevasFotos = [...fotos, ...urls];
      setFotos(nuevasFotos);

      // Guardar en la base de datos inmediatamente
      await actualizarFotosEntrega(orden.id, nuevasFotos);

      toast.success(`${files.length} foto(s) subida(s) exitosamente`);
    } catch (error) {
      console.error('Error al subir fotos:', error);
      toast.error('Error al subir las fotos');
    } finally {
      setSubiendoFotos(false);
    }
  };

  const handleEliminarFoto = async (url: string, index: number) => {
    try {
      // Eliminar del storage
      await eliminarImagenOrden(url);

      // Actualizar estado local
      const nuevasFotos = fotos.filter((_, i) => i !== index);
      setFotos(nuevasFotos);

      // Actualizar en la base de datos
      await actualizarFotosEntrega(orden.id, nuevasFotos);

      toast.success('Foto eliminada');
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      toast.error('Error al eliminar la foto');
    }
  };

  const handleDescargarFoto = async (url: string, index: number) => {
    try {
      const nombreArchivo = `entrega-${orden.codigo}-foto-${index + 1}.jpg`;
      await descargarImagen(url, nombreArchivo);
      toast.success('Foto descargada');
    } catch (error) {
      console.error('Error al descargar foto:', error);
      toast.error('Error al descargar la foto');
    }
  };

  // Mostrar firma proveniente de otro lugar (solo lectura)
  const [firmaEntrega, setFirmaEntrega] = useState<string | null>(orden.firma_entrega || null);
  const [fechaFirmaEntrega, setFechaFirmaEntrega] = useState<string | null>(orden.fecha_firma_entrega || null);

  useEffect(() => {
    setFirmaEntrega(orden.firma_entrega || null);
    setFechaFirmaEntrega(orden.fecha_firma_entrega || null);
  }, [orden.firma_entrega, orden.fecha_firma_entrega]);

  const puedeEditar = orden.estado_actual === 'Entrega' && faseIniciada;

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4 sm:gap-0">
        <div>
          <h2 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
            Entrega
          </h2>
          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
            Finalice y entregue la orden al cliente
          </p>
        </div>
        <button
          type="button"
          onClick={() => notificarCambioFaseWhatsApp(orden.id, 'Entrega')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm"
        >
          <MessageCircle className="w-5 h-5" />
          <span>WhatsApp</span>
        </button>
      </div>

      {!faseIniciada && orden.estado_actual === 'Entrega' && (
        <div className={`mb-6 p-4 rounded-lg border ${theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/20 border-amber-800'
          }`}>
          <p className={`text-sm font-medium ${theme === 'light' ? 'text-amber-800' : 'text-amber-300'
            }`}>
            ⚠️ Debe presionar "Iniciar Fase" para comenzar a trabajar en esta entrega.
          </p>
        </div>
      )}

      {/* Mensaje de devolución por no aceptación */}
      {!orden.aprobado_cliente && (
        <div className={`mb-6 p-6 rounded-lg border ${theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-800'
          }`}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className={`text-sm font-medium ${theme === 'light' ? 'text-red-800' : 'text-red-300'
              }`}>
              El cliente no aceptó la cotización. Este equipo será devuelto sin reparación.
            </p>
          </div>

          {/* Tabla de Cobro - Solo Revisión */}
          {orden.valor_revision > 0 && (
            <div className={`mt-4 rounded-lg border overflow-x-auto ${theme === 'light' ? 'bg-white border-red-300' : 'bg-gray-800 border-red-700'
              }`}>
              <div className={`px-4 py-3 font-semibold ${theme === 'light' ? 'bg-red-100 text-red-900' : 'bg-red-900/40 text-red-200'
                }`}>
                💵 Cobro por Revisión
              </div>
              <div className="p-4">
                <table className="w-full">
                  <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
                    }`}>
                    <tr>
                      <td className={`py-2 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                        }`}>Valor de Revisión Técnica</td>
                      <td className={`py-2 text-sm font-medium text-right ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                        }`}>
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(orden.valor_revision)}
                      </td>
                    </tr>
                    <tr className={`border-t-2 ${theme === 'light' ? 'border-red-300' : 'border-red-700'
                      }`}>
                      <td className={`py-3 text-base font-bold ${theme === 'light' ? 'text-red-900' : 'text-red-200'
                        }`}>TOTAL A PAGAR</td>
                      <td className={`py-3 text-xl font-bold text-right ${theme === 'light' ? 'text-red-700' : 'text-red-400'
                        }`}>
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(orden.valor_revision)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className={`text-xs mt-3 italic ${theme === 'light' ? 'text-red-700' : 'text-red-400'
                  }`}>
                  ⚠️ Solo se cobra el valor de revisión porque el cliente rechazó la reparación.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mensaje y factura de aceptación */}
      {orden.aprobado_cliente && orden.total > 0 && (
        <div className={`mb-6 p-6 rounded-lg border ${theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-800'
          }`}>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-sm font-medium ${theme === 'light' ? 'text-green-800' : 'text-green-300'
              }`}>
              El cliente aceptó la cotización. Equipo reparado.
            </p>
          </div>

          {/* Tabla de Factura - Cliente Aceptó */}
          <div className={`mt-4 rounded-lg border overflow-x-auto ${theme === 'light' ? 'bg-white border-green-300' : 'bg-gray-800 border-green-700'
            }`}>
            <div className={`px-4 py-3 font-semibold ${theme === 'light' ? 'bg-green-100 text-green-900' : 'bg-green-900/40 text-green-200'
              }`}>
              💵 Factura a Cobrar
            </div>
            <div className="p-4">
              <table className="w-full">
                <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'
                  }`}>
                  <tr>
                    <td className={`py-2 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>Subtotal (Repuestos y Servicios)</td>
                    <td className={`py-2 text-sm font-medium text-right ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(orden.subtotal || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className={`py-2 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>IVA</td>
                    <td className={`py-2 text-sm font-medium text-right ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                      }`}>
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(orden.iva || 0)}
                    </td>
                  </tr>
                  <tr className={`border-t-2 ${theme === 'light' ? 'border-green-300' : 'border-green-700'
                    }`}>
                    <td className={`py-3 text-base font-bold ${theme === 'light' ? 'text-green-900' : 'text-green-200'
                      }`}>TOTAL A PAGAR</td>
                    <td className={`py-3 text-xl font-bold text-right ${theme === 'light' ? 'text-green-700' : 'text-green-400'
                      }`}>
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(orden.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className={`text-xs mt-3 italic ${theme === 'light' ? 'text-green-700' : 'text-green-400'
                }`}>
                ✅ El valor de revisión NO se cobra porque el cliente aceptó la reparación.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Grid de campos principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de entrega */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
              Tipo de entrega <span className="text-red-500">*</span>
            </label>
            <div className={`w-full px-4 py-3 border rounded-lg ${theme === 'light'
                ? 'border-gray-300 bg-gray-100 text-gray-600'
                : 'border-gray-600 bg-gray-800 text-gray-400'
              }`}>
              {formData.tipo_entrega === 'Reparado' ? 'Reparado' : 'Devuelto (cliente no aceptó reparación)'}
            </div>
          </div>

          {/* Usuario que entrega */}
          <div className={`rounded-lg border p-4 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
            }`}>
            <label className={`block text-xs font-medium mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
              Usuario que entrega
            </label>
            <select
              value={tecnicoEntregaId}
              onChange={async (e) => {
                const newValue = e.target.value;
                setTecnicoEntregaId(newValue);
                // Guardar inmediatamente
                try {
                  const { supabase } = await import('@/lib/supabaseClient');
                  await supabase
                    .from('ordenes')
                    .update({ tecnico_entrega: newValue, ultima_actualizacion: crearTimestampColombia() })
                    .eq('id', orden.id);
                  toast.success('Usuario de entrega actualizado');
                } catch (err) {
                  console.error(err);
                  toast.error('Error al actualizar usuario');
                }
              }}
              disabled={!puedeEditar}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-800 text-gray-100'
                } disabled:opacity-50`}
            >
              <option value="">Seleccionar...</option>
              {tecnicos.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.nombre || tech.email || 'Sin nombre'}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de entrega (editable) */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
              Fecha de entrega
            </label>
            <input
              type="datetime-local"
              name="fecha_entrega"
              value={formData.fecha_entrega}
              onChange={handleChange}
              onBlur={async () => {
                try {
                  const { supabase } = await import('@/lib/supabaseClient');
                  const iso = convertirDatetimeLocalColombiaAUTC(formData.fecha_entrega);
                  const { error } = await supabase
                    .from('ordenes')
                    .update({ fecha_entrega: iso, ultima_actualizacion: crearTimestampColombia() })
                    .eq('id', orden.id);
                  if (error) throw error;
                  updateOrdenFields({ fecha_entrega: iso } as any);
                  toast.success('Fecha de entrega actualizada');
                } catch (e) {
                  console.error(e);
                  toast.error('Error al actualizar la fecha de entrega');
                }
              }}
              disabled={!puedeEditar}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>

          {/* Fecha próximo mantenimiento - Solo si fue reparado */}
          {orden.aprobado_cliente && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                }`}>
                Fecha próximo mantenimiento
              </label>
              <input
                type="date"
                name="fecha_proximo_mantenimiento"
                value={formData.fecha_proximo_mantenimiento}
                onChange={handleChange}
                onBlur={async () => {
                  if (!formData.fecha_proximo_mantenimiento) return;
                  try {
                    const { supabase } = await import('@/lib/supabaseClient');
                    // Convertir fecha YYYY-MM-DD a ISO timestamp (medianoche en Colombia)
                    const fechaISO = `${formData.fecha_proximo_mantenimiento}T00:00:00`;
                    const fechaUTC = convertirDatetimeLocalColombiaAUTC(fechaISO);
                    const { error } = await supabase
                      .from('ordenes')
                      .update({
                        fecha_proximo_mantenimiento: fechaUTC,
                        ultima_actualizacion: crearTimestampColombia()
                      })
                      .eq('id', orden.id);
                    if (error) throw error;
                    toast.success('Fecha de mantenimiento actualizada');
                  } catch (e) {
                    console.error(e);
                    toast.error('Error al actualizar la fecha de mantenimiento');
                  }
                }}
                disabled={!puedeEditar}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-gray-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {formData.fecha_proximo_mantenimiento && (
                <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                  🔔 Se enviará un recordatorio automático un día antes
                </p>
              )}
            </div>
          )}
        </div>

        {/* Fotos de entrega */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3 sm:gap-0">
            <label className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
              Fotos de entrega {fotos.length > 0 && `(${fotos.length})`}
            </label>

            {/* Botón de subir fotos */}
            {puedeEditar && (
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${subiendoFotos
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60'
                  : theme === 'light'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                }`}>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      handleFilesSelected(files);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                  disabled={subiendoFotos || !puedeEditar}
                />
                <Upload className="w-4 h-4" />
                <span>{subiendoFotos ? 'Subiendo...' : 'Subir fotos'}</span>
              </label>
            )}
          </div>

          {/* Visualizador de imágenes con drag & drop integrado */}
          {fotos.length > 0 ? (
            <ImagenViewer
              imagenes={fotos}
              onEliminar={puedeEditar ? handleEliminarFoto : undefined}
              onDescargar={handleDescargarFoto}
              puedeEditar={puedeEditar}
              onFilesDropped={puedeEditar ? handleFilesSelected : undefined}
              isUploading={subiendoFotos}
            />
          ) : (
            puedeEditar && (
              <DropZoneImagenes
                onFilesSelected={handleFilesSelected}
                isUploading={subiendoFotos}
                disabled={!puedeEditar}
              />
            )
          )}
        </div>

        {/* Cuidados de Uso del Modelo */}
        {orden.equipo?.modelo?.cuidado_uso && (
          <div className={`rounded-lg border p-6 ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-700'
            }`}>
            <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${theme === 'light' ? 'text-blue-900' : 'text-blue-300'
              }`}>
              <AlertCircle className="w-5 h-5" />
              Cuidados de Uso - {orden.equipo?.modelo?.equipo || 'Equipo'}
            </h3>
            <div className={`text-sm whitespace-pre-wrap ${theme === 'light' ? 'text-blue-800' : 'text-blue-200'
              }`}>
              {orden.equipo.modelo.cuidado_uso}
            </div>
            <p className={`text-xs mt-3 italic ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'
              }`}>
              💡 Esta información se mostrará al cliente en la página de seguimiento
            </p>
          </div>
        )}

        {/* Firma de Entrega (solo visualización) */}
        <div>
          <h3 className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
            Firma de Entrega
          </h3>
          {firmaEntrega ? (
            <div>
              <FirmaDisplay
                firmaBase64={firmaEntrega}
                titulo="Firma del Cliente - Entrega"
                className=""
              />
              {fechaFirmaEntrega && (
                <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                  Fecha de firma: {new Date(fechaFirmaEntrega).toLocaleString('es-CO')}
                </p>
              )}
            </div>
          ) : (
            <div className={`rounded-lg border p-6 text-center ${theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-800'
              }`}>
              <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${theme === 'light' ? 'text-red-400' : 'text-red-500'
                }`} />
              <p className={`font-medium mb-1 ${theme === 'light' ? 'text-red-900' : 'text-red-300'
                }`}>
                Sin firma de entrega
              </p>
              <p className={`text-sm ${theme === 'light' ? 'text-red-700' : 'text-red-400'
                }`}>
                El cliente debe firmar desde la página web
              </p>
            </div>
          )}
        </div>

        {/* Calificación de la orden */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
            Calificación de la orden
          </label>
          <input
            type="number"
            name="calificacion"
            value={formData.calificacion}
            onChange={handleChange}
            min="1"
            max="5"
            step="0.1"
            placeholder="Calificación (1-5)"
            disabled
            className={`w-full px-4 py-3 border rounded-lg ${theme === 'light'
                ? 'border-gray-300 bg-gray-100 text-gray-600'
                : 'border-gray-600 bg-gray-800 text-gray-400'
              }`}
          />
        </div>

        {/* Comentarios del cliente */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
            Comentarios del cliente
          </label>
          <textarea
            name="comentarios_cliente"
            value={formData.comentarios_cliente || orden.comentarios_cliente}
            onChange={handleChange}
            rows={4}
            placeholder="Comentarios del cliente sobre el servicio..."
            disabled
            spellCheck={true}
            lang="es"
            className={`w-full px-4 py-3 border rounded-lg ${theme === 'light'
                ? 'border-gray-300 bg-gray-100 text-gray-600'
                : 'border-gray-600 bg-gray-800 text-gray-400'
              }`}
          />
        </div>
      </div>
    </div>
  );
}
