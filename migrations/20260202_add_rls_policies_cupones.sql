-- =====================================================
-- MIGRACIÓN: Agregar políticas RLS para tabla cupones
-- Fecha: 2026-02-02
-- Descripción: Habilita RLS y crea políticas para la tabla cupones
-- =====================================================

-- Habilitar RLS en la tabla cupones
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Usuarios autenticados pueden ver todos los cupones
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver cupones" ON cupones;
CREATE POLICY "Usuarios autenticados pueden ver cupones" ON cupones
    FOR SELECT TO authenticated USING (true);

-- Política para INSERT: Usuarios autenticados pueden crear cupones
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear cupones" ON cupones;
CREATE POLICY "Usuarios autenticados pueden crear cupones" ON cupones
    FOR INSERT TO authenticated WITH CHECK (true);

-- Política para UPDATE: Usuarios autenticados pueden actualizar cupones
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar cupones" ON cupones;
CREATE POLICY "Usuarios autenticados pueden actualizar cupones" ON cupones
    FOR UPDATE TO authenticated USING (true);

-- Política para DELETE: Usuarios autenticados pueden eliminar cupones
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar cupones" ON cupones;
CREATE POLICY "Usuarios autenticados pueden eliminar cupones" ON cupones
    FOR DELETE TO authenticated USING (true);

-- Política pública para validar cupones (sin autenticación)
-- Permite a usuarios anónimos validar cupones activos y no usados
DROP POLICY IF EXISTS "Usuarios anónimos pueden validar cupones activos" ON cupones;
CREATE POLICY "Usuarios anónimos pueden validar cupones activos" ON cupones
    FOR SELECT TO anon USING (activo = true AND usado = false);

-- =====================================================
-- ✅ MIGRACIÓN COMPLETADA
-- =====================================================
-- 
-- Esta migración:
-- 1. Habilita RLS en la tabla cupones
-- 2. Permite a usuarios autenticados gestionar cupones (CRUD completo)
-- 3. Permite a usuarios anónimos validar cupones activos
-- 
-- IMPORTANTE: Ejecuta este script en Supabase SQL Editor
-- =====================================================
