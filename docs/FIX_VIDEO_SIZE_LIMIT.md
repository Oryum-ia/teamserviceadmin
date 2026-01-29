# Fix: Error "File too large maximum size is 50MB" al subir videos

## Problema
Al intentar subir videos desde el celular en la sección de órdenes, aparecía el error "file too large maximum size is 50mb", incluso cuando los videos eran más pequeños o cuando se esperaba que fueran comprimidos.

## Causa
El límite de 50MB es una restricción de Supabase Storage. Los videos grabados desde celulares modernos pueden fácilmente exceder este límite, especialmente en alta resolución.

## Solución Implementada

### 1. Compresión Automática de Videos
Se implementó compresión de video en el lado del cliente usando la API `MediaRecorder` del navegador:

- **Archivo modificado**: `src/lib/utils/media-compression.utils.ts`
- **Función**: `compressVideo()`
- **Características**:
  - Detecta si el video excede 50MB
  - Si es menor, lo deja sin comprimir
  - Si es mayor, lo recodifica usando WebM con bitrate reducido
  - Reduce la resolución si es necesario (máximo 1280px en móvil, 1920px en desktop)
  - Target: 45MB para tener margen de seguridad

### 2. Límites Ajustados en Componentes

#### EnterpriseMediaCapture
- **Archivo**: `src/components/paneladmin/ordenes/EnterpriseMediaCapture.tsx`
- Cambios:
  - `maxSizeMB` por defecto: 166.67 → 45MB
  - Límite pre-compresión para videos: 500MB
  - Límite pre-compresión para imágenes: 100MB

#### DropZoneImagenes
- **Archivo**: `src/components/paneladmin/ordenes/DropZoneImagenes.tsx`
- Cambios:
  - Acepta videos hasta 500MB antes de compresión
  - Acepta imágenes hasta 50MB
  - Mensaje actualizado: "Imágenes y videos (se comprimirán automáticamente)"

#### ImagenViewer
- **Archivo**: `src/components/paneladmin/ordenes/ImagenViewer.tsx`
- Cambios:
  - Mismos límites que DropZoneImagenes

### 3. Flujo de Compresión

```
Usuario graba video (ej: 150MB)
    ↓
Validación inicial (< 500MB) ✓
    ↓
Compresión automática
    ↓
Video comprimido (ej: 42MB)
    ↓
Subida a Supabase ✓
```

## Tecnología Utilizada

### MediaRecorder API
- Soportado en todos los navegadores modernos
- Codecs probados en orden:
  1. `video/webm;codecs=vp9` (mejor compresión)
  2. `video/webm;codecs=vp8`
  3. `video/webm`
  4. `video/mp4`

### Canvas API
- Redimensiona frames del video
- Mantiene aspect ratio
- Reduce resolución según dispositivo

## Mensajes de Error Mejorados

- **Antes**: "File too large maximum size is 50mb"
- **Ahora**: 
  - "Video es demasiado grande (XXX MB). El límite es 50MB. Por favor graba un video más corto o usa menor resolución."
  - "No se pudo comprimir el video lo suficiente. Tamaño final: XXX MB. Por favor graba un video más corto."

## Indicadores Visuales

Cuando se comprime un video, el usuario ve:
- ✅ Mensaje de "Comprimiendo archivo..."
- ✅ Información de compresión:
  - Tamaño original
  - Tamaño comprimido
  - Porcentaje de reducción

## Limitaciones

1. **Tiempo de compresión**: Videos largos pueden tomar varios segundos en comprimir
2. **Calidad**: La compresión reduce la calidad del video (bitrate reducido)
3. **Compatibilidad**: Requiere navegadores modernos con soporte para MediaRecorder API
4. **Fallback**: Si la compresión falla o no está disponible, muestra error claro al usuario

## Alternativas Consideradas

### 1. FFmpeg.wasm
- **Pros**: Mejor compresión, más control
- **Contras**: Librería pesada (~30MB), más lenta
- **Decisión**: No implementado por ahora

### 2. Aumentar límite en Supabase
- **Pros**: Sin compresión necesaria
- **Contras**: Requiere plan pago, aumenta costos de storage y bandwidth
- **Decisión**: Mantener límite de 50MB

### 3. Subida a servidor externo
- **Pros**: Sin límites de Supabase
- **Contras**: Complejidad adicional, costos
- **Decisión**: No necesario por ahora

## Testing

Para probar la funcionalidad:

1. Abre la app en un celular
2. Ve a crear/editar una orden
3. Graba un video largo (>50MB)
4. Observa el proceso de compresión
5. Verifica que se suba correctamente

## Notas Adicionales

- La compresión solo se aplica a videos que exceden 50MB
- Videos pequeños se suben sin modificar
- Imágenes siguen usando la compresión existente (Canvas API)
- El formato de salida es WebM (ampliamente soportado)

## Fecha
Enero 29, 2025
