# 📝 Sistema de Firmas Digitales y Términos y Condiciones

## 🎯 Descripción General

Sistema completo para:
1. ✅ Aceptación de términos y condiciones (obligatorio antes de avanzar de Recepción)
2. ✅ Firma digital del cliente al recibir el equipo (Recepción)
3. ✅ Firma digital del cliente al retirar el equipo (Entrega)

---

## 🗃️ **Campos Agregados a la DB**

### Tabla: `ordenes`

```sql
-- Términos y condiciones
terminos_aceptados          BOOLEAN DEFAULT FALSE
fecha_aceptacion_terminos   TIMESTAMP WITH TIME ZONE

-- Firma en recepción
firma_cliente               TEXT  -- Base64 de la firma
fecha_firma_cliente         TIMESTAMP WITH TIME ZONE

-- Firma en entrega
firma_entrega               TEXT  -- Base64 de la firma
fecha_firma_entrega         TIMESTAMP WITH TIME ZONE
```

### 📊 **¿Por qué Base64?**

**Ventajas:**
- ✅ Simple y directo
- ✅ No requiere storage externo
- ✅ Fácil de implementar
- ✅ Ideal para firmas (< 50KB)
- ✅ Se puede mostrar directamente como `<img src="data:image/png;base64,...">`

**Tamaño estimado:**
- Firma típica: 10-30 KB en Base64
- 1000 ordenes con 2 firmas c/u: ~40-60 MB en DB (totalmente manejable)

---

## 📁 **Archivos Creados**

### 1. **Migración SQL**
```
migrations/add_firmas_y_terminos.sql
```
- Agrega todos los campos necesarios
- Crea índices
- Incluye comentarios de documentación

### 2. **Componente de Firma**
```
src/components/FirmaPad.tsx
```
- Canvas HTML5 para dibujar
- Soporte mouse y touch (móviles/tablets)
- Guarda como Base64
- Botón limpiar y guardar
- Componente de visualización (`FirmaDisplay`)

### 3. **Componente de Términos**
```
src/components/TerminosCondicionesModal.tsx
```
- Modal con términos completos
- Requiere scroll hasta el final
- Checkbox de aceptación
- Bloquea avance sin aceptar

---

## 🚀 **Pasos de Implementación**

### PASO 1: Ejecutar Migración SQL

1. Abre Supabase SQL Editor
2. Ejecuta el contenido de `migrations/add_firmas_y_terminos.sql`
3. Verifica que los campos se agregaron:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ordenes' 
AND column_name LIKE '%firma%' OR column_name LIKE '%terminos%';
```

### PASO 2: Integrar en RecepcionForm

Modifica `src/components/paneladmin/ordenes/RecepcionForm.tsx`:

```typescript
import FirmaPad, { FirmaDisplay } from '@/components/FirmaPad';
import TerminosCondicionesModal from '@/components/TerminosCondicionesModal';

// Estados
const [showFirmaPad, setShowFirmaPad] = useState(false);
const [showTerminos, setShowTerminos] = useState(false);
const [firmaCliente, setFirmaCliente] = useState<string | null>(orden.firma_cliente);
const [terminosAceptados, setTerminosAceptados] = useState(orden.terminos_aceptados);

// Guardar firma
const handleGuardarFirma = async (firmaBase64: string) => {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    await supabase
      .from('ordenes')
      .update({
        firma_cliente: firmaBase64,
        fecha_firma_cliente: new Date().toISOString()
      })
      .eq('id', orden.id);
    
    setFirmaCliente(firmaBase64);
    setShowFirmaPad(false);
    toast.success('Firma guardada correctamente');
  } catch (error) {
    toast.error('Error al guardar firma');
  }
};

// Aceptar términos
const handleAceptarTerminos = async () => {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    await supabase
      .from('ordenes')
      .update({
        terminos_aceptados: true,
        fecha_aceptacion_terminos: new Date().toISOString()
      })
      .eq('id', orden.id);
    
    setTerminosAceptados(true);
    setShowTerminos(false);
    toast.success('Términos aceptados');
  } catch (error) {
    toast.error('Error al aceptar términos');
  }
};

