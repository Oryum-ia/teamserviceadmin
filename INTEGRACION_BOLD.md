# Integración del Botón de Pagos Bold

## 📋 Resumen

Esta guía te explica cómo integrar el botón de pagos de Bold en tu tienda online para procesar pagos de forma segura.

## 🔑 Paso 1: Obtener las Llaves de Bold

1. Inicia sesión en tu cuenta de Bold: https://bold.co
2. Ve a: **Panel de Comercio** → **Pagos Online** → **Enlaces de Pago** → **Llaves de Integración**
3. Copia tus llaves:
   - **Llave de Identidad (API Key)**: Llave pública para identificar tu comercio
   - **Llave Secreta (Secret Key)**: Llave privada para generar el hash de integridad

## 🔧 Paso 2: Configurar las Variables de Entorno

Edita el archivo `.env` en la raíz del proyecto y reemplaza los valores:

```env
# Bold Payment Gateway Configuration
BOLD_API_KEY=tu_llave_de_identidad_real
BOLD_SECRET_KEY=tu_llave_secreta_real
```

⚠️ **IMPORTANTE**: 
- La llave secreta NUNCA debe exponerse en el frontend
- Mantén el archivo `.env` fuera del control de versiones (ya está en `.gitignore`)

## 🗄️ Paso 3: Crear la Tabla en Supabase

Ejecuta el siguiente SQL en tu base de datos Supabase:

```sql
-- Ubicación: database/create_ordenes_pago.sql
```

Puedes ejecutarlo desde:
- **Supabase Dashboard** → **SQL Editor** → Pega el contenido del archivo
- O usando el cliente de PostgreSQL

## 🎨 Paso 4: Integración en el Frontend

### Archivos Creados

1. **`src/pages/api/bold/generate-hash.ts`**
   - Genera el hash SHA-256 de integridad en el servidor
   - Mantiene segura la llave secreta

2. **`src/pages/api/bold/create-order.ts`**
   - Crea la orden de pago en la base de datos
   - Guarda todos los datos del cliente y productos

3. **`src/pages/api/bold/update-payment-status.ts`**
   - Actualiza el estado del pago después de la transacción
   - Registra el ID de transacción de Bold

### Flujo de Pago

```
1. Usuario llena el formulario de checkout
2. Sistema genera un ID único para la orden
3. Se calcula el total del carrito
4. Se genera el hash de integridad (servidor)
5. Se crea la orden en la base de datos
6. Se muestra el botón de Bold con los datos
7. Usuario hace clic y es redirigido a Bold
8. Usuario completa el pago
9. Bold redirige de vuelta con el resultado
10. Sistema actualiza el estado de la orden
```

## 🔐 Seguridad

### Hash de Integridad

El hash se genera concatenando:
```
{orderId}{amount}{currency}{secretKey}
```

Ejemplo:
```
ORD-1234567890123950000COPtu_llave_secreta
```

Luego se aplica SHA-256 para obtener el hash.

### ¿Por qué en el Servidor?

- Protege la llave secreta de ser expuesta en el navegador
- Previene que atacantes manipulen los montos
- Garantiza la integridad de cada transacción

## 📊 Estructura de la Base de Datos

### Tabla: `ordenes_pago`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | ID único de la orden |
| `order_id` | text | Identificador de la orden (único) |
| `bold_transaction_id` | text | ID de transacción de Bold |
| `cliente_nombre` | text | Nombre completo del cliente |
| `cliente_email` | text | Email del cliente |
| `cliente_telefono` | text | Teléfono del cliente |
| `direccion_completa` | text | Dirección de envío |
| `ciudad` | text | Ciudad |
| `departamento` | text | Departamento |
| `productos` | jsonb | Array de productos comprados |
| `subtotal` | numeric | Subtotal sin envío |
| `descuento` | numeric | Descuento aplicado |
| `costo_envio` | numeric | Costo de envío |
| `total` | numeric | Total a pagar |
| `metodo_pago` | text | Método de pago seleccionado |
| `estado_pago` | text | Estado: pendiente, aprobado, rechazado, cancelado, expirado |
| `created_at` | timestamp | Fecha de creación |
| `fecha_pago` | timestamp | Fecha de pago exitoso |

## 🎯 Uso del Botón de Bold

### Configuración Básica

```html
<script src="https://checkout.bold.co/library/boldPaymentButton.js"></script>

<script
  data-bold-button="light-L"
  data-api-key="TU_LLAVE_DE_IDENTIDAD"
  data-order-id="ORD-1234567890"
  data-amount="50000"
  data-currency="COP"
  data-integrity-signature="hash_generado_en_servidor"
  data-redirection-url="https://tudominio.com/confirmacion-pago"
  data-description="Compra de productos KÄRCHER"
  data-customer-data='{"email":"cliente@ejemplo.com","fullName":"Juan Pérez","phone":"3001234567"}'
  data-render-mode="embedded"
></script>
```

