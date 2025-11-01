-- ============================================
-- POLÍTICAS RLS PARA TABLA USUARIOS
-- Con restricciones basadas en roles
-- ============================================

-- Primero, eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer todos los usuarios" ON usuarios;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear usuarios" ON usuarios;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar usuarios" ON usuarios;

-- ============================================
-- 1. POLÍTICA DE LECTURA (SELECT)
-- Todos los usuarios autenticados pueden ver todos los usuarios
-- ============================================
CREATE POLICY "Usuarios autenticados pueden leer usuarios"
ON usuarios
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 2. POLÍTICA DE CREACIÓN (INSERT)
-- Solo super-admin puede crear usuarios
-- ============================================
CREATE POLICY "Solo super-admin puede crear usuarios"
ON usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND rol = 'super-admin'
  )
);

-- ============================================
-- 3. POLÍTICA DE ACTUALIZACIÓN (UPDATE)
-- - Cada usuario puede actualizar sus propios datos (excepto rol y password)
-- - Super-admin puede actualizar cualquier usuario
-- - Admin puede actualizar técnicos
-- ============================================

-- 3.1. Los usuarios pueden actualizar sus propios datos
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (
    -- No pueden cambiar su propio rol
    rol = (SELECT rol FROM usuarios WHERE id = auth.uid())
  )
);

-- 3.2. Super-admin puede actualizar cualquier usuario
CREATE POLICY "Super-admin puede actualizar cualquier usuario"
ON usuarios
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND rol = 'super-admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND rol = 'super-admin'
  )
);

-- 3.3. Admin puede actualizar técnicos (pero no otros admins ni super-admins)
CREATE POLICY "Admin puede actualizar técnicos"
ON usuarios
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND rol = 'admin'
  )
  AND rol = 'tecnico'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND rol = 'admin'
  )
  AND rol = 'tecnico'
);

-- ============================================
-- 4. POLÍTICA DE ELIMINACIÓN (DELETE)
-- Solo super-admin puede eliminar usuarios
-- No puede eliminarse a sí mismo
-- ============================================
CREATE POLICY "Solo super-admin puede eliminar usuarios"
ON usuarios
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND rol = 'super-admin'
  )
  AND id != auth.uid() -- No puede eliminarse a sí mismo
);

-- ============================================
-- NOTA: CAMBIO DE CONTRASEÑAS
-- ============================================
-- Para cambiar contraseñas de forma segura:
-- 1. Los usuarios cambian su propia contraseña con: supabase.auth.updateUser({ password: 'nueva' })
-- 2. Super-admin puede cambiar contraseñas de otros actualizando el campo 'password' en la tabla
--    (esto requiere que el campo password esté hasheado o se maneje con una función)

-- ============================================
-- VERIFICAR POLÍTICAS
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename = 'usuarios';
