# Gestión de Pagos Bold en Panel de Administración

## 📋 Descripción

Nueva sección en el panel de administración para gestionar y visualizar todas las órdenes de pago realizadas a través de Bold en la tienda online.

## 🎯 Características

### 1. Visualización de Órdenes
- Lista completa de todas las órdenes de pago
- Información detallada de cada orden
- Estados de pago en tiempo real
- Búsqueda y filtros avanzados

### 2. Filtros Disponibles
- **Por Estado**: Pendiente, Aprobado, Rechazado, Cancelado, Expirado
- **Por Método de Pago**: PSE, Tarjeta de Crédito, Efecty, WhatsApp
- **Búsqueda**: Por ID de orden, nombre, email o teléfono del cliente

### 3. Información Mostrada

#### En la Lista
- ID de la orden
- Transaction ID de Bold
- Datos del cliente (nombre, email, teléfono)
- Cantidad de productos
- Total de la orden
- Método de pago
- Estado del pago
- Fecha de creación

#### En el Detalle
- **Cliente**: Nombre completo, email, teléfono, documento
- **Dirección**: Dirección completa, ciudad, departamento, código postal
- **Productos**: Lista detallada con imágenes, cantidades y precios
- **Pago**: Método, estado, Transaction ID
- **Fechas**: Creación y pago
- **Resumen**: Subtotal, descuento, envío, total
- **Notas**: Notas del pedido si existen

### 4. Acciones Disponibles
- Ver detalles completos de la orden
- Eliminar orden (con confirmación)
- Exportar órdenes a CSV

### 5. Estadísticas
- Total de ventas aprobadas
- Cantidad de órdenes aprobadas
- Resumen visual en tarjeta destacada

## 🗄️ Base de Datos

### Tabla: `ordenes_pago`

```sql
CREATE TABLE ordenes_pago (
  id UUID PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  bold_transaction_id TEXT,
  
  -- Cliente
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  cliente_documento TEXT,
  cliente_tipo_documento TEXT,
  
  -- Dirección
  direccion_completa TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  departamento TEXT NOT NULL,
  codigo_postal TEXT,
  
  -- Productos
  productos JSONB NOT NULL,
  
  -- Valores
  subtotal NUMERIC(12, 2) NOT NULL,
  descuento NUMERIC(12, 2) NOT NULL,
  codigo_cupon TEXT,
  costo_envio NUMERIC(12, 2) NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  
  -- Pago
  metodo_pago TEXT NOT NULL,
  estado_pago TEXT NOT NULL,
  
  -- Notas
  notas_pedido TEXT,
  hash_integridad TEXT,
  
  -- Fechas
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ,
  fecha_pago TIMESTAMPTZ
);
```

## 📁 Archivos Creados

### 1. Tipos TypeScript
**`src/types/bold.types.ts`**
- Definición de tipos para órdenes de pago
- Tipos para estados y métodos de pago
- Tipos para estadísticas

### 2. Servicios
**`src/lib/services/ordenPagoService.ts`**
- `obtenerTodasLasOrdenes()`: Obtiene todas las órdenes
- `obtenerOrdenPorId()`: Obtiene una orden por ID
- `obtenerOrdenPorOrderId()`: Obtiene una orden por order_id
- `filtrarOrdenesPorEstado()`: Filtra por estado de pago
- `filtrarOrdenesPorEmail()`: Filtra por email del cliente
- `filtrarOrdenesPorFechas()`: Filtra por rango de fechas
- `actualizarEstadoPago()`: Actualiza el estado de una orden
- `eliminarOrdenPago()`: Elimina una orden
- `obtenerEstadisticasPagos()`: Obtiene estadísticas completas
- `buscarOrdenes()`: Búsqueda general

### 3. Componentes
**`src/components/paneladmin/Pagos.tsx`**
- Componente principal de la sección de pagos
- Lista de órdenes con tabla responsive
- Filtros y búsqueda
- Paginación
- Exportación a CSV

**`src/components/paneladmin/OrdenPagoModal.tsx`**
- Modal para ver detalles completos de una orden
- Diseño organizado por secciones
- Información completa del cliente, productos y pago

### 4. Migraciones
**`migrations/20260129_create_ordenes_pago.sql`**
- Creación de tabla `ordenes_pago`
- Índices para optimización
- Triggers para actualización automática
- Políticas RLS para seguridad

## 🚀 Cómo Usar

### Acceder a la Sección
1. Inicia sesión en el panel de administración
2. En el sidebar, haz clic en **"Pagos Bold"**
3. Se mostrará la lista de todas las órdenes

### Buscar Órdenes
1. Usa la barra de búsqueda para buscar por:
   - ID de orden
   - Nombre del cliente
   - Email del cliente
   - Teléfono del cliente

