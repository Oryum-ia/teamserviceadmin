-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accesorios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  descripcion text NOT NULL,
  marca text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT accesorios_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_tienda (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  estado_tienda text DEFAULT 'Activa'::text,
  mensaje_promocion text,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT admin_tienda_pkey PRIMARY KEY (id),
  CONSTRAINT admin_tienda_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.carrusel (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo text,
  descripcion text,
  imagen_url text NOT NULL,
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  CONSTRAINT carrusel_pkey PRIMARY KEY (id)
);
CREATE TABLE public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo_documento text,
  identificacion text NOT NULL,
  dv text,
  es_juridica boolean DEFAULT false,
  razon_social text,
  regimen text,
  nombre_comercial text,
  ciudad text,
  direccion text,
  telefono text,
  telefono_contacto text,
  nombre_contacto text,
  correo_electronico text,
  comentarios text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT clientes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comentarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  orden_id uuid,
  estado_anterior text,
  estado_nuevo text,
  comentario text,
  usuario_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT comentarios_pkey PRIMARY KEY (id),
  CONSTRAINT comentarios_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes(id),
  CONSTRAINT comentarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.equipos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  modelo_id uuid,
  cliente_id uuid,
  serie_pieza text,
  fecha_compra date,
  descripcion text,
  soporte_garantia text,
  archivo_soporte text,
  estado text DEFAULT 'Habilitado'::text,
  fecha_proximo_mantenimiento date,
  comentarios text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT equipos_pkey PRIMARY KEY (id),
  CONSTRAINT equipos_modelo_fkey FOREIGN KEY (modelo_id) REFERENCES public.modelos(id),
  CONSTRAINT equipos_cliente_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.indicadores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha date DEFAULT CURRENT_DATE,
  total_ordenes integer,
  ordenes_finalizadas integer,
  promedio_tiempo numeric,
  repuestos_usados integer,
  sede_id uuid,
  tecnico_id uuid,
  CONSTRAINT indicadores_pkey PRIMARY KEY (id),
  CONSTRAINT indicadores_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sedes(id),
  CONSTRAINT indicadores_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.marcas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  pais_origen text,
  sitio_web text,
  activo boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT marcas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.modelos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  equipo text NOT NULL,
  referencia text,
  marca text,
  valor_revision numeric DEFAULT 0,
  serial text,
  created_at timestamp without time zone DEFAULT now(),
  marca_id uuid,
  CONSTRAINT modelos_pkey PRIMARY KEY (id),
  CONSTRAINT modelos_marca_id_fkey FOREIGN KEY (marca_id) REFERENCES public.marcas(id)
);
CREATE TABLE public.modelos_accesorios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  modelo_id uuid NOT NULL,
  accesorio_id uuid NOT NULL,
  CONSTRAINT modelos_accesorios_pkey PRIMARY KEY (id),
  CONSTRAINT modelos_accesorios_modelo_fkey FOREIGN KEY (modelo_id) REFERENCES public.modelos(id),
  CONSTRAINT modelos_accesorios_accesorio_fkey FOREIGN KEY (accesorio_id) REFERENCES public.accesorios(id)
);
CREATE TABLE public.modelos_repuestos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  modelo_id uuid NOT NULL,
  repuesto_id uuid NOT NULL,
  CONSTRAINT modelos_repuestos_pkey PRIMARY KEY (id),
  CONSTRAINT modelos_repuestos_repuesto_fkey FOREIGN KEY (repuesto_id) REFERENCES public.repuestos(id),
  CONSTRAINT modelos_repuestos_modelo_fkey FOREIGN KEY (modelo_id) REFERENCES public.modelos(id)
);
CREATE TABLE public.ordenes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo text UNIQUE,
  cliente_id uuid,
  estado_actual text,
  tipo_orden text,
  prioridad text,
  tipo_entrega text,
  fecha_creacion timestamp without time zone,
  fecha_fin_recepcion timestamp without time zone,
  fecha_inicio_diagnostico timestamp without time zone,
  fecha_fin_diagnostico timestamp without time zone,
  fecha_cotizacion timestamp without time zone,
  fecha_aprobacion timestamp without time zone,
  fecha_solicitud_repuestos timestamp without time zone,
  fecha_recepcion_repuestos timestamp without time zone,
  fecha_inicio_reparacion timestamp without time zone,
  fecha_fin_reparacion timestamp without time zone,
  fecha_entrega timestamp without time zone,
  comentarios_recepcion text,
  comentarios_diagnostico text,
  comentarios_cotizacion text,
  comentarios_reparacion text,
  comentarios_entrega text,
  comentarios_cliente text,
  es_retrabajo boolean DEFAULT false,
  valor_revision numeric DEFAULT 0,
  revision_pagada boolean DEFAULT false,
  calificacion numeric,
  tecnico_recepcion uuid,
  tecnico_diagnostico uuid,
  tecnico_cotiza uuid,
  tecnico_repara uuid,
  tecnico_entrega uuid,
  sede_id uuid,
  estado_garantia text,
  ultima_actualizacion timestamp without time zone DEFAULT now(),
  pedido text,
  fecha_pedido timestamp without time zone,
  total numeric DEFAULT 0,
  aprobado_cliente boolean DEFAULT false,
  equipo_id uuid,
  responsable text,
  updated_at timestamp without time zone,
  fotos_diagnostico ARRAY,
  repuestos_diagnostico jsonb DEFAULT '[]'::jsonb,
  repuestos_cotizacion jsonb DEFAULT '[]'::jsonb,
  aprobacion_marca jsonb,
  CONSTRAINT ordenes_pkey PRIMARY KEY (id),
  CONSTRAINT ordenes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT ordenes_tecnico_recepcion_fkey FOREIGN KEY (tecnico_recepcion) REFERENCES public.usuarios(id),
  CONSTRAINT ordenes_tecnico_diagnostico_fkey FOREIGN KEY (tecnico_diagnostico) REFERENCES public.usuarios(id),
  CONSTRAINT ordenes_tecnico_cotiza_fkey FOREIGN KEY (tecnico_cotiza) REFERENCES public.usuarios(id),
  CONSTRAINT ordenes_tecnico_repara_fkey FOREIGN KEY (tecnico_repara) REFERENCES public.usuarios(id),
  CONSTRAINT ordenes_tecnico_entrega_fkey FOREIGN KEY (tecnico_entrega) REFERENCES public.usuarios(id),
  CONSTRAINT ordenes_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sedes(id),
  CONSTRAINT ordenes_equipo_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipos(id)
);
CREATE TABLE public.producto_tienda (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  precio numeric,
  stock integer,
  promocion boolean DEFAULT false,
  activo boolean DEFAULT true,
  imagenes ARRAY DEFAULT '{}'::text[],
  especificaciones jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT producto_tienda_pkey PRIMARY KEY (id)
);
CREATE TABLE public.repuestos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo text,
  descripcion text,
  cantidad integer DEFAULT 1,
  causante text,
  escrito text,
  CONSTRAINT repuestos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sedes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  ciudad text,
  direccion text,
  telefono text,
  CONSTRAINT sedes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  rol text NOT NULL CHECK (rol = ANY (ARRAY['tecnico'::text, 'admin'::text, 'super-admin'::text])),
  nombre text,
  sede text,
  activo boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);