/**
 * Servicio de generación de PDF para órdenes de servicio
 * Usa jsPDF + jspdf-autotable para crear documentos profesionales
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/utils/pricing.utils';
import { formatearFechaColombiaCorta } from '@/lib/utils/dateUtils';
import { obtenerOrdenPorId } from '@/lib/services/ordenService';

// ============================================================================
// TIPOS
// ============================================================================

interface OrdenPDF {
  // Datos generales
  id: string;
  codigo: string;
  estado_actual: string;
  tipo_orden: string;
  es_retrabajo?: boolean;
  fecha_creacion: string;
  ultima_actualizacion?: string;
  nota_orden?: string;

  // Cliente
  cliente?: {
    nombre?: string;
    nombre_comercial?: string;
    razon_social?: string;
    es_juridica?: boolean;
    email?: string;
    celular?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    nit_cedula?: string;
  };

  // Equipo
  equipo?: {
    serie_pieza?: string;
    descripcion?: string;
    modelo?: {
      equipo?: string;
      referencia?: string;
      marca?: { nombre?: string };
    };
  };

  // Recepción
  descripcion_problema?: string;
  comentarios_recepcion?: string;
  esta_accesorios?: Array<{ nombre: string; estado: string }>;
  fotos_recepcion?: string[];
  terminos_aceptados?: boolean;
  fecha_aceptacion_terminos?: string;
  firma_cliente?: string;
  fecha_firma_cliente?: string;

  // Diagnóstico
  diagnostico?: {
    descripcion_problema?: string;
    estado_general?: string;
    observaciones?: string;
    comentarios?: string;
    notas_internas?: string[];
  };
  comentarios_diagnostico?: string;
  tecnico_diagnostico?: string;
  fecha_inicio_diagnostico?: string;
  fecha_fin_diagnostico?: string;
  repuestos_diagnostico?: Array<{
    codigo: string;
    descripcion: string;
    cantidad: string | number;
    pieza_causante?: string;
  }>;

  // Cotización
  cotizacion?: {
    tipo?: string;
    comentarios?: string;
    repuestos?: any[];
  };
  comentarios_cotizacion?: string;
  tecnico_cotiza?: string;
  valor_revision?: number;
  precio_envio?: number;
  total?: number;
  fecha_cotizacion?: string;
  envio_cotizacion?: boolean;
  aprobado_cliente?: boolean;
  fecha_aprobacion?: string;
  repuestos_cotizacion?: any;

  // Reparación
  comentarios_reparacion?: string;
  tecnico_repara?: string;
  fecha_inicio_reparacion?: string;
  fecha_fin_reparacion?: string;
  fotos_reparacion?: string[];

  // Entrega
  entrega?: {
    tipo_entrega?: string;
    calificacion?: string;
    comentarios_cliente?: string;
  };
  fecha_entrega?: string;
  tecnico_entrega?: string;
  fecha_proximo_mantenimiento?: string;
  fotos_entrega?: string[];
  firma_entrega?: string;
  fecha_firma_entrega?: string;

  // Diagnóstico fotos
  fotos_diagnostico?: string[];
}

// ============================================================================
// CONSTANTES DE ESTILO
// ============================================================================

const COLORS = {
  primary: [30, 58, 95] as [number, number, number],       // Azul oscuro (del logo)
  secondary: [218, 165, 32] as [number, number, number],   // Dorado (del logo)
  text: [51, 51, 51] as [number, number, number],
  textLight: [119, 119, 119] as [number, number, number],
  headerBg: [30, 58, 95] as [number, number, number],
  headerText: [255, 255, 255] as [number, number, number],
  rowAlt: [245, 247, 250] as [number, number, number],
  success: [34, 139, 34] as [number, number, number],
  danger: [220, 53, 69] as [number, number, number],
  warning: [255, 152, 0] as [number, number, number],
  border: [200, 200, 200] as [number, number, number],
  sectionBg: [240, 244, 248] as [number, number, number],
};

const MARGIN = 15;
const PAGE_WIDTH = 210; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ============================================================================
// FASES Y SU ORDEN
// ============================================================================

const FASES_ORDEN: Record<string, number> = {
  'Recepción': 0,
  'Diagnóstico': 1,
  'Cotización': 2,
  'Esperando repuestos': 2,
  'Esperando aceptación': 2,
  'Reparación': 3,
  'Entrega': 4,
  'Finalizada': 4,
  'Bodega': 5,
  'Chatarrizado': 5,
};

// ============================================================================
// HELPERS
// ============================================================================

function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return 'N/A';
  try {
    return formatearFechaColombiaCorta(fecha);
  } catch {
    return fecha;
  }
}

function getNombreCliente(cliente: any): string {
  if (!cliente) return 'N/A';
  if (cliente.es_juridica) {
    return cliente.razon_social || cliente.nombre_comercial || cliente.nombre || 'N/A';
  }
  return cliente.nombre || cliente.nombre_comercial || 'N/A';
}

function getEquipoInfo(orden: OrdenPDF): string {
  if (!orden.equipo) return 'N/A';
  const marca = orden.equipo.modelo?.marca?.nombre || '';
  const modelo = orden.equipo.modelo?.equipo || '';
  return marca && modelo ? `${marca} ${modelo}` : modelo || marca || 'N/A';
}

/**
 * Envuelve una Promise con un timeout. Si no resuelve a tiempo, retorna fallback.
 */
function conTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Convierte la imagen del logo a base64
 */
async function cargarLogoBase64(): Promise<string> {
  return conTimeout(
    new Promise<string>((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
          } else { resolve(''); }
        };
        img.onerror = () => resolve('');
        img.src = '/img/logo.jpg';
      } catch { resolve(''); }
    }),
    5000, ''
  );
}

/**
 * Descarga una imagen usando el proxy del servidor /api/storage/imagen-thumb.
 * El servidor descarga la original de Supabase, la comprime con sharp a WebP (~3-8KB).
 * Luego la convierte a JPEG base64 con <img>+canvas para jsPDF.
 * Timeout de 15s por imagen. Reintenta 1 vez si falla.
 */
function cargarThumbDesdeProxy(url: string): Promise<string> {
  return new Promise<string>((resolve) => {
    try {
      const proxyUrl = `/api/storage/imagen-thumb?url=${encodeURIComponent(url)}&w=120&q=30`;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.5));
          } else { resolve(''); }
        } catch { resolve(''); }
      };
      img.onerror = () => resolve('');
      img.src = proxyUrl;
    } catch { resolve(''); }
  });
}

async function descargarYComprimirImagen(url: string): Promise<string> {
  if (!url || url.length < 10) return '';
  // Primer intento via proxy
  let resultado = await conTimeout(cargarThumbDesdeProxy(url), 15000, '');
  if (resultado) return resultado;
  // Reintento
  console.warn('⚠️ Reintentando imagen:', url.substring(url.lastIndexOf('/') + 1));
  resultado = await conTimeout(cargarThumbDesdeProxy(url), 15000, '');
  if (!resultado) {
    console.warn('❌ Imagen no cargó tras 2 intentos:', url.substring(url.lastIndexOf('/') + 1));
  }
  return resultado;
}

/**
 * Tipo para almacenar todas las imágenes pre-descargadas
 */
interface ImagenesPreCargadas {
  fotos_recepcion: string[];
  fotos_diagnostico: string[];
  fotos_reparacion: string[];
  fotos_entrega: string[];
  firma_cliente: string;
  firma_entrega: string;
}

export type ProgressCallback = (mensaje: string, porcentaje: number) => void;

/**
 * Pre-descarga todas las imágenes necesarias para el PDF.
 * Timeout global de 45s. Si falla, retorna resultado parcial.
 */
async function preDescargarImagenes(orden: OrdenPDF, faseActual: number): Promise<ImagenesPreCargadas> {
  const resultado: ImagenesPreCargadas = {
    fotos_recepcion: [],
    fotos_diagnostico: [],
    fotos_reparacion: [],
    fotos_entrega: [],
    firma_cliente: orden.firma_cliente || '',
    firma_entrega: orden.firma_entrega || '',
  };

  try {
    const descargas: Promise<void>[] = [];

    if (faseActual >= 0 && orden.fotos_recepcion?.length) {
      console.log(`📥 Descargando ${orden.fotos_recepcion.length} fotos recepción...`);
      descargas.push(
        Promise.all(orden.fotos_recepcion.map(url => descargarYComprimirImagen(url)))
          .then(imgs => { resultado.fotos_recepcion = imgs.filter(Boolean); })
      );
    }

    if (faseActual >= 1 && orden.fotos_diagnostico?.length) {
      console.log(`📥 Descargando ${orden.fotos_diagnostico.length} fotos diagnóstico...`);
      descargas.push(
        Promise.all(orden.fotos_diagnostico.map(url => descargarYComprimirImagen(url)))
          .then(imgs => { resultado.fotos_diagnostico = imgs.filter(Boolean); })
      );
    }

    if (faseActual >= 3 && orden.fotos_reparacion?.length) {
      console.log(`📥 Descargando ${orden.fotos_reparacion.length} fotos reparación...`);
      descargas.push(
        Promise.all(orden.fotos_reparacion.map(url => descargarYComprimirImagen(url)))
          .then(imgs => { resultado.fotos_reparacion = imgs.filter(Boolean); })
      );
    }

    if (faseActual >= 4 && orden.fotos_entrega?.length) {
      console.log(`📥 Descargando ${orden.fotos_entrega.length} fotos entrega...`);
      descargas.push(
        Promise.all(orden.fotos_entrega.map(url => descargarYComprimirImagen(url)))
          .then(imgs => { resultado.fotos_entrega = imgs.filter(Boolean); })
      );
    }

    // Timeout global de 90s para dar tiempo a todas las fotos
    await conTimeout(Promise.all(descargas), 90000, undefined as any);

    const total = resultado.fotos_recepcion.length + resultado.fotos_diagnostico.length +
      resultado.fotos_reparacion.length + resultado.fotos_entrega.length;
    console.log(`✅ ${total} imágenes listas para PDF`);
  } catch (err) {
    console.warn('⚠️ Descarga de imágenes falló parcialmente:', err);
  }

  return resultado;
}

