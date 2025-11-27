# Guía de Manejo de Fechas - Zona Horaria Colombia

## 📍 Problema Resuelto
Todas las fechas del sistema ahora se **guardan en UTC** y se **muestran en zona horaria de Colombia (America/Bogota)** para garantizar consistencia.

### ⚠️ Principio Fundamental
- **Guardar**: Siempre en UTC usando `new Date().toISOString()` o `crearTimestampColombia()`
- **Mostrar**: Siempre formatear con zona horaria Colombia usando las funciones de formateo

## 🛠️ Utilidades Disponibles

### Archivo: `src/lib/utils/dateUtils.ts`

### Funciones Principales

#### 1. **Obtener Fecha Actual**

```typescript
import { obtenerFechaActualColombia, obtenerFechaActualColombiaISO } from '@/lib/utils/dateUtils';

// Obtener Date object en zona horaria Colombia
const ahora = obtenerFechaActualColombia();

// Obtener string ISO para guardar en base de datos
const ahoraISO = obtenerFechaActualColombiaISO();
```

#### 2. **Crear Timestamps para Supabase**

```typescript
import { crearTimestampColombia } from '@/lib/utils/dateUtils';

// Para campos created_at, updated_at, fecha_recepcion, etc.
const timestamp = crearTimestampColombia();

// Ejemplo en insert
await supabase.from('ordenes').insert({
  ...data,
  fecha_recepcion: crearTimestampColombia(),
  created_at: crearTimestampColombia(),
});
```

#### 3. **Formatear Fechas para Mostrar**

```typescript
import { 
  formatearFechaColombia,
  formatearFechaColombiaCorta,
  formatearFechaColombiaLarga 
} from '@/lib/utils/dateUtils';

// Formato personalizado
const fecha1 = formatearFechaColombia(orden.fecha_recepcion, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
// Resultado: "21 nov 2025, 15:30"

// Formato corto
const fecha2 = formatearFechaColombiaCorta(orden.fecha_recepcion);
// Resultado: "21/11/2025, 3:30 PM"

// Formato largo
const fecha3 = formatearFechaColombiaLarga(orden.fecha_recepcion);
// Resultado: "21 de noviembre de 2025, 3:30 PM"
```

#### 4. **Convertir Fechas Existentes**

```typescript
import { convertirAZonaHorariaColombia } from '@/lib/utils/dateUtils';

// Convertir una fecha UTC a Colombia
const fechaUTC = new Date('2025-11-21T20:30:00Z');
const fechaColombia = convertirAZonaHorariaColombia(fechaUTC);
```

#### 5. **Obtener Fecha/Hora Específica**

```typescript
import { 
  obtenerFechaColombiaYYYYMMDD,
  obtenerHoraColombiaHHMMSS 
} from '@/lib/utils/dateUtils';

// Solo fecha: "2025-11-21"
const fecha = obtenerFechaColombiaYYYYMMDD();

// Solo hora: "15:30:45"
const hora = obtenerHoraColombiaHHMMSS();
```

#### 6. **Utilidades de Comparación**

```typescript
import { 
  esFechaPasada,
  esFechaFutura,
  calcularDiferenciaDias 
} from '@/lib/utils/dateUtils';

// Verificar si una fecha ya pasó
if (esFechaPasada(orden.fecha_limite)) {
  console.log('La fecha límite ya pasó');
}

// Verificar si una fecha es futura
if (esFechaFutura(orden.fecha_entrega)) {
  console.log('La entrega es en el futuro');
}

// Calcular días entre fechas
const dias = calcularDiferenciaDias(orden.fecha_inicio, orden.fecha_fin);
console.log(`Diferencia: ${dias} días`);
```

## 🔄 Migración de Código Existente

### ❌ Antes (Incorrecto)

```typescript
// Usar new Date() directamente
const fecha = new Date();

// Usar Date.now()
const timestamp = Date.now();

// Formatear sin zona horaria
const formatted = new Date().toLocaleString('es-CO');
```

### ✅ Ahora (Correcto)

```typescript
import { 
  obtenerFechaActualColombia,
  crearTimestampColombia,
  formatearFechaColombiaLarga 
} from '@/lib/utils/dateUtils';

// Obtener fecha actual en Colombia
const fecha = obtenerFechaActualColombia();

// Crear timestamp para BD
const timestamp = crearTimestampColombia();

// Formatear con zona horaria Colombia
const formatted = formatearFechaColombiaLarga(fecha);
```

