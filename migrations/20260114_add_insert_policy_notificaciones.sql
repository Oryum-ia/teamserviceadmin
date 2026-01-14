-- Migración: Agregar política RLS para permitir insertar notificaciones
-- Fecha: 2026-01-14
-- Descripción: Permite a usuarios autenticados crear notificaciones en la tabla

-- Primero verificar las políticas existentes y agregar una para INSERT
-- Esta política permite que cualquier usuario autenticado pueda insertar notificaciones

-- Política para INSERT - Usuarios autenticados pueden crear notificaciones
CREATE POLICY "Usuarios autenticados pueden crear notificaciones" 
ON public.notificaciones 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Alternativa: Si la tabla no tiene RLS habilitado correctamente
-- ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Si necesitas que todos puedan insertar (incluyendo service role):
-- CREATE POLICY "Service role puede crear notificaciones" 
-- ON public.notificaciones 
-- FOR INSERT 
-- TO service_role 
-- WITH CHECK (true);
