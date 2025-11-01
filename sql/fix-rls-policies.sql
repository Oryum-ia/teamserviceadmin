-- =====================================================
-- SCRIPT DE CORRECCIÓN DE POLÍTICAS RLS
-- =====================================================
-- Este script corrige los problemas de Row Level Security
-- para permitir la creación de órdenes
-- =====================================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES DE ÓRDENES
-- =====================================================

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver órdenes" ON ordenes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear órdenes" ON ordenes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar órdenes" ON ordenes;

-- 2. CREAR NUEVAS POLÍTICAS RLS PARA ÓRDENES
-- =====================================================

-- Política de SELECT: Todos los usuarios autenticados pueden ver órdenes
CREATE POLICY "ordenes_select_policy" ON ordenes
    FOR SELECT
    TO authenticated
    USING (true);

-- Política de INSERT: Todos los usuarios autenticados pueden crear órdenes
CREATE POLICY "ordenes_insert_policy" ON ordenes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política de UPDATE: Todos los usuarios autenticados pueden actualizar órdenes
CREATE POLICY "ordenes_update_policy" ON ordenes
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política de DELETE: Solo administradores y super-admin pueden eliminar
CREATE POLICY "ordenes_delete_policy" ON ordenes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.role IN ('administrador', 'super-admin')
        )
    );

-- 3. VERIFICAR QUE RLS ESTÉ HABILITADO
-- =====================================================

ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS SIMILARES PARA COMENTARIOS
-- =====================================================

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver comentarios" ON comentarios;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear comentarios" ON comentarios;

CREATE POLICY "comentarios_select_policy" ON comentarios
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "comentarios_insert_policy" ON comentarios
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "comentarios_update_policy" ON comentarios
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- ✅ SCRIPT COMPLETADO
-- =====================================================
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto de Supabase
-- 2. Abre SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script
-- 5. Prueba crear una orden nuevamente
--
-- =====================================================
