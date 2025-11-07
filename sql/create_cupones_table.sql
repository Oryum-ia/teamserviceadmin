-- ============================================
-- TABLA: cupones
-- Descripción: Tabla para gestionar cupones de descuento
-- ============================================

-- Crear tabla de cupones
CREATE TABLE IF NOT EXISTS cupones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  porcentaje_descuento INTEGER NOT NULL CHECK (porcentaje_descuento >= 1 AND porcentaje_descuento <= 100),
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_uso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones(codigo);
CREATE INDEX IF NOT EXISTS idx_cupones_usado ON cupones(usado);
CREATE INDEX IF NOT EXISTS idx_cupones_activo ON cupones(activo);
CREATE INDEX IF NOT EXISTS idx_cupones_created_at ON cupones(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_cupones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cupones_updated_at
  BEFORE UPDATE ON cupones
  FOR EACH ROW
  EXECUTE FUNCTION update_cupones_updated_at();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en la tabla
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Todos los usuarios autenticados pueden ver cupones
CREATE POLICY "Usuarios autenticados pueden ver cupones"
  ON cupones
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para INSERT: Todos los usuarios autenticados pueden crear cupones
CREATE POLICY "Usuarios autenticados pueden crear cupones"
  ON cupones
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE: Todos los usuarios autenticados pueden actualizar cupones
CREATE POLICY "Usuarios autenticados pueden actualizar cupones"
  ON cupones
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para DELETE: Todos los usuarios autenticados pueden eliminar cupones
CREATE POLICY "Usuarios autenticados pueden eliminar cupones"
  ON cupones
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE cupones IS 'Tabla para gestionar cupones de descuento de la tienda';
COMMENT ON COLUMN cupones.id IS 'Identificador único del cupón';
COMMENT ON COLUMN cupones.codigo IS 'Código único del cupón (nombre del cupón)';
COMMENT ON COLUMN cupones.porcentaje_descuento IS 'Porcentaje de descuento del cupón (1-100)';
COMMENT ON COLUMN cupones.usado IS 'Indica si el cupón ya fue usado';
COMMENT ON COLUMN cupones.activo IS 'Indica si el cupón está activo';
COMMENT ON COLUMN cupones.fecha_uso IS 'Fecha en que el cupón fue usado';
COMMENT ON COLUMN cupones.created_at IS 'Fecha de creación del cupón';
COMMENT ON COLUMN cupones.updated_at IS 'Fecha de última actualización del cupón';

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Insertar algunos cupones de ejemplo
INSERT INTO cupones (codigo, porcentaje_descuento, usado, activo) VALUES
  ('BIENVENIDA10', 10, false, true),
  ('DESCUENTO20', 20, false, true),
  ('VERANO25', 25, false, true),
  ('NAVIDAD30', 30, false, false)
ON CONFLICT (codigo) DO NOTHING;