## 📋 Casos de Uso Comunes

### 1. Registrar Recepción de Orden

```typescript
import { crearTimestampColombia } from '@/lib/utils/dateUtils';

const { error } = await supabase
  .from('ordenes')
  .insert({
    ...ordenData,
    fecha_recepcion: crearTimestampColombia(),
    created_at: crearTimestampColombia(),
  });
```

### 2. Actualizar Estado con Timestamp

```typescript
import { crearTimestampColombia } from '@/lib/utils/dateUtils';

const { error } = await supabase
  .from('ordenes')
  .update({
    estado_actual: 'Diagnóstico',
    fecha_diagnostico: crearTimestampColombia(),
    updated_at: crearTimestampColombia(),
  })
  .eq('id', ordenId);
```

### 3. Mostrar Fechas en UI

```typescript
import { formatearFechaColombiaLarga } from '@/lib/utils/dateUtils';

// En un componente React
<p>
  Fecha de recepción: {formatearFechaColombiaLarga(orden.fecha_recepcion)}
</p>
```

### 4. Calcular Tiempo de Servicio

```typescript
import { 
  calcularDiferenciaDias,
  obtenerFechaActualColombia 
} from '@/lib/utils/dateUtils';

const diasEnServicio = calcularDiferenciaDias(
  orden.fecha_recepcion,
  obtenerFechaActualColombia()
);

console.log(`Orden en servicio por ${diasEnServicio} días`);
```

### 5. Validar Fechas Límite

```typescript
import { esFechaPasada } from '@/lib/utils/dateUtils';

if (orden.fecha_limite && esFechaPasada(orden.fecha_limite)) {
  toast.warning('⚠️ Esta orden ha superado su fecha límite');
}
```

## 🎯 Archivos que Deben Actualizarse

### Alta Prioridad (Registran fechas)
- ✅ `src/components/paneladmin/ordenes/RecepcionForm.tsx`
- ✅ `src/components/paneladmin/ordenes/DiagnosticoForm.tsx`
- ✅ `src/components/paneladmin/ordenes/CotizacionForm.tsx`
- ✅ `src/components/paneladmin/ordenes/ReparacionForm.tsx`
- ✅ `src/components/paneladmin/ordenes/EntregaForm.tsx`
- ✅ `src/lib/services/ordenService.ts`
- ✅ `src/lib/services/usuarioService.ts`

### Media Prioridad (Muestran fechas)
- ⏳ Todos los componentes que formatean fechas para mostrar
- ⏳ Componentes de reportes y estadísticas

## 🔍 Búsqueda de Código a Actualizar

Busca y reemplaza estos patrones:

```bash
# Buscar usos de new Date()
grep -r "new Date()" src/

# Buscar usos de Date.now()
grep -r "Date.now()" src/

# Buscar formateos de fecha
grep -r "toLocaleString" src/
grep -r "toLocaleDateString" src/
```

## ⚠️ Importante

1. **Siempre usar las utilidades** para cualquier operación con fechas
2. **No usar `new Date()` directamente** - usar `obtenerFechaActualColombia()`
3. **No usar `Date.now()`** - usar `crearTimestampColombia()`
4. **Formatear siempre con las funciones** que incluyen zona horaria

## 📚 Referencia Rápida

| Necesitas | Función |
|-----------|---------|
| Fecha actual | `obtenerFechaActualColombia()` |
| Timestamp para BD | `crearTimestampColombia()` |
| Mostrar fecha larga | `formatearFechaColombiaLarga(fecha)` |
| Mostrar fecha corta | `formatearFechaColombiaCorta(fecha)` |
| Convertir fecha | `convertirAZonaHorariaColombia(fecha)` |
| Solo fecha YYYY-MM-DD | `obtenerFechaColombiaYYYYMMDD()` |
| Solo hora HH:mm:ss | `obtenerHoraColombiaHHMMSS()` |
| Verificar si pasó | `esFechaPasada(fecha)` |
| Calcular diferencia | `calcularDiferenciaDias(fecha1, fecha2)` |

## 🧪 Testing

```typescript
import { obtenerFechaActualColombia, COLOMBIA_TIMEZONE } from '@/lib/utils/dateUtils';

// Verificar zona horaria
const fecha = obtenerFechaActualColombia();
console.log('Zona horaria:', COLOMBIA_TIMEZONE); // "America/Bogota"
console.log('Fecha Colombia:', fecha.toLocaleString('es-CO', { timeZone: COLOMBIA_TIMEZONE }));
```
