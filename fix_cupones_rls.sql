-- ============================================
-- FIX: Políticas RLS para tabla cupones
-- ============================================

-- 1. Habilitar RLS (si no está habilitado)
ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR todas las políticas existentes
DROP POLICY IF EXISTS "authenticated_select_cupones" ON public.cupones;
DROP POLICY IF EXISTS "authenticated_all_cupones" ON public.cupones;
DROP POLICY IF EXISTS "anon_select_active_cupones" ON public.cupones;
DROP POLICY IF EXISTS "authenticated_users_all_cupones" ON public.cupones;
DROP POLICY IF EXISTS "anon_users_select_active_cupones" ON public.cupones;

-- 3. CREAR nuevas políticas correctas

-- Política 1: Usuarios autenticados pueden hacer TODO en cupones
CREATE POLICY "authenticated_users_all_cupones" ON public.cupones
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política 2: Usuarios anónimos solo pueden VER cupones activos y no usados
CREATE POLICY "anon_users_select_active_cupones" ON public.cupones
  FOR SELECT
  TO anon
  USING (activo = true AND usado = false);

-- 4. Verificar políticas creadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'cupones'
ORDER BY policyname;
