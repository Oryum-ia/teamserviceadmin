-- =====================================================
-- ESQUEMA DE BASE DE DATOS PARA TEAMSERVICE COSTA
-- Supabase PostgreSQL Schema
-- =====================================================

-- =====================================================
-- TABLA: clientes
-- Almacena información de clientes (persona natural y jurídica)
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento VARCHAR(10), -- CC, NIT, CE, PAS
    identificacion VARCHAR(50) NOT NULL UNIQUE,
    dv VARCHAR(1), -- Dígito de verificación para NIT
    es_juridica BOOLEAN DEFAULT FALSE,
    razon_social VARCHAR(255),
    regimen VARCHAR(100), -- Simplificado, Común, Especial
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

-- Índices para búsqueda rápida
CREATE INDEX idx_clientes_identificacion ON clientes(identificacion);
CREATE INDEX idx_clientes_razon_social ON clientes(razon_social);
CREATE INDEX idx_clientes_nombre_comercial ON clientes(nombre_comercial);
CREATE INDEX idx_clientes_correo ON clientes(correo_electronico);

-- =====================================================
-- TABLA: usuarios
-- Almacena información de usuarios del sistema
-- =====================================================
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

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_role ON usuarios(role);
CREATE INDEX idx_usuarios_sede ON usuarios(sede);

-- =====================================================
-- TABLA: ordenes
-- Almacena las órdenes de servicio con todas sus fases
-- =====================================================
CREATE TABLE IF NOT EXISTS ordenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    numero_orden VARCHAR(50) NOT NULL UNIQUE,
    fase_actual VARCHAR(20) NOT NULL CHECK (fase_actual IN ('diagnostico', 'cotizacion', 'reparacion', 'finalizada')),
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('pendiente', 'en_proceso', 'espera_repuestos', 'completada', 'cancelada')),

    -- Datos del producto
    tipo_producto VARCHAR(100),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    serial VARCHAR(100),

    -- Diagnóstico (JSONB para flexibilidad)
    diagnostico JSONB DEFAULT '{"descripcion_problema": "", "estado_general": "", "observaciones": "", "notas_internas": [], "preventivos": []}'::jsonb,

    -- Cotización (JSONB)
    cotizacion JSONB DEFAULT '{"repuestos": [], "mano_obra": 0, "subtotal": 0, "iva": 0, "total": 0, "aprobada_por_cliente": false}'::jsonb,

    -- Reparación (JSONB)
    reparacion JSONB DEFAULT '{"descripcion_trabajo": "", "repuestos_usados": []}'::jsonb,

    -- Comentarios de retroceso
    comentarios_retroceso JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_finalizacion TIMESTAMP WITH TIME ZONE
);

-- Índices para búsqueda y ordenamiento
CREATE INDEX idx_ordenes_cliente_id ON ordenes(cliente_id);
CREATE INDEX idx_ordenes_numero_orden ON ordenes(numero_orden);
CREATE INDEX idx_ordenes_fase_actual ON ordenes(fase_actual);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_ordenes_created_at ON ordenes(created_at DESC);

-- =====================================================
-- TABLA: comentarios
-- Almacena comentarios de retroceso de fase
-- =====================================================
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

CREATE INDEX idx_comentarios_orden_id ON comentarios(orden_id);
CREATE INDEX idx_comentarios_usuario_id ON comentarios(usuario_id);
CREATE INDEX idx_comentarios_created_at ON comentarios(created_at DESC);

-- =====================================================
-- TABLA: inventario
-- Almacena accesorios y modelos del inventario
-- =====================================================
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

CREATE INDEX idx_inventario_tipo ON inventario(tipo);
CREATE INDEX idx_inventario_nombre ON inventario(nombre);
CREATE INDEX idx_inventario_marca ON inventario(marca);

-- =====================================================
-- TABLA: productos_tienda
-- Almacena productos para la landing page
-- =====================================================
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

CREATE INDEX idx_productos_tienda_categoria ON productos_tienda(categoria);
CREATE INDEX idx_productos_tienda_activo ON productos_tienda(activo);
CREATE INDEX idx_productos_tienda_en_promocion ON productos_tienda(en_promocion);

