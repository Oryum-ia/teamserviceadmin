# Instrucciones para Preparar la Plantilla de Word

Para que el sistema funcione correctamente con su plantilla existente (`public/documentos/Formato hidrolavadoras Hogar MTR.docx`), necesita agregar marcadores de posición (placeholders) en el documento Word.

## Pasos para Preparar la Plantilla:

1. **Abra el documento**: `public/documentos/Formato hidrolavadoras Hogar MTR.docx` en Microsoft Word

2. **Reemplace los campos con placeholders**:

### Información Principal:
- Número de Orden: `{numeroOrden}`
- Fecha: `{fecha}`
- Valor de Ingreso: `{valorIngreso}`

### Estado de Pago (usar X para marcado):
- Pagó: `{pago}`
- Debe: `{debe}`
- Garantía: `{garantia}`

### Datos del Cliente:
- Cliente: `{nombreCliente}`
- NIT o C.C.: `{nitCC}`
- Teléfono: `{telefono}`
- Dirección: `{direccion}`
- Correo: `{correo}`

### Datos del Equipo:
- Equipo: `{equipo}`
- Referencia: `{referencia}`
- Serial: `{serial}`
- Fecha compra: `{fechaCompra}`
- Voltaje: `{voltaje}`
- Fecha último mantenimiento: `{fechaUltimoMantenimiento}`
- Uso: `{uso}`

### Motivo de Ingreso y Observaciones:
- Motivo de Ingreso: `{motivoIngreso}`
- Nota de ensayo: `{notaEnsayo}`

### Estado Físico del Equipo:
Para cada componente, usar estos placeholders en las columnas correspondientes:

#### Carcasa:
- Bueno: `{carcasaBueno}`
- Regular: `{carcasaRegular}`
- Malo: `{carcasaMalo}`
- No Tiene: `{carcasaNoTiene}`
- Observaciones: `{carcasaObs}`

#### Ruedas:
- Bueno: `{ruedasBueno}`
- Regular: `{ruedasRegular}`
- Malo: `{ruedasMalo}`
- No Tiene: `{ruedasNoTiene}`
- Observaciones: `{ruedasObs}`

#### Cableado y clavija:
- Bueno: `{cableadoBueno}`
- Regular: `{cableadoRegular}`
- Malo: `{cableadoMalo}`
- No Tiene: `{cableadoNoTiene}`
- Observaciones: `{cableadoObs}`

#### Acoples:
- Bueno: `{acoplesBueno}`
- Regular: `{acoplesRegular}`
- Malo: `{acoplesMalo}`
- No Tiene: `{acoplesNoTiene}`
- Observaciones: `{acoplesObs}`

#### Manguera:
- Bueno: `{mangueraBueno}`
- Regular: `{mangueraRegular}`
- Malo: `{mangueraMalo}`
- No Tiene: `{mangueraNoTiene}`
- Observaciones: `{mangueraObs}`

#### Pistola:
- Bueno: `{pistolaBueno}`
- Regular: `{pistolaRegular}`
- Malo: `{pistolaMalo}`
- No Tiene: `{pistolaNoTiene}`
- Observaciones: `{pistolaObs}`

#### Grapa Pistola:
- Bueno: `{grapaPistolaBueno}`
- Regular: `{grapaPistolaRegular}`
- Malo: `{grapaPistolaMalo}`
- No Tiene: `{grapaPistolaNoTiene}`
- Observaciones: `{grapaPistolaObs}`

#### Grapa equipo:
- Bueno: `{grapaEquipoBueno}`
- Regular: `{grapaEquipoRegular}`
- Malo: `{grapaEquipoMalo}`
- No Tiene: `{grapaEquipoNoTiene}`
- Observaciones: `{grapaEquipoObs}`

#### Depósito detergente:
- Bueno: `{depositoDetergenteBueno}`
- Regular: `{depositoDetengenteRegular}`
- Malo: `{depositoDetergenteMalo}`
- No Tiene: `{depositoDetengenteNoTiene}`
- Observaciones: `{depositoDetengenteObs}`

#### Lanza detergente:
- Bueno: `{lanzaDetergenteBueno}`
- Regular: `{lanzaDetengenteRegular}`
- Malo: `{lanzaDetergenteMalo}`
- No Tiene: `{lanzaDetengenteNoTiene}`
- Observaciones: `{lanzaDetengenteObs}`

#### Lanza turbo:
- Bueno: `{lanzaTurboBueno}`
- Regular: `{lanzaTurboRegular}`
- Malo: `{lanzaTurboMalo}`
- No Tiene: `{lanzaTurboNoTiene}`
- Observaciones: `{lanzaTurboObs}`

#### Filtro interno:
- Bueno: `{filtroInternoBueno}`
- Regular: `{filtroInternoRegular}`
- Malo: `{filtroInternoMalo}`
- No Tiene: `{filtroInternoNoTiene}`
- Observaciones: `{filtroInternoObs}`

#### Filtro externo:
- Bueno: `{filtroExternoBueno}`
- Regular: `{filtroExternoRegular}`
- Malo: `{filtroExternoMalo}`
- No Tiene: `{filtroExternoNoTiene}`
- Observaciones: `{filtroExternoObs}`

### Firma:
- Recibido por: `{recibioPor}`

## Ejemplo de Uso:
En lugar de tener un campo vacío para "Cliente:", debe tener:
**Cliente:** `{nombreCliente}`

Para los checkboxes del estado físico, en lugar de tener casillas vacías, debe tener:
**Carcasa - Bueno:** `{carcasaBueno}` (el sistema pondrá "X" si está seleccionado, vacío si no)

## Una vez modificada la plantilla:
1. Guarde el archivo como `Formato hidrolavadoras Hogar MTR.docx` en la carpeta `public/documentos/`
2. El sistema automáticamente usará esta plantilla y llenará todos los campos con los datos del formulario
3. Mantendrá todo el formato, colores, logos y estructura original de su documento

## Notas Importantes:
- Mantenga las llaves `{}` exactamente como se muestran
- No cambie el formato o estilo del documento, solo agregue los placeholders
- Los placeholders deben estar exactamente donde quiere que aparezcan los datos
- Para campos que pueden estar vacíos, el sistema mostrará un texto vacío si no hay datos