### Filtrar Órdenes
1. Haz clic en el botón **"Filtros"**
2. Selecciona:
   - **Estado de Pago**: Filtra por estado
   - **Método de Pago**: Filtra por método
3. Haz clic en **"Limpiar filtros"** para resetear

### Ver Detalles
1. Haz clic en cualquier fila de la tabla
2. O haz clic en el ícono del ojo (👁️)
3. Se abrirá un modal con todos los detalles

### Exportar a CSV
1. Aplica los filtros deseados (opcional)
2. Haz clic en **"Exportar CSV"**
3. Se descargará un archivo con las órdenes filtradas

### Eliminar Orden
1. Haz clic en el ícono de la papelera (🗑️)
2. Confirma la eliminación
3. La orden se eliminará permanentemente

## 📊 Estadísticas Disponibles

### En la Tarjeta de Resumen
- **Total Ventas Aprobadas**: Suma de todas las órdenes aprobadas
- **Órdenes Aprobadas**: Cantidad de órdenes con estado "aprobado"

### En el Servicio (para futuras implementaciones)
- Total de órdenes por estado
- Ventas por día (últimos 30 días)
- Ventas por método de pago
- Productos más vendidos
- Promedio de venta

## 🔒 Seguridad

### Políticas RLS
- Solo usuarios autenticados pueden leer órdenes
- Solo el service_role puede insertar, actualizar y eliminar
- Protección contra acceso no autorizado

### Validaciones
- Estados de pago validados a nivel de base de datos
- Métodos de pago validados a nivel de base de datos
- Campos requeridos validados

## 📱 Responsive Design

La sección está completamente optimizada para:
- **Desktop**: Vista completa con todas las columnas
- **Tablet**: Columnas adaptadas
- **Mobile**: Vista de tarjetas con información esencial

## 🎨 Temas

Soporta tanto tema claro como oscuro:
- Colores adaptados automáticamente
- Contraste optimizado
- Iconos y badges con colores apropiados

## 🔄 Integración con Bold

Esta sección muestra las órdenes creadas por:
1. **API de Bold**: `/api/bold/create-order`
2. **Actualización de Estado**: `/api/bold/update-payment-status`

Las órdenes se crean automáticamente cuando:
- Un cliente completa el formulario de compra
- Se genera el hash de integridad
- Se procesa el pago con Bold

## 📈 Próximas Mejoras

### Funcionalidades Planeadas
1. **Dashboard de Estadísticas**: Gráficos y métricas detalladas
2. **Notificaciones**: Alertas de nuevas órdenes
3. **Webhooks**: Actualización automática desde Bold
4. **Reportes**: Generación de reportes personalizados
5. **Filtros Avanzados**: Por rango de fechas, montos, etc.
6. **Acciones en Lote**: Actualizar múltiples órdenes
7. **Integración con Inventario**: Actualizar stock automáticamente
8. **Emails Automáticos**: Confirmaciones y notificaciones

## 🐛 Solución de Problemas

### No se muestran órdenes
1. Verifica que la tabla `ordenes_pago` exista
2. Ejecuta la migración: `migrations/20260129_create_ordenes_pago.sql`
3. Verifica las políticas RLS en Supabase

### Error al cargar órdenes
1. Verifica la conexión a Supabase
2. Revisa los logs del navegador (F12)
3. Verifica que el usuario tenga permisos

### No se puede exportar CSV
1. Verifica que haya órdenes para exportar
2. Revisa los permisos del navegador para descargas
3. Intenta con menos órdenes si hay muchas

## 📞 Soporte

Para problemas o preguntas:
1. Revisa esta documentación
2. Consulta los logs del navegador
3. Revisa la documentación de Bold: [INTEGRACION_BOLD.md](./INTEGRACION_BOLD.md)
4. Contacta al equipo de desarrollo

## ✅ Checklist de Implementación

- [x] Crear tipos TypeScript
- [x] Crear servicio de órdenes de pago
- [x] Crear componente principal de Pagos
- [x] Crear modal de detalles
- [x] Agregar opción al sidebar
- [x] Integrar en el panel de administración
- [x] Crear migración SQL
- [x] Documentar funcionalidad
- [ ] Ejecutar migración en Supabase
- [ ] Probar funcionalidad completa
- [ ] Implementar webhooks de Bold
- [ ] Agregar dashboard de estadísticas

## 🎉 Conclusión

La sección de Pagos Bold está lista para gestionar todas las órdenes de la tienda online. Proporciona una interfaz completa, intuitiva y responsive para administrar pagos, con filtros avanzados, búsqueda y exportación de datos.