// En el JSX
<div className="space-y-6">
  {/* Términos y Condiciones */}
  <div className="border rounded-lg p-4">
    <h3 className="font-medium mb-2">Términos y Condiciones</h3>
    {terminosAceptados ? (
      <div className="flex items-center gap-2 text-green-600">
        <Check className="w-5 h-5" />
        <span>Términos aceptados</span>
      </div>
    ) : (
      <button
        onClick={() => setShowTerminos(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        Ver y Aceptar Términos
      </button>
    )}
  </div>

  {/* Firma del Cliente */}
  <div className="border rounded-lg p-4">
    <h3 className="font-medium mb-2">Firma del Cliente</h3>
    {firmaCliente ? (
      <FirmaDisplay firmaBase64={firmaCliente} />
    ) : (
      <button
        onClick={() => setShowFirmaPad(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
      >
        Capturar Firma
      </button>
    )}
  </div>
</div>

{/* Modales */}
{showTerminos && (
  <TerminosCondicionesModal
    isOpen={showTerminos}
    onClose={() => setShowTerminos(false)}
    onAceptar={handleAceptarTerminos}
    yAceptados={terminosAceptados}
  />
)}

{showFirmaPad && (
  <FirmaPad
    onSave={handleGuardarFirma}
    onCancel={() => setShowFirmaPad(false)}
    firmaExistente={firmaCliente}
    titulo="Firma del Cliente - Recepción"
  />
)}
```

### PASO 3: Bloquear Avance sin Términos

En `src/app/paneladmin/ordenes/[id]/page.tsx`:

```typescript
const handleAvanzarFase = async () => {
  // Verificar términos en fase de recepción
  const faseId = mapEstadoAFase(orden?.estado_actual);
  
  if (faseId === 'recepcion' && !orden?.terminos_aceptados) {
    toast.error('Debe aceptar los términos y condiciones antes de avanzar');
    return;
  }
  
  if (faseId === 'recepcion' && !orden?.firma_cliente) {
    toast.error('Debe capturar la firma del cliente antes de avanzar');
    return;
  }
  
  // ... resto del código
};
```

### PASO 4: Integrar en EntregaForm

Similar a Recepción, pero usando `firma_entrega`:

```typescript
// En EntregaForm.tsx
const [firmaEntrega, setFirmaEntrega] = useState<string | null>(orden.firma_entrega);

const handleGuardarFirmaEntrega = async (firmaBase64: string) => {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    await supabase
      .from('ordenes')
      .update({
        firma_entrega: firmaBase64,
        fecha_firma_entrega: new Date().toISOString()
      })
      .eq('id', orden.id);
    
    setFirmaEntrega(firmaBase64);
    setShowFirmaPad(false);
    toast.success('Firma de entrega guardada');
  } catch (error) {
    toast.error('Error al guardar firma');
  }
};

// JSX
<div className="border rounded-lg p-4">
  <h3 className="font-medium mb-2">Firma de Entrega</h3>
  {firmaEntrega ? (
    <FirmaDisplay firmaBase64={firmaEntrega} titulo="Firma del Cliente - Entrega" />
  ) : (
    <button
      onClick={() => setShowFirmaPad(true)}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
    >
      Capturar Firma de Entrega
    </button>
  )}
</div>
```

---

## 🔒 **Validaciones Importantes**

### En Recepción (antes de avanzar):
```typescript
if (!orden.terminos_aceptados) {
  toast.error('❌ Debe aceptar los términos y condiciones');
  return false;
}

if (!orden.firma_cliente) {
  toast.error('❌ Debe capturar la firma del cliente');
  return false;
}
```

### En Entrega (antes de finalizar):
```typescript
if (!orden.firma_entrega) {
  toast.error('❌ Debe capturar la firma de entrega');
  return false;
}
```

---

## 📱 **Características del Componente FirmaPad**

- ✅ Canvas HTML5 responsive
- ✅ Soporte mouse (desktop)
- ✅ Soporte touch (móviles/tablets)
- ✅ Botón limpiar
- ✅ Botón guardar
- ✅ Conversión automática a Base64
- ✅ Carga de firma existente (para editar)
- ✅ Previene guardado de firma vacía

---

## 🎨 **Componente FirmaDisplay**

Muestra la firma guardada:

```typescript
<FirmaDisplay 
  firmaBase64={orden.firma_cliente}
  titulo="Firma del Cliente"
  className="mb-4"
/>
```

Si no hay firma, muestra un placeholder con ícono.

---

## 📊 **Tamaño de Firmas en Base64**

| Resolución Canvas | Tamaño Aprox |
|-------------------|--------------|
| 600x300 (actual)  | 10-30 KB     |
| 800x400           | 20-50 KB     |
| 1200x600          | 40-100 KB    |

**Recomendación:** Mantener 600x300 para balance entre calidad y tamaño.

---

## 🔄 **Flujo Completo**

```
RECEPCIÓN
├─ 1. Cliente llega con equipo
├─ 2. Admin muestra Términos y Condiciones
│  └─ Cliente debe scroll hasta el final
│  └─ Cliente acepta con checkbox
│  └─ Se guarda terminos_aceptados = true
├─ 3. Admin captura Firma del Cliente
│  └─ Cliente dibuja en canvas
│  └─ Se guarda como Base64 en firma_cliente
└─ 4. Ahora puede avanzar a Diagnóstico

... (otras fases)

ENTREGA
├─ 1. Equipo reparado y listo
├─ 2. Admin captura Firma de Entrega
│  └─ Cliente dibuja en canvas
│  └─ Se guarda como Base64 en firma_entrega
└─ 3. Ahora puede finalizar la orden
```

---

## ⚠️ **Consideraciones**

### Seguridad
- ✅ Las firmas están en la DB protegida por RLS
- ✅ Solo usuarios autenticados pueden acceder
- ✅ No se exponen públicamente

### Performance
- ✅ Base64 es eficiente para firmas pequeñas
- ✅ No afecta velocidad de queries
- ✅ Se puede indexar terminos_aceptados

### Legal
- ✅ Términos claros y legibles
- ✅ Fecha de aceptación registrada
- ✅ Firma digital como evidencia
- ✅ Cumple con requisitos básicos de RGPD/LOPD

---

## 🧪 **Testing**

### Probar Términos:
1. Crear una orden
2. Ir a Recepción
3. Intentar avanzar sin aceptar → ❌ Bloqueado
4. Abrir modal de términos
5. Scroll hasta el final
6. Aceptar
7. Intentar avanzar → ✅ Permitido (si tiene firma)

### Probar Firma:
1. Click en "Capturar Firma"
2. Dibujar con mouse/dedo
3. Click "Limpiar" → Canvas limpio
4. Dibujar de nuevo
5. Click "Guardar Firma"
6. Verificar que se muestra la firma
7. Recargar página → Firma persiste

---

## 📚 **Documentación Adicional**

### API de Canvas
- `canvas.toDataURL('image/png')` → Convierte a Base64
- `ctx.drawImage(img, 0, 0)` → Carga imagen existente

### Formato Base64
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

### Mostrar en HTML
```html
<img src="data:image/png;base64,..." alt="Firma" />
```

---

## ✅ **Checklist de Implementación**

- [ ] Ejecutar migración SQL en Supabase
- [ ] Verificar que campos se crearon correctamente
- [ ] Integrar FirmaPad en RecepcionForm
- [ ] Integrar TerminosCondicionesModal en RecepcionForm
- [ ] Agregar validación en handleAvanzarFase
- [ ] Integrar FirmaPad en EntregaForm
- [ ] Agregar validación antes de finalizar orden
- [ ] Probar flujo completo
- [ ] Verificar que firmas persisten
- [ ] Verificar que bloqueos funcionan

---

**Team Service Costa S.A.S.** | Centro Autorizado KÄRCHER