-- =====================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordenes_updated_at BEFORE UPDATE ON ordenes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventario_updated_at BEFORE UPDATE ON inventario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_tienda_updated_at BEFORE UPDATE ON productos_tienda
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_tienda ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para clientes
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clientes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear clientes" ON clientes
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar clientes" ON clientes
    FOR UPDATE TO authenticated USING (true);

-- Políticas de seguridad para usuarios
CREATE POLICY "Usuarios pueden ver otros usuarios" ON usuarios
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo super-admin puede crear usuarios" ON usuarios
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND role = 'super-admin'
        )
    );

CREATE POLICY "Solo super-admin puede actualizar usuarios" ON usuarios
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND role = 'super-admin'
        )
    );

-- Políticas de seguridad para órdenes
CREATE POLICY "Usuarios autenticados pueden ver órdenes" ON ordenes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear órdenes" ON ordenes
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar órdenes" ON ordenes
    FOR UPDATE TO authenticated USING (true);

-- Políticas de seguridad para comentarios
CREATE POLICY "Usuarios autenticados pueden ver comentarios" ON comentarios
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear comentarios" ON comentarios
    FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas de seguridad para inventario
CREATE POLICY "Usuarios autenticados pueden ver inventario" ON inventario
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar inventario" ON inventario
    FOR ALL TO authenticated USING (true);

-- Políticas de seguridad para productos de tienda
CREATE POLICY "Todos pueden ver productos activos" ON productos_tienda
    FOR SELECT TO anon, authenticated USING (activo = true);

CREATE POLICY "Solo admin puede gestionar productos" ON productos_tienda
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND role IN ('administrador', 'super-admin')
        )
    );

-- =====================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Insertar un cliente de prueba (persona natural)
INSERT INTO clientes (tipo_documento, identificacion, es_juridica, nombre_comercial, ciudad, telefono, correo_electronico)
VALUES ('CC', '1234567890', FALSE, 'Juan Pérez', 'Montería', '3001234567', 'juan.perez@example.com')
ON CONFLICT (identificacion) DO NOTHING;

-- Insertar un cliente de prueba (persona jurídica)
INSERT INTO clientes (tipo_documento, identificacion, dv, es_juridica, razon_social, nombre_comercial, regimen, ciudad, telefono, correo_electronico)
VALUES ('NIT', '900123456', '7', TRUE, 'EMPRESA EJEMPLO S.A.S', 'Empresa Ejemplo', 'Común', 'Cartagena', '3009876543', 'contacto@empresaejemplo.com')
ON CONFLICT (identificacion) DO NOTHING;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Órdenes con información del cliente
CREATE OR REPLACE VIEW ordenes_con_cliente AS
SELECT
    o.*,
    c.identificacion as cliente_identificacion,
    c.razon_social as cliente_razon_social,
    c.nombre_comercial as cliente_nombre_comercial,
    c.es_juridica as cliente_es_juridica,
    c.telefono as cliente_telefono,
    c.correo_electronico as cliente_correo
FROM ordenes o
LEFT JOIN clientes c ON o.cliente_id = c.id;

-- Vista: Estadísticas de órdenes
CREATE OR REPLACE VIEW estadisticas_ordenes AS
SELECT
    COUNT(*) as total_ordenes,
    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as ordenes_pendientes,
    COUNT(CASE WHEN estado = 'en_proceso' THEN 1 END) as ordenes_en_proceso,
    COUNT(CASE WHEN estado = 'espera_repuestos' THEN 1 END) as ordenes_espera_repuestos,
    COUNT(CASE WHEN estado = 'completada' THEN 1 END) as ordenes_completadas,
    COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as ordenes_canceladas,
    COUNT(CASE WHEN fase_actual = 'diagnostico' THEN 1 END) as fase_diagnostico,
    COUNT(CASE WHEN fase_actual = 'cotizacion' THEN 1 END) as fase_cotizacion,
    COUNT(CASE WHEN fase_actual = 'reparacion' THEN 1 END) as fase_reparacion,
    COUNT(CASE WHEN fase_actual = 'finalizada' THEN 1 END) as fase_finalizada,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as ordenes_hoy,
    COUNT(CASE WHEN created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as ordenes_semana,
    COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as ordenes_mes
FROM ordenes;

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================
