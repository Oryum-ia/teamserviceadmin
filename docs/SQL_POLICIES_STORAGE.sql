
-- ==============================================================================
-- INSTRUCCIONES PARA HABILITAR POLÍTICAS DE SEGURIDAD (RLS) EN STORAGE
-- ==============================================================================
-- Copia y ejecuta este script en el Editor SQL de tu Dashboard de Supabase.
-- Esto permitirá que los usuarios suban archivos directamente sin usar el API Proxy.
-- ==============================================================================

-- 1. Habilitar RLS en la tabla de objetos de storage (si no está habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Política de LECTURA PÚBLICA (SELECT)
-- Permite que cualquiera vea las imágenes (necesario para mostrar en la web)
CREATE POLICY "Public Access Select"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('ordenes-imagenes', 'avatars', 'firmas') );

-- 3. Política de ESCRITURA (INSERT) para usuarios autenticados
-- Permite subir archivos a cualquier usuario logueado
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id IN ('ordenes-imagenes', 'avatars', 'firmas') );

-- 4. Política de ACTUALIZACIÓN (UPDATE)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id IN ('ordenes-imagenes', 'avatars', 'firmas') );

-- 5. Política de ELIMINACIÓN (DELETE)
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id IN ('ordenes-imagenes', 'avatars', 'firmas') );

-- ==============================================================================
-- NOTA: Si prefieres seguridad más estricta (ej: que solo el dueño pueda borrar),
-- puedes usar: (auth.uid() = owner) en el USING.
-- Pero para este sistema admin, 'authenticated' suele ser suficiente.
-- ==============================================================================
