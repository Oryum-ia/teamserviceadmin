# Fix: Zona Horaria de Colombia en Órdenes

## Problema
Las fechas de las órdenes no se están guardando ni mostrando correctamente en la zona horaria de Bogotá, Colombia (UTC-5). Cuando se cambia de fase entre órdenes, las fechas se guardan en UTC sin considerar la hora local.

## Causa Raíz
1. Múltiples archivos usan `new Date().toISOString()` directamente en lugar de `crearTimestampColombia()`
2. La función `crearTimestampColombia()` actualmente solo retorna `new Date().toISOString()` (UTC)
3. No hay conversión consistente de UTC a hora de Colombia al mostrar fechas

## Solución

### 1. Archivos que necesitan corrección

#### Servicios que usan `new Date().toISOString()`:
- `src/lib/services/repuestoService.ts` (3 ocurrencias)
- `src/lib/services/notificacionService.ts` (2 ocurrencias)
- `src/lib/services/cuponService.ts` (1 ocurrencia)
- `src/lib/services/comentarioService.ts` (2 ocurrencias)
- `src/lib/services/clienteService.ts` (1 ocurrencia)

#### Componentes que usan `new Date().toISOString()`:
- `src/components/paneladmin/ordenes/DiagnosticoForm.tsx` (línea 214)
- `src/components/paneladmin/ordenes/CotizacionForm.tsx` (línea 456)
- `src/components/paneladmin/ordenes/ReparacionForm.tsx` (línea 103)
- `src/components/paneladmin/ordenes/RecepcionForm.tsx` (línea 194)
- `src/app/api/ordenes/[id]/fotos/route.ts` (línea 38)

### 2. Estrategia de Implementación

**IMPORTANTE**: Las fechas DEBEN guardarse en UTC en la base de datos (esto es correcto).
La conversión a hora de Colombia debe hacerse:
- Al MOSTRAR fechas al usuario
- Al calcular diferencias de tiempo
- Al comparar fechas

**NO cambiar** `crearTimestampColombia()` - ya funciona correctamente guardando en UTC.

### 3. Cambios Necesarios

#### A. Reemplazar `new Date().toISOString()` por `crearTimestampColombia()`
Esto asegura consistencia en el código, aunque ambos retornan lo mismo (UTC).

#### B. Usar funciones de formateo de `dateUtils.ts` para mostrar fechas
- `formatearFechaColombiaLarga()` - para fechas completas
- `formatearFechaColombiaCorta()` - para fechas cortas
- `formatearFechaColombia()` - personalizable

#### C. Verificar que las fechas automáticas se guarden correctamente
Al cambiar de fase, asegurar que se use `crearTimestampColombia()`:
- `fecha_inicio_diagnostico`
- `fecha_fin_diagnostico`
- `fecha_inicio_reparacion`
- `fecha_fin_reparacion`
- `fecha_cotizacion`
- `ultima_actualizacion`

## Archivos Modificados

1. ✅ `src/lib/services/repuestoService.ts` - 3 ocurrencias corregidas + import agregado
2. ✅ `src/lib/services/notificacionService.ts` - 2 ocurrencias corregidas + imports dinámicos
3. ✅ `src/lib/services/cuponService.ts` - 1 ocurrencia corregida + import agregado
4. ✅ `src/lib/services/comentarioService.ts` - 2 ocurrencias corregidas + import agregado
5. ✅ `src/lib/services/clienteService.ts` - 1 ocurrencia corregida + import agregado
6. ✅ `src/components/paneladmin/ordenes/DiagnosticoForm.tsx` - 2 ocurrencias corregidas + import actualizado
7. ✅ `src/components/paneladmin/ordenes/CotizacionForm.tsx` - 2 ocurrencias corregidas (ya tenía el import)
8. ✅ `src/components/paneladmin/ordenes/ReparacionForm.tsx` - 2 ocurrencias corregidas + import actualizado
9. ✅ `src/app/api/ordenes/[id]/fotos/route.ts` - 1 ocurrencia corregida + import agregado

## Cambios Realizados

### Servicios Backend
- Todos los servicios ahora usan `crearTimestampColombia()` en lugar de `new Date().toISOString()`
- Se agregaron los imports necesarios de `@/lib/utils/dateUtils`
- Esto asegura consistencia en todo el código

### Componentes Frontend
- Los formularios de Diagnóstico, Cotización y Reparación ahora usan `crearTimestampColombia()`
- Se actualizaron los imports para incluir la función
- El guardado automático con debounce ahora usa la función correcta

### API Routes
- La ruta de actualización de fotos ahora usa `crearTimestampColombia()`

## Nota Importante

**Las fechas se guardan correctamente en UTC** (esto es lo correcto para bases de datos).
La función `crearTimestampColombia()` retorna `new Date().toISOString()` que es UTC.

**La conversión a hora de Colombia se hace al MOSTRAR las fechas**, usando:
- `formatearFechaColombiaLarga()` - ya implementado en los formularios
- `formatearFechaColombiaCorta()` - disponible para uso
- `formatearFechaColombia()` - personalizable

Esto es la práctica correcta: **guardar en UTC, mostrar en zona horaria local**.

## Verificación

Después de aplicar los cambios:
1. Crear una nueva orden y verificar `fecha_creacion`
2. Avanzar a Diagnóstico y verificar `fecha_inicio_diagnostico`
3. Avanzar a Cotización y verificar `fecha_cotizacion`
4. Verificar que las fechas se muestren en hora de Colombia
5. Verificar que al guardar cambios, `ultima_actualizacion` use hora de Colombia

## Fecha de Implementación
29 de enero de 2026