/**
 * Determina la fase numérica actual de la orden
 */
function getFaseActual(estado: string): number {
  return FASES_ORDEN[estado] ?? 0;
}

// ============================================================================
// GENERADOR PRINCIPAL
// ============================================================================

export async function generarPDFOrden(ordenParam: any, onProgress?: ProgressCallback): Promise<void> {
  const progress = onProgress || (() => {});

  try {
    // 1. Obtener datos frescos de la DB
    progress('Obteniendo datos de la orden...', 5);
    console.log('📄 Obteniendo datos frescos de la orden desde la DB...');
    let orden: OrdenPDF;
    try {
      orden = await obtenerOrdenPorId(ordenParam.id) as unknown as OrdenPDF;
      console.log('✅ Orden obtenida de DB:', orden.codigo, orden.estado_actual);
    } catch (err) {
      console.warn('No se pudo obtener orden fresca, usando datos locales:', err);
      orden = ordenParam as OrdenPDF;
    }

    const faseActual = getFaseActual(orden.estado_actual);
    console.log('📄 Fase actual:', faseActual, '- Estado:', orden.estado_actual);

    // 2. Pre-descargar imágenes (con timeout, no bloquea el PDF)
    progress('Descargando imágenes...', 15);
    let logoBase64 = '';
    let imagenes: ImagenesPreCargadas = {
      fotos_recepcion: [], fotos_diagnostico: [],
      fotos_reparacion: [], fotos_entrega: [],
      firma_cliente: orden.firma_cliente || '',
      firma_entrega: orden.firma_entrega || '',
    };

    try {
      const [logo, imgs] = await Promise.all([
        cargarLogoBase64(),
        preDescargarImagenes(orden, faseActual),
      ]);
      logoBase64 = logo;
      imagenes = imgs;
      console.log('✅ Imágenes descargadas. Logo:', logoBase64 ? 'Sí' : 'No');
    } catch (imgErr) {
      console.warn('⚠️ Falló descarga de imágenes, PDF se genera sin fotos:', imgErr);
    }

    // 3. Generar el PDF (ya con todas las imágenes en memoria)
    progress('Generando documento PDF...', 50);
    console.log('📄 Generando PDF...');
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = MARGIN;

    // ========== HEADER ==========
    progress('Dibujando encabezado...', 55);
    y = dibujarHeader(doc, orden, logoBase64, y);

    // ========== INFO GENERAL ==========
    y = dibujarInfoGeneral(doc, orden, y);

    // ========== RECEPCIÓN (siempre visible, fase 0+) ==========
    if (faseActual >= 0) {
      progress('Sección: Recepción...', 60);
      y = checkPageBreak(doc, y, 60);
      y = dibujarSeccionRecepcion(doc, orden, y, imagenes);
    }

    // ========== DIAGNÓSTICO (fase 1+) ==========
    if (faseActual >= 1) {
      progress('Sección: Diagnóstico...', 70);
      y = checkPageBreak(doc, y, 60);
      y = dibujarSeccionDiagnostico(doc, orden, y, imagenes);
    }

    // ========== COTIZACIÓN (fase 2+) ==========
    if (faseActual >= 2) {
      progress('Sección: Cotización...', 75);
      y = checkPageBreak(doc, y, 60);
      y = dibujarSeccionCotizacion(doc, orden, y);
    }

    // ========== REPARACIÓN (fase 3+) ==========
    if (faseActual >= 3) {
      progress('Sección: Reparación...', 80);
      y = checkPageBreak(doc, y, 40);
      y = dibujarSeccionReparacion(doc, orden, y, imagenes);
    }

    // ========== ENTREGA (fase 4+) ==========
    if (faseActual >= 4) {
      progress('Sección: Entrega...', 85);
      y = checkPageBreak(doc, y, 40);
      y = dibujarSeccionEntrega(doc, orden, y, imagenes);
    }

    // ========== FOOTER en cada página ==========
    progress('Finalizando documento...', 90);
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      dibujarFooter(doc, orden, i, totalPages);
    }

    // Guardar PDF
    progress('Descargando PDF...', 95);
    const nombreArchivo = `Orden_${orden.codigo || orden.id}_${orden.estado_actual.replace(/\s+/g, '_')}.pdf`;
    console.log('📄 Guardando PDF como:', nombreArchivo);
    doc.save(nombreArchivo);
    progress('PDF generado exitosamente', 100);
    console.log('✅ PDF generado:', nombreArchivo);

  } catch (error) {
    console.error('❌ Error crítico al generar PDF:', error);
    throw error;
  }
}

