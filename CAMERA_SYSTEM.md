# 📷 Sistema de Cámara Integrado

## Descripción

Sistema de captura de fotos y videos directamente desde la cámara del dispositivo, optimizado para móviles y tablets.

## ✨ Características

### 📸 Captura de Fotos
- Acceso directo a la cámara del dispositivo
- Preview antes de guardar
- Opción de repetir la captura
- Calidad optimizada (JPEG 90%)
- Cámara trasera por defecto en móviles

### 🎥 Grabación de Videos
- Grabación de video con audio
- Timer de duración en tiempo real
- Indicador visual de grabación (REC)
- Preview del video antes de guardar
- Formato WebM optimizado

### 🔄 Integración Automática
- Se integra automáticamente en todos los formularios que usan `DropZoneImagenes`
- Los archivos capturados se añaden a la lista existente de fotos/videos
- Compatible con el sistema de drag & drop existente

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome/Edge (móvil y desktop)
- ✅ Safari (iOS 14.3+)
- ✅ Firefox (móvil y desktop)
- ✅ Samsung Internet
- ✅ Opera

### Dispositivos
- ✅ Android (Chrome, Firefox, Samsung Internet)
- ✅ iOS (Safari 14.3+)
- ✅ Desktop (Windows, Mac, Linux)
- ✅ Tablets

## 🎯 Ubicaciones Disponibles

El sistema de cámara está disponible en:

1. **DiagnosticoForm** - Fotos del diagnóstico
2. **ReparacionForm** - Fotos de la reparación
3. **EntregaForm** - Fotos de entrega
4. **Cualquier formulario** que use `DropZoneImagenes` o `ImagenViewer`

## 🚀 Uso

### Para el Usuario

1. **Tomar Foto:**
   - Clic en botón "📷 Cámara"
   - Permitir acceso a la cámara
   - Presionar el botón circular blanco
   - Revisar preview
   - Confirmar o repetir

2. **Grabar Video:**
   - Clic en botón "🎥 Video"
   - Permitir acceso a cámara y micrófono
   - Presionar botón para iniciar grabación
   - Presionar nuevamente para detener
   - Revisar preview
   - Confirmar o repetir

### Permisos Requeridos

El navegador solicitará permisos para:
- 📷 **Cámara**: Necesario para fotos y videos
- 🎤 **Micrófono**: Solo para grabación de videos

## 🔧 Componentes

### `CameraCapture.tsx`
Componente principal que maneja toda la lógica de captura.

**Props:**
```typescript
interface CameraCaptureProps {
  onCapture: (file: File) => void;  // Callback con el archivo capturado
  disabled?: boolean;                // Deshabilitar botones
  mode?: 'photo' | 'video' | 'both'; // Modo de captura
}
```

**Uso:**
```tsx
<CameraCapture 
  onCapture={(file) => handleFileCapture(file)}
  disabled={isUploading}
  mode="both"
/>
```

### Integración en `DropZoneImagenes`
```tsx
// Botones de cámara aparecen automáticamente
<DropZoneImagenes
  onFilesSelected={handleFiles}
  isUploading={uploading}
/>
```

### Integración en `ImagenViewer`
```tsx
// Botones aparecen cuando hay fotos y se puede editar
<ImagenViewer
  imagenes={fotos}
  onFilesDropped={handleFiles}
  puedeEditar={true}
/>
```

## 📐 Especificaciones Técnicas

### Fotos
- **Formato**: JPEG
- **Calidad**: 90%
- **Resolución**: Hasta 1920x1080 (Full HD)
- **Tamaño estimado**: 200KB - 2MB por foto

### Videos
- **Formato**: WebM (VP8 + Opus)
- **Resolución**: Hasta 1920x1080 (Full HD)
- **Audio**: Opus codec
- **Tamaño estimado**: ~1MB por cada 10 segundos

## 🎨 Diseño

### Botones
- **Foto**: Azul (🔵 Cámara)
- **Video**: Morado (🟣 Video)
- **Responsive**: Se adaptan a móvil y desktop
- **Estados**: Normal, hover, disabled

### Modal de Captura
- **Fullscreen**: Ocupa toda la pantalla
- **Fondo oscuro**: Para mejor visualización
- **Controles grandes**: Optimizados para touch
- **Preview**: Vista previa antes de confirmar

## ⚡ Optimizaciones

### Performance
- ✅ Stream de cámara se detiene automáticamente
- ✅ Memoria liberada al cerrar modal
- ✅ Compresión de imágenes
- ✅ Formato WebM eficiente para videos

### UX
- ✅ Cámara trasera por defecto en móviles
- ✅ Indicador visual de grabación
- ✅ Timer de duración
- ✅ Preview antes de guardar
- ✅ Opción de repetir captura
- ✅ Mensajes de error claros

## 🐛 Manejo de Errores

### Errores Comunes

1. **"No se pudo acceder a la cámara"**
   - Verificar permisos del navegador
   - Verificar que no esté en uso por otra app
   - En iOS: verificar que sea HTTPS

2. **"No se pudo iniciar la grabación"**
   - Verificar permisos de micrófono
   - Verificar espacio disponible
   - Verificar codec WebM soportado

### Fallbacks
- Mensaje de error claro al usuario
- Botón de "Reintentar"
- Opción de usar método tradicional (subir archivo)

## 🔒 Seguridad

- ✅ Solo funciona en HTTPS (producción)
- ✅ Permisos solicitados explícitamente
- ✅ Stream se detiene al cerrar
- ✅ No se almacena en caché del navegador
- ✅ Archivos procesados en memoria

## 📊 Ventajas vs Subir Archivo

| Característica | Cámara Integrada | Subir Archivo |
|---------------|------------------|---------------|
| Pasos | 2 clicks | 4-5 clicks |
| Tiempo | ~5 segundos | ~15 segundos |
| Preview | ✅ Sí | ❌ No |
| Repetir | ✅ Fácil | ❌ Difícil |
| Móvil | ✅ Optimizado | ⚠️ Regular |
| Offline | ❌ No | ✅ Sí |

## 🎯 Casos de Uso

### Técnico en Campo
1. Llega al lugar de reparación
2. Abre formulario en móvil
3. Presiona "Cámara"
4. Toma fotos del equipo
5. Confirma y sube automáticamente

### Diagnóstico Rápido
1. Recibe equipo
2. Toma fotos del estado
3. Graba video del problema
4. Todo se sube al diagnóstico

### Entrega
1. Equipo reparado
2. Toma fotos del resultado
3. Cliente firma
4. Entrega completada

## 🔮 Futuras Mejoras

- [ ] Soporte para múltiples cámaras (frontal/trasera)
- [ ] Filtros y edición básica
- [ ] Compresión adicional para conexiones lentas
- [ ] Modo offline con sincronización posterior
- [ ] Anotaciones sobre las fotos
- [ ] Límite de duración para videos
- [ ] Contador de espacio disponible

## 📝 Notas

- En iOS, la cámara solo funciona en HTTPS
- En algunos Android antiguos, WebM puede no estar soportado
- El tamaño máximo de archivo sigue siendo 50MB
- Los videos se graban en formato WebM (compatible con la mayoría de navegadores modernos)
