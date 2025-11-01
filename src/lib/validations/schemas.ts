import { z } from 'zod';

// ============================================
// MARCA SCHEMA
// ============================================
export const marcaSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  pais_origen: z
    .string()
    .max(100, 'El país no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  sitio_web: z
    .string()
    .url('Debe ser una URL válida (https://ejemplo.com)')
    .max(255, 'La URL no puede exceder 255 caracteres')
    .optional()
    .or(z.literal(''))
});

export type MarcaFormData = z.infer<typeof marcaSchema>;

// ============================================
// MODELO SCHEMA
// ============================================
export const modeloSchema = z.object({
  equipo: z
    .string()
    .min(1, 'El nombre del equipo es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  marca_id: z
    .string()
    .uuid('ID de marca inválido')
    .optional()
    .or(z.literal('')),
  referencia: z
    .string()
    .max(100, 'La referencia no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  valor_revision: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val || val === '') return undefined;
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    })
    .pipe(
      z
        .number()
        .nonnegative('El valor debe ser positivo')
        .max(999999999, 'El valor es demasiado grande')
        .optional()
    ),
  serial: z
    .string()
    .max(100, 'El serial no puede exceder 100 caracteres')
    .optional()
    .or(z.literal(''))
});

export type ModeloFormData = z.infer<typeof modeloSchema>;

// ============================================
// EQUIPO SCHEMA
// ============================================
export const equipoSchema = z.object({
  cliente_id: z
    .string()
    .min(1, 'Debe seleccionar un cliente')
    .uuid('ID de cliente inválido'),
  modelo_id: z
    .string()
    .uuid('ID de modelo inválido')
    .optional()
    .or(z.literal('')),
  serie_pieza: z
    .string()
    .min(1, 'La serie/pieza es requerida')
    .max(100, 'La serie/pieza no puede exceder 100 caracteres')
    .trim(),
  fecha_compra: z
    .string()
    .optional()
    .or(z.literal('')),
  descripcion: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),
  soporte_garantia: z
    .enum(['factura', 'poliza'], {
      errorMap: () => ({ message: 'Debe seleccionar un tipo de soporte' })
    }),
  estado: z
    .enum(['Habilitado', 'Deshabilitado'], {
      errorMap: () => ({ message: 'Debe seleccionar un estado' })
    }),
  comentarios: z
    .string()
    .max(1000, 'Los comentarios no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal(''))
});

export type EquipoFormData = z.infer<typeof equipoSchema>;

// ============================================
// ACCESORIO SCHEMA
// ============================================
export const accesorioSchema = z.object({
  descripcion: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede exceder 255 caracteres')
    .trim(),
  marca: z
    .string()
    .max(100, 'La marca no puede exceder 100 caracteres')
    .optional()
    .or(z.literal(''))
});

export type AccesorioFormData = z.infer<typeof accesorioSchema>;

// ============================================
// REPUESTO SCHEMA
// ============================================
export const repuestoSchema = z.object({
  codigo: z
    .string()
    .max(100, 'El código no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  descripcion: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede exceder 255 caracteres')
    .trim(),
  cantidad: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val || val === '') return 1;
      const num = parseInt(val, 10);
      return isNaN(num) ? 1 : num;
    })
    .pipe(
      z
        .number()
        .int('Debe ser un número entero')
        .positive('La cantidad debe ser positiva')
        .max(999999, 'La cantidad es demasiado grande')
    ),
  causante: z
    .string()
    .max(100, 'El causante no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  escrito: z
    .string()
    .max(500, 'El escrito no puede exceder 500 caracteres')
    .optional()
    .or(z.literal(''))
});

export type RepuestoFormData = z.infer<typeof repuestoSchema>;

// ============================================
// CLIENTE SCHEMA
// ============================================
export const clienteSchema = z.object({
  tipo_documento: z
    .string()
    .max(10, 'El tipo de documento no puede exceder 10 caracteres')
    .optional()
    .or(z.literal('')),
  identificacion: z
    .string()
    .min(1, 'La identificación es requerida')
    .max(50, 'La identificación no puede exceder 50 caracteres')
    .trim(),
  dv: z
    .string()
    .max(1, 'El dígito de verificación debe ser un solo carácter')
    .optional()
    .or(z.literal('')),
  es_juridica: z.boolean().default(false),
  razon_social: z
    .string()
    .max(255, 'La razón social no puede exceder 255 caracteres')
    .optional()
    .or(z.literal('')),
  regimen: z
    .string()
    .max(100, 'El régimen no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  nombre_comercial: z
    .string()
    .max(255, 'El nombre comercial no puede exceder 255 caracteres')
    .optional()
    .or(z.literal('')),
  ciudad: z
    .string()
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  direccion: z
    .string()
    .max(500, 'La dirección no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  telefono: z
    .string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^[0-9+\-\s()]*$/, 'El teléfono solo puede contener números y símbolos (+, -, espacios, paréntesis)')
    .optional()
    .or(z.literal('')),
  telefono_contacto: z
    .string()
    .max(20, 'El teléfono de contacto no puede exceder 20 caracteres')
    .regex(/^[0-9+\-\s()]*$/, 'El teléfono solo puede contener números y símbolos (+, -, espacios, paréntesis)')
    .optional()
    .or(z.literal('')),
  nombre_contacto: z
    .string()
    .max(255, 'El nombre de contacto no puede exceder 255 caracteres')
    .optional()
    .or(z.literal('')),
  correo_electronico: z
    .string()
    .email('Debe ser un correo electrónico válido')
    .max(255, 'El correo no puede exceder 255 caracteres')
    .optional()
    .or(z.literal('')),
  comentarios: z
    .string()
    .max(1000, 'Los comentarios no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal(''))
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

// ============================================
// VALIDACIÓN CONDICIONAL PARA CLIENTE
// ============================================
// Si es persona jurídica, razon_social es requerido
// Si es persona natural, nombre_comercial es requerido
export const clienteSchemaRefined = clienteSchema.refine(
  (data) => {
    if (data.es_juridica) {
      return data.razon_social && data.razon_social.trim().length > 0;
    }
    return true;
  },
  {
    message: 'La razón social es requerida para persona jurídica',
    path: ['razon_social']
  }
).refine(
  (data) => {
    if (!data.es_juridica) {
      return data.nombre_comercial && data.nombre_comercial.trim().length > 0;
    }
    return true;
  },
  {
    message: 'El nombre comercial es requerido para persona natural',
    path: ['nombre_comercial']
  }
);