// ============================================================================
// HEADER
// ============================================================================

function dibujarHeader(doc: jsPDF, orden: OrdenPDF, logoBase64: string, y: number): number {
  // Fondo del header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 38, 'F');

  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', MARGIN, 5, 55, 16);
    } catch (e) {
      console.warn('No se pudo agregar el logo:', e);
    }
  }

  // Título derecho
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDEN DE SERVICIO', PAGE_WIDTH - MARGIN, 14, { align: 'right' });

  // Código de orden
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`# ${orden.codigo || 'S/N'}`, PAGE_WIDTH - MARGIN, 22, { align: 'right' });

  // Estado
  doc.setFontSize(9);
  const estadoText = `Estado: ${orden.estado_actual}`;
  doc.text(estadoText, PAGE_WIDTH - MARGIN, 30, { align: 'right' });

  // Línea dorada decorativa
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 38, PAGE_WIDTH, 2, 'F');

  return 46;
}

// ============================================================================
// INFO GENERAL
// ============================================================================

function dibujarInfoGeneral(doc: jsPDF, orden: OrdenPDF, y: number): number {
  // Cuadro de información general
  doc.setFillColor(...COLORS.sectionBg);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 36, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 36, 2, 2, 'S');

  const col1 = MARGIN + 4;
  const col2 = MARGIN + CONTENT_WIDTH / 2 + 4;
  let rowY = y + 6;

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.setFont('helvetica', 'normal');

  // Fila 1
  doc.text('CLIENTE', col1, rowY);
  doc.text('EQUIPO', col2, rowY);
  rowY += 4;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text(getNombreCliente(orden.cliente), col1, rowY, { maxWidth: CONTENT_WIDTH / 2 - 8 });
  doc.text(getEquipoInfo(orden), col2, rowY, { maxWidth: CONTENT_WIDTH / 2 - 8 });

  rowY += 8;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.setFont('helvetica', 'normal');

  // Fila 2
  doc.text('TIPO DE ORDEN', col1, rowY);
  doc.text('SERIE / PIEZA', col2, rowY);
  rowY += 4;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text(orden.tipo_orden || 'N/A', col1, rowY);
  doc.text(orden.equipo?.serie_pieza || 'N/A', col2, rowY);

  rowY += 8;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.setFont('helvetica', 'normal');

  // Fila 3
  doc.text('FECHA CREACIÓN', col1, rowY);
  doc.text('CONTACTO', col2, rowY);
  rowY += 4;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text(formatFecha(orden.fecha_creacion), col1, rowY);
  const contacto = orden.cliente?.celular || orden.cliente?.telefono || orden.cliente?.email || 'N/A';
  doc.text(contacto, col2, rowY);

  return y + 42;
}

// ============================================================================
// SECCIÓN: RECEPCIÓN
// ============================================================================