### Parámetros Importantes

- **`data-bold-button`**: Estilo del botón (`light-L`, `dark-M`, etc.)
- **`data-api-key`**: Tu llave de identidad de Bold
- **`data-order-id`**: ID único de la orden
- **`data-amount`**: Monto en centavos (50000 = $50,000 COP)
- **`data-currency`**: Moneda (COP o USD)
- **`data-integrity-signature`**: Hash de integridad
- **`data-redirection-url`**: URL de retorno después del pago
- **`data-render-mode="embedded"`**: Abre Bold en un modal (recomendado)

## 🔄 Manejo de Respuestas

Cuando Bold redirige de vuelta, incluye parámetros en la URL:

```
https://tudominio.com/confirmacion-pago?bold-order-id=ORD-1234567890&bold-tx-status=approved
```

### Estados Posibles

- **`approved`**: Pago aprobado ✅
- **`rejected`**: Pago rechazado ❌
- **`pending`**: Pago pendiente ⏳
- **`cancelled`**: Pago cancelado por el usuario 🚫
- **`expired`**: Enlace de pago expirado ⏰

## 📱 Consultar Órdenes

### Obtener todas las órdenes

```javascript
const { data, error } = await supabase
  .from('ordenes_pago')
  .select('*')
  .order('created_at', { ascending: false });
```

### Filtrar por estado

```javascript
const { data, error } = await supabase
  .from('ordenes_pago')
  .select('*')
  .eq('estado_pago', 'aprobado')
  .order('created_at', { ascending: false });
```

### Buscar por email

```javascript
const { data, error } = await supabase
  .from('ordenes_pago')
  .select('*')
  .eq('cliente_email', 'cliente@ejemplo.com');
```

## 🎨 Personalización del Botón

### Tamaños Disponibles

- **S**: Pequeño
- **M**: Mediano
- **L**: Grande (recomendado)

### Colores Disponibles

- **light**: Botón claro
- **dark**: Botón con colores de Bold (recomendado)

### Ejemplos

```html
<!-- Botón grande oscuro -->
<script data-bold-button="dark-L" ...></script>

<!-- Botón mediano claro -->
<script data-bold-button="light-M" ...></script>

<!-- Botón pequeño oscuro -->
<script data-bold-button="dark-S" ...></script>
```

## 🚀 Modo Embedded vs Redirect

### Embedded (Recomendado)

```html
<script data-render-mode="embedded" ...></script>
```

- Abre Bold en un modal dentro de tu sitio
- Mejor experiencia de usuario
- No sale de tu dominio

### Redirect (Por defecto)

```html
<script ...></script>
```

- Redirige a la página de Bold
- Usuario sale de tu sitio temporalmente

## 💰 Límites y Restricciones

Cada comercio tiene límites configurados por Bold:

1. Ve a: https://comercios.bold.co/panel/online-payments/payment-links/maximum-amounts
2. Revisa tus límites por método de pago
3. Solicita aumentos si es necesario

### Montos Mínimos

- **Mínimo**: $1,000 COP
- **Máximo**: Según tu configuración de comercio

## 🧪 Pruebas

### Modo Sandbox

Bold proporciona un ambiente de pruebas. Contacta a soporte para obtener:
- Llaves de prueba
- Tarjetas de prueba
- Documentación de testing

### Tarjetas de Prueba

Consulta la documentación de Bold para tarjetas de prueba válidas.

## 📞 Soporte

- **Documentación Bold**: https://bold.co/docs
- **Soporte Bold**: soporte@bold.co
- **Panel de Comercio**: https://comercios.bold.co

## ✅ Checklist de Implementación

- [ ] Obtener llaves de Bold
- [ ] Configurar variables de entorno
- [ ] Ejecutar SQL para crear tabla
- [ ] Verificar endpoints API funcionando
- [ ] Probar flujo completo de pago
- [ ] Configurar URL de redirección
- [ ] Implementar página de confirmación
- [ ] Probar con diferentes métodos de pago
- [ ] Verificar actualización de estados
- [ ] Implementar panel de administración

## 🎯 Próximos Pasos

1. **Panel de Administración**: Crear vista para ver todas las órdenes
2. **Notificaciones**: Enviar emails de confirmación
3. **Webhooks**: Implementar webhooks de Bold para actualizaciones en tiempo real
4. **Reportes**: Crear reportes de ventas y estadísticas
5. **Integración con Inventario**: Actualizar stock automáticamente

## 🔗 Enlaces Útiles

- [Documentación Bold - Botón de Pagos](https://bold.co/docs/boton-de-pagos)
- [Panel de Comercio Bold](https://comercios.bold.co)
- [Supabase Dashboard](https://tscotizacion.tscosta.com.co/)
