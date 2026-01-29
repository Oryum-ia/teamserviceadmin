# Fix: Pérdida de Datos al Eliminar Imagen en ProductoTiendaModal

## Problema
Cuando se elimina una imagen de un producto en el modal de creación/edición (`ProductoTiendaModal`), se pierden todos los datos del formulario (nombre, descripción, precio, etc.).

## Causa Raíz
El problema está en la función `handleEliminarImagen` del componente `ProductoTiendaModal.tsx`. Aunque el código usa correctamente el spread operator `...prev` para preservar los datos existentes, hay un problema de sincronización entre:

1. `formData.imagenes` - Array de URLs de imágenes
2. `imagePreviews` - Array de previsualizaciones

Cuando se elimina una imagen, ambos estados se actualizan, pero si hay algún re-render o actualización de estado intermedia, puede causar que el formulario se resetee.

## Análisis del Código Actual

```typescript
const handleEliminarImagen = (url: string, index: number) => {
  try {
    console.log('Eliminando imagen en índice:', index, 'Total:', formData.imagenes.length);
    const nuevasImagenes = formData.imagenes.filter((_, i) => i !== index);
    console.log('Nuevas imágenes:', nuevasImagenes.length);
    setFormData(prev => ({ ...prev, imagenes: nuevasImagenes }));
    setImagePreviews(nuevasImagenes);
    toast.success('Imagen eliminada');
  } catch (err) {
    console.error('Error al eliminar imagen:', err);
    toast.error('Error al eliminar la imagen');
  }
};
```

El código parece correcto, pero el problema puede estar en:
1. Múltiples actualizaciones de estado que causan re-renders
2. El componente `ImagenViewer` que llama a `onEliminar` puede estar causando efectos secundarios

## Solución

### Opción 1: Usar useCallback para estabilizar la función (Recomendada)

```typescript
const handleEliminarImagen = React.useCallback((url: string, index: number) => {
  try {
    console.log('Eliminando imagen en índice:', index, 'Total:', formData.imagenes.length);
    
    setFormData(prev => {
      const nuevasImagenes = prev.imagenes.filter((_, i) => i !== index);
      console.log('Nuevas imágenes:', nuevasImagenes.length);
      
      // Actualizar imagePreviews en el mismo ciclo
      setImagePreviews(nuevasImagenes);
      
      return { ...prev, imagenes: nuevasImagenes };
    });
    
    toast.success('Imagen eliminada');
  } catch (err) {
    console.error('Error al eliminar imagen:', err);
    toast.error('Error al eliminar la imagen');
  }
}, [formData.imagenes]);
```

### Opción 2: Usar un solo estado para imágenes

Eliminar `imagePreviews` y usar solo `formData.imagenes`:

```typescript
// Eliminar esta línea:
// const [imagePreviews, setImagePreviews] = useState<string[]>([]);

// Usar directamente formData.imagenes en el JSX:
<ImagenViewer
  imagenes={formData.imagenes}  // En lugar de imagePreviews
  onEliminar={handleEliminarImagen}
  puedeEditar={true}
  onFilesDropped={handleImageUpload}
  isUploading={uploadingImage}
  onReordenar={handleReordenarImagenes}
/>
```

Y actualizar las funciones:

```typescript
const handleEliminarImagen = (url: string, index: number) => {
  try {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }));
    toast.success('Imagen eliminada');
  } catch (err) {
    console.error('Error al eliminar imagen:', err);
    toast.error('Error al eliminar la imagen');
  }
};

const handleImageUpload = async (files: File[]) => {
  if (files.length === 0) return;

  setUploadingImage(true);
  try {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} supera los 5MB`);
        continue;
      }
      
      const imageUrl = await subirImagenProducto(file);
      uploadedUrls.push(imageUrl);
    }
    
    if (uploadedUrls.length > 0) {
      setFormData(prev => ({ 
        ...prev, 
        imagenes: [...prev.imagenes, ...uploadedUrls] 
      }));
      toast.success(`${uploadedUrls.length} imagen(es) cargada(s) exitosamente`);
    }
  } catch (err) {
    console.error('Error al subir imágenes:', err);
    toast.error('Error al subir las imágenes');
  } finally {
    setUploadingImage(false);
  }
};

const handleReordenarImagenes = (nuevasImagenes: string[]) => {
  try {
    setFormData(prev => ({ ...prev, imagenes: nuevasImagenes }));
  } catch (err) {
    console.error('Error al reordenar imágenes:', err);
    toast.error('Error al reordenar las imágenes');
  }
};
```

## Implementación Recomendada

La **Opción 2** es la más limpia y elimina la duplicación de estado, lo que previene problemas de sincronización.

## Archivos Afectados
- `src/components/paneladmin/ProductoTiendaModal.tsx`

## Fecha
29 de enero de 2026