function dibujarSeccionRecepcion(doc: jsPDF, orden: OrdenPDF, y: number, imagenes: ImagenesPreCargadas): number {
  y = dibujarTituloSeccion(doc, 'RECEPCIÓN', y);

  const datos: [string, string][] = [
    ['Descripción del problema', orden.descripcion_problema || orden.equipo?.descripcion || 'N/A'],
    ['Referencia', orden.equipo?.modelo?.referencia || 'N/A'],
    ['Términos aceptados', orden.terminos_aceptados ? 'Sí' : 'No'],
  ];

  if (orden.fecha_aceptacion_terminos) {
    datos.push(['Fecha aceptación términos', formatFecha(orden.fecha_aceptacion_terminos)]);
  }

  if (orden.comentarios_recepcion) {
    datos.push(['Comentarios', orden.comentarios_recepcion]);
  }

  y = dibujarTablaKeyValue(doc, datos, y);

  // Accesorios
  if (orden.esta_accesorios && orden.esta_accesorios.length > 0) {
    y = checkPageBreak(doc, y, 20);
    y += 3;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('Accesorios recibidos:', MARGIN, y);
    y += 5;

    const accesoriosData = orden.esta_accesorios.map(a => [
      a.nombre,
      a.estado.charAt(0).toUpperCase() + a.estado.slice(1)
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Accesorio', 'Estado']],
      body: accesoriosData,
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: COLORS.rowAlt },
      tableWidth: CONTENT_WIDTH / 2,
    });

    y = (doc as any).lastAutoTable.finalY + 4;
  }

  // Fotos de recepción
  if (imagenes.fotos_recepcion.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = dibujarFotosEvidencia(doc, 'Fotos de recepción', imagenes.fotos_recepcion, orden.fotos_recepcion?.length || 0, y);
  }

  // Firma del cliente
  if (imagenes.firma_cliente) {
    y = checkPageBreak(doc, y, 35);
    y = dibujarFirma(doc, 'Firma del Cliente - Recepción', imagenes.firma_cliente, orden.fecha_firma_cliente, y);
  }

  return y;
}

// ============================================================================
// SECCIÓN: DIAGNÓSTICO
// ============================================================================

