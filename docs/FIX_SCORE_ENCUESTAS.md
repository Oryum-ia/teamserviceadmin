# Fix: Score de Encuestas Mostrando Valores Incorrectos

## Problema
En la sección de encuestas, los scores se mostraban de forma confusa:
- **Calificaciones**: 4/5 (correcto)
- **Atención**: 4/5 (correcto)
- **Calidad**: 4/5 (correcto)
- **Tiempo**: 4/5 (correcto)
- **Productos**: 4/5 (correcto)
- **Satisfacción General**: 4/5 (correcto)
- **NPS**: 2/10 (correcto, pero visualmente confuso)
- **Promedio**: Mostraba solo estrellas completas sin decimales

## Causa Raíz
El problema estaba en la función `renderEstrellas`:

1. **Falta de decimales en promedio**: El promedio se calculaba correctamente (ej: 4.2), pero se mostraba solo como "4/5" sin los decimales
2. **Redondeo visual inconsistente**: Las estrellas se llenaban basándose en el valor exacto, pero el texto no mostraba decimales
3. **Confusión entre escalas**: NPS usa escala 0-10, mientras que las demás calificaciones usan 1-5

## Solución Implementada

### 1. Mejorar la función `renderEstrellas`
Se agregó un parámetro opcional `mostrarDecimales` para controlar cuándo mostrar decimales:

```typescript
const renderEstrellas = (valor: number, mostrarDecimales: boolean = false) => {
  const valorRedondeado = Math.round(valor);
  const valorMostrar = mostrarDecimales ? valor.toFixed(1) : valor;
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= valorRedondeado 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className={`ml-2 text-sm font-medium ${
        theme === 'light' ? 'text-gray-700' : 'text-gray-300'
      }`}>
        {valorMostrar}/5
      </span>
    </div>
  );
};
```

### 2. Actualizar la columna de promedio
Se modificó para mostrar decimales:

```typescript
{
  key: 'promedio',
  label: 'Promedio',
  render: (encuesta) => renderEstrellas(Number(calcularPromedioGeneral(encuesta)), true),
},
```

## Resultado

Ahora los scores se muestran correctamente:

### En la tabla:
- **Promedio**: 4.2/5 ⭐⭐⭐⭐☆ (con decimal)
- **NPS**: 8/10 (con badge de color según el valor)

### En el modal de detalle:
- **Atención**: 4/5 ⭐⭐⭐⭐☆
- **Calidad**: 4/5 ⭐⭐⭐⭐☆
- **Tiempo**: 4/5 ⭐⭐⭐⭐☆
- **Productos**: 4/5 ⭐⭐⭐⭐☆
- **Satisfacción General**: 4/5 ⭐⭐⭐⭐☆
- **NPS**: 8/10 (en texto grande con color según el valor)

## Explicación de las Escalas

### Calificaciones por Estrellas (1-5)
- ⭐ = 1 (Muy malo)
- ⭐⭐ = 2 (Malo)
- ⭐⭐⭐ = 3 (Regular)
- ⭐⭐⭐⭐ = 4 (Bueno)
- ⭐⭐⭐⭐⭐ = 5 (Excelente)

### NPS - Net Promoter Score (0-10)
- **0-6**: Detractores (rojo) - Clientes insatisfechos
- **7-8**: Pasivos (amarillo) - Clientes satisfechos pero no entusiastas
- **9-10**: Promotores (verde) - Clientes muy satisfechos que recomendarían

El NPS se calcula: `% Promotores - % Detractores`

### Promedio General
Se calcula como el promedio de las 5 calificaciones:
```
(Atención + Calidad + Tiempo + Productos + Satisfacción) / 5
```

## Archivos Modificados

- `src/components/paneladmin/Encuestas.tsx` - Mejorada función `renderEstrellas` y visualización de promedio

## Notas Adicionales

- El NPS mantiene su escala 0-10 como es estándar en la industria
- Las calificaciones individuales mantienen su escala 1-5 (estrellas)
- El promedio ahora muestra decimales para mayor precisión
- Los colores de los badges del NPS ayudan a identificar rápidamente el nivel de satisfacción

## Prevención de Problemas Futuros

1. **Documentar escalas**: Siempre documentar qué escala usa cada métrica
2. **Consistencia visual**: Usar el mismo formato para métricas similares
3. **Mostrar decimales**: Para promedios, siempre mostrar al menos un decimal
4. **Colores significativos**: Usar colores que reflejen el nivel de satisfacción
