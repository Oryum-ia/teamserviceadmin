# Actualización: Filtro de Productos por Código y Nombre

## Fecha
2026-01-29

## Descripción
Se actualizó el sistema de búsqueda de productos para incluir el campo `codigo` además de nombre y descripción.

## Cambios Realizados

### 1. Componente ProductosTienda
📁 `src/components/paneladmin/ProductosTienda.tsx`

**Búsqueda actualizada:**
```typescript
// Filtro por búsqueda (nombre, descripción y código)
if (searchQuery.trim()) {
  const query = searchQuery.toLowerCase();
  resultado = resultado.filter(producto =>
    producto.nombre?.toLowerCase().includes(query) ||
    producto.descripcion?.toLowerCase().includes(query) ||
    producto.codigo?.toLowerCase().includes(query)  // ✨ NUEVO
  );
}
```

**Placeholder actualizado:**
```tsx
<input
  placeholder="Buscar por nombre o código..."  // ✨ ACTUALIZADO
  // ...
/>
```

**Columna de nombre mejorada:**
```tsx
{
  key: 'nombre',
  label: 'Nombre',
  render: (producto) => (
    <div>
      <span>{producto.nombre}</span>
      {producto.codigo && (
        <div className="text-xs">
          Código: {producto.codigo}  // ✨ NUEVO - Muestra el código debajo del nombre
        </div>
      )}
    </div>
  ),
}
```

### 2. Servicio de Productos
📁 `src/lib/services/productoTiendaService.ts`

**Función buscarProductos actualizada:**
```typescript
export async function buscarProductos(termino: string) {
  const { data, error } = await supabase
    .from("producto_tienda")
    .select("*")
    .or(`nombre.ilike.%${termino}%,descripcion.ilike.%${termino}%,codigo.ilike.%${termino}%`)
    //                                                              ^^^^^^^^^^^^^^^^^^^^^^^^ NUEVO
    .order("nombre", { ascending: true });
  
  // ...
}
```

## Funcionalidad

### Búsqueda Mejorada
Los usuarios ahora pueden buscar productos por:
- ✅ **Nombre** del producto
- ✅ **Descripción** del producto
- ✅ **Código** del producto (SKU, referencia, etc.)

### Visualización
- El código se muestra debajo del nombre en la tabla de productos
- Solo se muestra si el producto tiene un código asignado
- Formato: "Código: SKU-12345"

## Ejemplo de Uso

### Búsqueda por nombre:
```
"Aspiradora" → Encuentra todos los productos con "aspiradora" en el nombre
```

### Búsqueda por código:
```
"SKU-001" → Encuentra el producto con código "SKU-001"
"REF-" → Encuentra todos los productos cuyo código empiece con "REF-"
```

### Búsqueda combinada:
La búsqueda es flexible y encuentra coincidencias en cualquiera de los tres campos.

## Beneficios

1. **Búsqueda más rápida**: Los usuarios pueden buscar directamente por código de referencia
2. **Mejor organización**: Facilita la gestión de inventario con códigos únicos
3. **Identificación clara**: El código se muestra junto al nombre para fácil identificación
4. **Compatibilidad**: Funciona con productos que no tienen código asignado

## Notas

- La búsqueda es **case-insensitive** (no distingue mayúsculas/minúsculas)
- La búsqueda es **parcial** (encuentra coincidencias en cualquier parte del texto)
- El campo código es **opcional** - productos sin código siguen funcionando normalmente