function dibujarSeccionDiagnostico(doc: jsPDF, orden: OrdenPDF, y: number, imagenes: ImagenesPreCargadas): number {
  y = dibujarTituloSeccion(doc, 'DIAGNÓSTICO', y);

  const datos: [string, string][] = [];

  if (orden.fecha_inicio_diagnostico) {
    datos.push(['Fecha inicio', formatFecha(orden.fecha_inicio_diagnostico)]);
  }
  if (orden.fecha_fin_diagnostico) {
    datos.push(['Fecha fin', formatFecha(orden.fecha_fin_diagnostico)]);
  }

  const comentariosDiag = orden.comentarios_diagnostico || orden.diagnostico?.comentarios || '';
  if (comentariosDiag) {
    datos.push(['Comentarios', comentariosDiag]);
  }

  if (orden.diagnostico?.descripcion_problema) {
    datos.push(['Descripción del problema', orden.diagnostico.descripcion_problema]);
  }
  if (orden.diagnostico?.estado_general) {
    datos.push(['Estado general', orden.diagnostico.estado_general]);
  }
  if (orden.diagnostico?.observaciones) {
    datos.push(['Observaciones', orden.diagnostico.observaciones]);
  }

  if (datos.length > 0) {
    y = dibujarTablaKeyValue(doc, datos, y);
  }

  // Repuestos de diagnóstico
  const repuestosDiag = orden.repuestos_diagnostico;
  if (repuestosDiag && repuestosDiag.length > 0) {
    y = checkPageBreak(doc, y, 20);
    y += 3;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('Repuestos necesarios:', MARGIN, y);
    y += 5;

    const repuestosData = repuestosDiag.map(r => [
      r.descripcion || '-',
      String(r.cantidad || 1),
      r.pieza_causante || '-',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Descripción', 'Cant.', 'Justificación']],
      body: repuestosData,
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: COLORS.rowAlt },
      columnStyles: {
        1: { cellWidth: 15, halign: 'center' },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 4;
  }

  // Fotos de diagnóstico
  if (imagenes.fotos_diagnostico.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = dibujarFotosEvidencia(doc, 'Fotos de diagnóstico', imagenes.fotos_diagnostico, orden.fotos_diagnostico?.length || 0, y);
  }

  return y;
}

// ============================================================================
// SECCIÓN: COTIZACIÓN
// ============================================================================

function dibujarSeccionCotizacion(doc: jsPDF, orden: OrdenPDF, y: number): number {
  y = dibujarTituloSeccion(doc, 'COTIZACIÓN', y);

  // Info básica
  const datos: [string, string][] = [];

  if (orden.fecha_cotizacion) {
    datos.push(['Fecha cotización', formatFecha(orden.fecha_cotizacion)]);
  }

  if (orden.envio_cotizacion) {
    datos.push(['Cotización enviada', 'Sí']);
  }

  if (orden.aprobado_cliente !== undefined && orden.aprobado_cliente !== null) {
    datos.push(['Aprobada por cliente', orden.aprobado_cliente ? 'Sí ✓' : 'No ✗']);
  }

  if (orden.fecha_aprobacion) {
    datos.push(['Fecha aprobación', formatFecha(orden.fecha_aprobacion)]);
  }

  if (orden.es_retrabajo) {
    datos.push(['Retrabajo', 'Sí - Sin costo']);
  }

  const comentariosCot = orden.comentarios_cotizacion || orden.cotizacion?.comentarios || '';
  if (comentariosCot) {
    datos.push(['Comentarios', comentariosCot]);
  }

  if (datos.length > 0) {
    y = dibujarTablaKeyValue(doc, datos, y);
  }

  // Repuestos de cotización
  const repuestosCot = extraerRepuestosCotizacion(orden);
  if (repuestosCot.length > 0) {
    y = checkPageBreak(doc, y, 20);
    y += 3;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('Repuestos y servicios:', MARGIN, y);
    y += 5;

    const repuestosData = repuestosCot.map(r => [
      r.codigo || '-',
      r.descripcion || '-',
      String(r.cantidad || 1),
      formatCurrency(r.precio_unitario || 0),
      `${r.descuento || 0}%`,
      `${r.iva || 0}%`,
      formatCurrency(calcularTotalItem(r)),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Código', 'Descripción', 'Cant.', 'P. Unit.', 'Dto.', 'IVA', 'Total']],
      body: repuestosData,
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: { fillColor: COLORS.rowAlt },
      columnStyles: {
        0: { cellWidth: 22 },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 28, halign: 'right' },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 4;

    // Totales
    y = checkPageBreak(doc, y, 30);
    y = dibujarTotalesCotizacion(doc, orden, repuestosCot, y);
  }

  return y;
}

// ============================================================================
// SECCIÓN: REPARACIÓN
// ============================================================================

function dibujarSeccionReparacion(doc: jsPDF, orden: OrdenPDF, y: number, imagenes: ImagenesPreCargadas): number {
  y = dibujarTituloSeccion(doc, 'REPARACIÓN', y);

  const datos: [string, string][] = [];

  if (orden.fecha_inicio_reparacion) {
    datos.push(['Fecha inicio', formatFecha(orden.fecha_inicio_reparacion)]);
  }
  if (orden.fecha_fin_reparacion) {
    datos.push(['Fecha fin', formatFecha(orden.fecha_fin_reparacion)]);
  }
  if (orden.comentarios_reparacion) {
    datos.push(['Comentarios', orden.comentarios_reparacion]);
  }

  if (datos.length > 0) {
    y = dibujarTablaKeyValue(doc, datos, y);
  } else {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.text('Sin datos de reparación registrados.', MARGIN, y);
    y += 6;
  }

  // Fotos de reparación
  if (imagenes.fotos_reparacion.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = dibujarFotosEvidencia(doc, 'Fotos de reparación', imagenes.fotos_reparacion, orden.fotos_reparacion?.length || 0, y);
  }

  return y;
}

// ============================================================================
// SECCIÓN: ENTREGA
// ============================================================================

function dibujarSeccionEntrega(doc: jsPDF, orden: OrdenPDF, y: number, imagenes: ImagenesPreCargadas): number {
  y = dibujarTituloSeccion(doc, 'ENTREGA', y);

  const datos: [string, string][] = [];

  const tipoEntrega = orden.entrega?.tipo_entrega ||
    (orden.aprobado_cliente === true ? 'Reparado' : 'Devuelto');
  datos.push(['Tipo de entrega', tipoEntrega]);

  if (orden.fecha_entrega) {
    datos.push(['Fecha de entrega', formatFecha(orden.fecha_entrega)]);
  }
  if (orden.fecha_proximo_mantenimiento) {
    datos.push(['Próximo mantenimiento', formatFecha(orden.fecha_proximo_mantenimiento)]);
  }
  if (orden.entrega?.calificacion) {
    datos.push(['Calificación', orden.entrega.calificacion]);
  }
  if (orden.entrega?.comentarios_cliente) {
    datos.push(['Comentarios del cliente', orden.entrega.comentarios_cliente]);
  }

  if (datos.length > 0) {
    y = dibujarTablaKeyValue(doc, datos, y);
  }

  // Fotos de entrega
  if (imagenes.fotos_entrega.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = dibujarFotosEvidencia(doc, 'Fotos de entrega', imagenes.fotos_entrega, orden.fotos_entrega?.length || 0, y);
  }

  // Firma de entrega
  if (imagenes.firma_entrega) {
    y = checkPageBreak(doc, y, 35);
    y = dibujarFirma(doc, 'Firma del Cliente - Entrega', imagenes.firma_entrega, orden.fecha_firma_entrega, y);
  }

  return y;
}

// ============================================================================
// FOTOS DE EVIDENCIA (cuadrados pequeños)
// ============================================================================

const THUMB_SIZE = 25; // mm - tamaño de cada miniatura
const THUMB_GAP = 4;  // mm - espacio entre miniaturas
const THUMBS_PER_ROW = Math.floor((CONTENT_WIDTH + THUMB_GAP) / (THUMB_SIZE + THUMB_GAP));

function dibujarFotosEvidencia(
  doc: jsPDF,
  titulo: string,
  imagenesBase64: string[],
  totalFotosOriginal: number,
  y: number
): number {
  y += 2;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(titulo + ` (${totalFotosOriginal})`, MARGIN, y);
  y += 5;

  let col = 0;
  for (let i = 0; i < imagenesBase64.length; i++) {
    const imgData = imagenesBase64[i];

    // Verificar salto de página
    if (col === 0) {
      y = checkPageBreak(doc, y, THUMB_SIZE + 6);
    }

    const x = MARGIN + col * (THUMB_SIZE + THUMB_GAP);

    // Borde del cuadrado
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, THUMB_SIZE, THUMB_SIZE, 1, 1, 'S');

    if (imgData) {
      try {
        doc.addImage(imgData, 'JPEG', x + 0.5, y + 0.5, THUMB_SIZE - 1, THUMB_SIZE - 1);
      } catch (imgErr) {
        console.warn(`⚠️ Error al agregar foto ${i + 1} al PDF:`, imgErr);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(x + 0.5, y + 0.5, THUMB_SIZE - 1, THUMB_SIZE - 1, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.textLight);
        doc.text('Error', x + THUMB_SIZE / 2, y + THUMB_SIZE / 2, { align: 'center' });
      }
    } else {
      // Placeholder si no se pudo cargar
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(x + 0.5, y + 0.5, THUMB_SIZE - 1, THUMB_SIZE - 1, 1, 1, 'F');
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.textLight);
      doc.text('No disp.', x + THUMB_SIZE / 2, y + THUMB_SIZE / 2, { align: 'center' });
    }

    // Número de foto debajo
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    doc.text(`${i + 1}`, x + THUMB_SIZE / 2, y + THUMB_SIZE + 3, { align: 'center' });

    col++;
    if (col >= THUMBS_PER_ROW) {
      col = 0;
      y += THUMB_SIZE + 6;
    }
  }

  // Si la última fila no se completó, avanzar
  if (col > 0) {
    y += THUMB_SIZE + 6;
  }

  // Nota si hay más fotos
  if (totalFotosOriginal > 12) {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'italic');
    doc.text(`+ ${totalFotosOriginal - 12} fotos adicionales (ver en sistema)`, MARGIN, y);
    y += 5;
  }

  return y + 2;
}

// ============================================================================
// FIRMAS
// ============================================================================

function dibujarFirma(
  doc: jsPDF,
  titulo: string,
  firmaBase64: string,
  fechaFirma: string | undefined,
  y: number
): number {
  y += 2;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(titulo, MARGIN, y);
  y += 4;

  const firmaWidth = 50;
  const firmaHeight = 20;

  // Cuadro con borde para la firma
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, firmaWidth, firmaHeight, 1, 1, 'S');

  if (firmaBase64) {
    try {
      const formato = firmaBase64.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(firmaBase64, formato, MARGIN + 1, y + 1, firmaWidth - 2, firmaHeight - 2);
    } catch {
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.textLight);
      doc.text('Firma registrada', MARGIN + firmaWidth / 2, y + firmaHeight / 2, { align: 'center' });
    }
  }

  // Línea de firma debajo
  doc.setDrawColor(...COLORS.text);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y + firmaHeight + 2, MARGIN + firmaWidth, y + firmaHeight + 2);

  // Fecha de firma
  if (fechaFirma) {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${formatFecha(fechaFirma)}`, MARGIN, y + firmaHeight + 6);
  }

  return y + firmaHeight + 10;
}

// ============================================================================
// FOOTER
// ============================================================================

function dibujarFooter(doc: jsPDF, orden: OrdenPDF, pagina: number, totalPaginas: number): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 12;

  // Línea separadora
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, footerY - 2, PAGE_WIDTH - MARGIN, footerY - 2);

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textLight);
  doc.setFont('helvetica', 'normal');

  // Izquierda: info empresa
  doc.text('Team Service Costa - Servicio Técnico Especializado', MARGIN, footerY + 2);

  // Centro: fecha de generación
  const ahora = new Date();
  const fechaGen = formatearFechaColombiaCorta(ahora.toISOString());
  doc.text(`Generado: ${fechaGen}`, PAGE_WIDTH / 2, footerY + 2, { align: 'center' });

  // Derecha: paginación
  doc.text(`Página ${pagina} de ${totalPaginas}`, PAGE_WIDTH - MARGIN, footerY + 2, { align: 'right' });
}

// ============================================================================
// UTILIDADES DE DIBUJO
// ============================================================================

function dibujarTituloSeccion(doc: jsPDF, titulo: string, y: number): number {
  // Barra de color para el título de sección
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 1, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, MARGIN + 4, y + 5.5);

  return y + 12;
}

function dibujarTablaKeyValue(doc: jsPDF, datos: [string, string][], y: number): number {
  const tableData = datos.map(([key, value]) => [key, value]);

  autoTable(doc, {
    startY: y,
    body: tableData,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        cellWidth: 50,
        textColor: COLORS.primary,
      },
      1: {
        textColor: COLORS.text,
      },
    },
    alternateRowStyles: { fillColor: COLORS.rowAlt },
    theme: 'plain',
    tableLineColor: COLORS.border,
    tableLineWidth: 0.1,
  });

  return (doc as any).lastAutoTable.finalY + 4;
}

function checkPageBreak(doc: jsPDF, y: number, neededHeight: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + neededHeight > pageHeight - 20) {
    doc.addPage();
    return MARGIN + 5;
  }
  return y;
}

// ============================================================================
// HELPERS DE COTIZACIÓN
// ============================================================================

function extraerRepuestosCotizacion(orden: OrdenPDF): any[] {
  const cotizacionData = orden.repuestos_cotizacion;
  if (!cotizacionData) return [];

  // Nuevo formato (objeto con repuestos y totales)
  if (typeof cotizacionData === 'object' && 'repuestos' in cotizacionData) {
    return cotizacionData.repuestos || [];
  }

  // Formato antiguo (array directo)
  if (Array.isArray(cotizacionData)) {
    return cotizacionData;
  }

  return [];
}

function calcularTotalItem(repuesto: any): number {
  const cantidad = Number(repuesto.cantidad) || 1;
  const precioUnitario = Number(repuesto.precio_unitario) || 0;
  const descuento = Number(repuesto.descuento) || 0;
  const iva = Number(repuesto.iva) || 0;

  const subtotal = cantidad * precioUnitario;
  const subtotalConDescuento = subtotal * (1 - descuento / 100);
  const totalConIva = subtotalConDescuento * (1 + iva / 100);
  return totalConIva;
}

function dibujarTotalesCotizacion(doc: jsPDF, orden: OrdenPDF, repuestos: any[], y: number): number {
  const subtotalRepuestos = repuestos.reduce((acc, r) => {
    const cantidad = Number(r.cantidad) || 1;
    const precio = Number(r.precio_unitario) || 0;
    const descuento = Number(r.descuento) || 0;
    return acc + (cantidad * precio * (1 - descuento / 100));
  }, 0);

  const ivaTotal = repuestos.reduce((acc, r) => {
    const cantidad = Number(r.cantidad) || 1;
    const precio = Number(r.precio_unitario) || 0;
    const descuento = Number(r.descuento) || 0;
    const iva = Number(r.iva) || 0;
    const subtotalConDesc = cantidad * precio * (1 - descuento / 100);
    return acc + (subtotalConDesc * iva / 100);
  }, 0);

  const valorRevision = orden.valor_revision || 0;
  const precioEnvio = orden.precio_envio || 0;
  const total = orden.es_retrabajo ? 0 : (subtotalRepuestos + ivaTotal + precioEnvio);

  // Cuadro de totales
  const boxX = PAGE_WIDTH - MARGIN - 80;
  const boxWidth = 80;

  const totalesData: [string, string][] = [
    ['Subtotal', formatCurrency(subtotalRepuestos)],
    ['IVA', formatCurrency(ivaTotal)],
  ];

  if (precioEnvio > 0) {
    totalesData.push(['Precio de envío', formatCurrency(precioEnvio)]);
  }

  if (valorRevision > 0) {
    totalesData.push(['Valor revisión*', formatCurrency(valorRevision)]);
  }

  autoTable(doc, {
    startY: y,
    body: totalesData,
    margin: { left: boxX },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLORS.text, cellWidth: 40 },
      1: { halign: 'right', textColor: COLORS.text, cellWidth: 35 },
    },
    theme: 'plain',
  });

  y = (doc as any).lastAutoTable.finalY + 1;

  // Total final - fila destacada
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(boxX, y, boxWidth, 10, 1, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', boxX + 4, y + 7);
  doc.text(orden.es_retrabajo ? '$0 (Retrabajo)' : formatCurrency(total), boxX + boxWidth - 4, y + 7, { align: 'right' });

  y += 14;

  // Nota sobre valor de revisión
  if (valorRevision > 0) {
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `* Valor de revisión (${formatCurrency(valorRevision)}): Solo se cobra si el cliente rechaza la cotización.`,
      MARGIN,
      y
    );
    y += 6;
  }

  return y;
}
