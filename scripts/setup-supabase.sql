-- =====================================================
-- SCRIPT DE INICIALIZACIÓN RÁPIDA
-- Ejecuta este script COMPLETO en Supabase SQL Editor
-- =====================================================

-- 1. CREAR TABLAS
-- =====================================================

-- Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento VARCHAR(10),
    identificacion VARCHAR(50) NOT NULL UNIQUE,
    dv VARCHAR(1),
    es_juridica BOOLEAN DEFAULT FALSE,
    razon_social VARCHAR(255),
    regimen VARCHAR(100),
    nombre_comercial VARCHAR(255),
    ciudad VARCHAR(100),
    direccion TEXT,
    telefono VARCHAR(20),
    telefono_contacto VARCHAR(20),
    nombre_contacto VARCHAR(255),
    correo_electronico VARCHAR(255),
    comentarios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('tecnico', 'administrador', 'super-admin')),
    sede VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: ordenes
CREATE TABLE IF NOT EXISTS ordenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    numero_orden VARCHAR(50) NOT NULL UNIQUE,
    fase_actual VARCHAR(20) NOT NULL CHECK (fase_actual IN ('diagnostico', 'cotizacion', 'reparacion', 'finalizada')),
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('pendiente', 'en_proceso', 'espera_repuestos', 'completada', 'cancelada')),
    tipo_producto VARCHAR(100),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    serial VARCHAR(100),
    diagnostico JSONB DEFAULT '{"descripcion_problema": "", "estado_general": "", "observaciones": "", "notas_internas": [], "preventivos": []}'::jsonb,
    cotizacion JSONB DEFAULT '{"repuestos": [], "mano_obra": 0, "subtotal": 0, "iva": 0, "total": 0, "aprobada_por_cliente": false}'::jsonb,
    reparacion JSONB DEFAULT '{"descripcion_trabajo": "", "repuestos_usados": []}'::jsonb,
    comentarios_retroceso JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_finalizacion TIMESTAMP WITH TIME ZONE
);

-- Tabla: comentarios
CREATE TABLE IF NOT EXISTS comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    fase_origen VARCHAR(20) NOT NULL,
    fase_destino VARCHAR(20) NOT NULL,
    comentario TEXT NOT NULL,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_nombre VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: inventario
CREATE TABLE IF NOT EXISTS inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('accesorio', 'modelo')),
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    descripcion TEXT,
    cantidad_disponible INTEGER DEFAULT 0,
    precio_unitario DECIMAL(10, 2),
    ubicacion VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: productos_tienda
CREATE TABLE IF NOT EXISTS productos_tienda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100),
    imagenes JSONB DEFAULT '[]'::jsonb,
    en_promocion BOOLEAN DEFAULT FALSE,
    precio_promocion DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_clientes_identificacion ON clientes(identificacion);
CREATE INDEX IF NOT EXISTS idx_clientes_razon_social ON clientes(razon_social);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre_comercial ON clientes(nombre_comercial);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente_id ON ordenes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_numero_orden ON ordenes(numero_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_fase_actual ON ordenes(fase_actual);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_created_at ON ordenes(created_at DESC);

-- 3. TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_ordenes_updated_at BEFORE UPDATE ON ordenes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_tienda ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver clientes" ON clientes;
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clientes
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear clientes" ON clientes;
CREATE POLICY "Usuarios autenticados pueden crear clientes" ON clientes
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar clientes" ON clientes;
CREATE POLICY "Usuarios autenticados pueden actualizar clientes" ON clientes
    FOR UPDATE TO authenticated USING (true);

-- Políticas para usuarios
DROP POLICY IF EXISTS "Usuarios pueden ver otros usuarios" ON usuarios;
CREATE POLICY "Usuarios pueden ver otros usuarios" ON usuarios
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear usuarios" ON usuarios;
CREATE POLICY "Usuarios autenticados pueden crear usuarios" ON usuarios
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar usuarios" ON usuarios;
CREATE POLICY "Usuarios autenticados pueden actualizar usuarios" ON usuarios
    FOR UPDATE TO authenticated USING (true);

-- Políticas para órdenes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver órdenes" ON ordenes;
CREATE POLICY "Usuarios autenticados pueden ver órdenes" ON ordenes
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear órdenes" ON ordenes;
CREATE POLICY "Usuarios autenticados pueden crear órdenes" ON ordenes
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar órdenes" ON ordenes;
CREATE POLICY "Usuarios autenticados pueden actualizar órdenes" ON ordenes
    FOR UPDATE TO authenticated USING (true);

-- Políticas para comentarios
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver comentarios" ON comentarios;
CREATE POLICY "Usuarios autenticados pueden ver comentarios" ON comentarios
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear comentarios" ON comentarios;
CREATE POLICY "Usuarios autenticados pueden crear comentarios" ON comentarios
    FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas para inventario
DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar inventario" ON inventario;
CREATE POLICY "Usuarios autenticados pueden gestionar inventario" ON inventario
    FOR ALL TO authenticated USING (true);

-- Políticas para productos de tienda
DROP POLICY IF EXISTS "Todos pueden ver productos activos" ON productos_tienda;
CREATE POLICY "Todos pueden ver productos activos" ON productos_tienda
    FOR SELECT TO anon, authenticated USING (activo = true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar productos" ON productos_tienda;
CREATE POLICY "Usuarios autenticados pueden gestionar productos" ON productos_tienda
    FOR ALL TO authenticated USING (true);

-- 5. DATOS DE PRUEBA
-- =====================================================

-- Cliente de prueba
INSERT INTO clientes (tipo_documento, identificacion, es_juridica, nombre_comercial, ciudad, telefono, correo_electronico)
VALUES ('CC', '1234567890', FALSE, 'Juan Pérez Test', 'Montería', '3001234567', 'juan.test@example.com')
ON CONFLICT (identificacion) DO NOTHING;

-- =====================================================
-- ✅ SCRIPT COMPLETADO
-- =====================================================
--
-- SIGUIENTE PASO:
-- 1. Ve a Authentication → Users
-- 2. Crea un usuario con:
--    - Email: admin@teamservice.com
--    - Password: Admin123!
--    - ✅ Marca "Auto Confirm User"
-- 3. Copia el UUID del usuario
-- 4. Ejecuta este SQL (reemplaza TU_UUID_AQUI):
--
-- INSERT INTO usuarios (id, email, nombre, role, activo)
-- VALUES (
--     'TU_UUID_AQUI',
--     'admin@teamservice.com',
--     'Administrador Principal',
--     'super-admin',
--     true
-- );
--
-- =====================================================
