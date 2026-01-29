# Migración: Agregar campos sub_categoria y codigo a producto_tienda

## Fecha
2026-01-29

## Descripción
Se agregan dos nuevos campos a la tabla `producto_tienda`:
- `sub_categoria`: Sub-categoría o línea del producto (ej: "Pro Series", "Home Edition")
- `codigo`: Código de referencia del producto (ej: "SKU-12345")

## Estado
⚠️ **PENDIENTE DE EJECUTAR**

## Instrucciones

### 1. Acceder al SQL Editor de Supabase
Ve a: https://tscotizacion.tscosta.com.co/project/default/sql

### 2. Ejecutar el siguiente SQL

```sql
-- Agregar columna sub_categoria (texto opcional)
ALTER TABLE producto_tienda 
ADD COLUMN IF NOT EXISTS sub_categoria TEXT;

-- Agregar columna codigo (texto opcional)
ALTER TABLE producto_tienda 
ADD COLUMN IF NOT EXISTS codigo TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN producto_tienda.sub_categoria IS 'Sub-categoría o línea del producto';
COMMENT ON COLUMN producto_tienda.codigo IS 'Código de referencia del producto';
```

### 3. Verificar la migración

Ejecuta el siguiente comando en tu terminal:

```bash
node scripts/ejecutar-migracion.js
```

Deberías ver:
```
✅ Las columnas sub_categoria y codigo ya existen
```

## Cambios en el código

### Archivos modificados:
1. ✅ `src/types/database.types.ts` - Agregados campos al interface ProductoTienda
2. ✅ `src/components/paneladmin/ProductoTiendaModal.tsx` - Agregados inputs en el formulario
3. ✅ `src/lib/services/productoTiendaService.ts` - No requiere cambios (maneja campos dinámicamente)

### Nuevos campos en el formulario:
- **Sub-categoría**: Campo de texto opcional para especificar la línea o sub-categoría del producto
- **Código**: Campo de texto opcional para el código de referencia (SKU, código interno, etc.)

## Uso

Una vez ejecutada la migración, los campos estarán disponibles en:
- Modal de crear/editar producto
- API de productos
- Base de datos

Los campos son opcionales y no afectan productos existentes.
