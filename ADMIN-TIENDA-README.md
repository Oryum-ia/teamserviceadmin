# Módulo de Administración de Tienda

## 📋 Descripción

Este módulo permite gestionar los productos y el carrusel de imágenes de la landing page de TeamServiceCosta desde el panel de administración.

## ✨ Características Implementadas

### 1. **Productos de Tienda**
- ✅ Tabla con listado de productos
- ✅ Búsqueda por nombre y descripción
- ✅ Paginación (10, 20, 50 items por página)
- ✅ Carga de imágenes de productos
- ✅ Toggle activo/inactivo (botón verde/rojo deslizante)
- ✅ Campos: nombre, descripción, precio, stock, imagen, promoción, activo
- ✅ Modal para crear/editar productos

### 2. **Carrusel de Imágenes**
- ✅ Vista en grid de imágenes del carrusel
- ✅ Carga de imágenes
- ✅ Orden personalizable (botones arriba/abajo)
- ✅ Toggle activo/inactivo
- ✅ Campos: título, descripción, imagen, orden, activo
- ✅ Modal para crear/editar imágenes

### 3. **Navegación**
- ✅ Menú "Admin-tienda" en el sidebar con submenús:
  - Productos
  - Carrusel

## 🗄️ Base de Datos

### Tablas Creadas

#### **producto_tienda**
```sql
- id (UUID, PK)
- nombre (TEXT, required)
- descripcion (TEXT, optional)
- precio (NUMERIC, optional)
- stock (INTEGER, optional)
- imagen_url (TEXT, optional)
- promocion (BOOLEAN, default: false)
- activo (BOOLEAN, default: true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **carrusel**
```sql
- id (UUID, PK)
- titulo (TEXT, optional)
- descripcion (TEXT, optional)
- imagen_url (TEXT, required)
- orden (INTEGER, default: 0)
- activo (BOOLEAN, default: true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Storage Bucket
- **Nombre:** `imagenes-tienda`
- **Público:** Sí
- **Carpetas:**
  - `/productos` - Imágenes de productos
  - `/carrusel` - Imágenes del carrusel

## 🚀 Pasos de Instalación

### 1. Crear las Tablas en Supabase

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta el script completo en `database-schemas-tienda.sql`
3. Verifica que las tablas se crearon correctamente

### 2. Crear el Storage Bucket

#### Opción A: Desde Supabase Dashboard (Recomendado)
1. Ve a Storage → Create a new bucket
2. Nombre: `imagenes-tienda`
3. Marca como **Public bucket**
4. Click en "Create bucket"

#### Opción B: Via SQL
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagenes-tienda', 'imagenes-tienda', true);
```

### 3. Configurar Políticas del Storage

Ejecuta estos comandos en SQL Editor:

```sql
-- Permitir subida a usuarios autenticados
CREATE POLICY "Permitir subida de imágenes a usuarios autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'imagenes-tienda');

-- Permitir lectura pública
CREATE POLICY "Permitir lectura pública de imágenes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'imagenes-tienda');

-- Permitir eliminación a usuarios autenticados
CREATE POLICY "Permitir eliminación de imágenes a usuarios autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'imagenes-tienda');
```

### 4. Verificar la Instalación

1. Inicia sesión en el panel de administración
2. Ve a **Admin-tienda** → **Productos**
3. Intenta crear un producto nuevo con una imagen
4. Ve a **Admin-tienda** → **Carrusel**
5. Intenta agregar una imagen al carrusel

## 📁 Archivos Creados

### Componentes
- `src/components/paneladmin/ProductosTienda.tsx` - Tabla de productos
- `src/components/paneladmin/ProductoTiendaModal.tsx` - Modal para productos
- `src/components/paneladmin/Carrusel.tsx` - Gestión del carrusel

### Servicios
- `src/lib/services/productoTiendaService.ts` - CRUD de productos
- `src/lib/services/carruselService.ts` - CRUD de carrusel

### Tipos
- Actualizado `src/types/database.types.ts` con:
  - `ProductoTienda`
  - `CarruselImagen`

### Configuración
- Actualizado `src/components/paneladmin/SidebarNuevo.tsx` - Menú Admin-tienda
- Actualizado `src/app/paneladmin/page.tsx` - Integración de componentes

## 🎨 Características de la UI

### Toggle Activo/Inactivo
- **Verde** (deslizado a la derecha) = Activo
- **Rojo** (deslizado a la izquierda) = Inactivo
- Cambio instantáneo con confirmación via toast

### Carga de Imágenes
- Drag & drop o click para seleccionar
- Vista previa inmediata
- Validación de tipo (solo imágenes)
- Validación de tamaño (máx 5MB)
- Subida automática a Supabase Storage

### Carrusel
- Reordenamiento con botones ↑ ↓
- Badge visual con número de orden
- Grid responsive (1-3 columnas según pantalla)

## 🔒 Seguridad

### Row Level Security (RLS)
- **Lectura pública:** Solo productos/imágenes activos
- **Escritura:** Solo usuarios autenticados (administradores)

### Storage
- **Subida:** Solo usuarios autenticados
- **Lectura:** Pública (para la landing page)
- **Eliminación:** Solo usuarios autenticados

## 🐛 Solución de Problemas

### Error: "storage/objects: permission denied"
**Solución:** Verifica que las políticas del storage estén correctamente configuradas.

### Error: "relation 'producto_tienda' does not exist"
**Solución:** Ejecuta el script SQL de creación de tablas.

### Las imágenes no se cargan
**Solución:** 
1. Verifica que el bucket `imagenes-tienda` exista
2. Verifica que el bucket sea público
3. Revisa las políticas del storage

### Error al actualizar orden del carrusel
**Solución:** Verifica que todas las imágenes tengan un valor de `orden` definido.

## 📊 Datos de Prueba

Para probar el módulo, puedes insertar datos de ejemplo:

```sql
-- Producto de prueba
INSERT INTO public.producto_tienda (nombre, descripcion, precio, stock, activo)
VALUES ('Laptop Dell XPS 15', 'Laptop de alta gama para profesionales', 1299.99, 10, true);

-- Imagen de carrusel de prueba
INSERT INTO public.carrusel (titulo, descripcion, imagen_url, orden, activo)
VALUES ('Bienvenido a TeamServiceCosta', 'Reparación y mantenimiento de equipos', 'https://example.com/banner.jpg', 0, true);
```

## 🔄 Próximas Mejoras

Funcionalidades que podrían agregarse:
- [ ] Categorías de productos
- [ ] Descuentos y precios promocionales
- [ ] Múltiples imágenes por producto
- [ ] Drag & drop para reordenar carrusel
- [ ] Análisis de productos más vistos
- [ ] Inventario y alertas de stock bajo

## 📞 Soporte

Si tienes problemas con la implementación:
1. Revisa los logs del navegador (F12 → Console)
2. Verifica los logs de Supabase (Dashboard → Logs)
3. Consulta la documentación de Supabase Storage

---

**Versión:** 1.0.0  
**Fecha:** 26/10/2025  
**Autor:** TeamServiceCosta Dev Team
