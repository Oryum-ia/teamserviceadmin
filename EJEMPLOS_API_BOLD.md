# Ejemplos de Uso de la API de Bold

## 📋 Endpoints Disponibles

### 1. Generar Hash de Integridad
**POST** `/api/bold/generate-hash`

### 2. Crear Orden de Pago
**POST** `/api/bold/create-order`

### 3. Actualizar Estado de Pago
**POST** `/api/bold/update-payment-status`

### 4. Listar Órdenes
**GET** `/api/bold/list-orders`

### 5. Obtener Estadísticas
**POST** `/api/bold/list-orders` (action: stats)

---

## 🔐 1. Generar Hash de Integridad

### Request

```javascript
const response = await fetch('/api/bold/generate-hash', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'ORD-1234567890',
    amount: 50000,
    currency: 'COP'
  })
});

const data = await response.json();
```

### Response (Success)

```json
{
  "success": true,
  "hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
}
```

### Response (Error)

```json
{
  "success": false,
  "error": "Faltan parámetros requeridos: orderId, amount, currency"
}
```

---

## 📦 2. Crear Orden de Pago

### Request

```javascript
const orderData = {
  orderId: 'ORD-1234567890',
  clienteNombre: 'Juan Pérez',
  clienteEmail: 'juan@ejemplo.com',
  clienteTelefono: '3001234567',
  clienteDocumento: '1234567890',
  clienteTipoDocumento: 'CC',
  direccionCompleta: 'Calle 40 # 2-55, Barrio Nariño',
  ciudad: 'Cartagena',
  departamento: 'Bolívar',
  codigoPostal: '130001',
  productos: [
    {
      id: 'prod-1',
      name: 'Hidrolavadora K2',
      model: 'KÄRCHER K2 Basic',
      price: 549900,
      quantity: 1,
      image: '/images/products/k2.jpg'
    },
    {
      id: 'prod-2',
      name: 'Aspiradora WD3',
      model: 'KÄRCHER WD3 Premium',
      price: 389900,
      quantity: 2,
      image: '/images/products/wd3.jpg'
    }
  ],
  subtotal: 1329700,
  descuento: 132970, // 10% de descuento
  codigoCupon: 'DESCUENTO10',
  costoEnvio: 30000,
  total: 1226730,
  metodoPago: 'pse',
  notasPedido: 'Entregar en horario de oficina',
  hashIntegridad: 'a1b2c3d4e5f6...'
};

const response = await fetch('/api/bold/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
});

const data = await response.json();
```

### Response (Success)

```json
{
  "success": true,
  "order": {
    "id": "uuid-de-la-orden",
    "order_id": "ORD-1234567890",
    "cliente_nombre": "Juan Pérez",
    "cliente_email": "juan@ejemplo.com",
    "total": 1226730,
    "estado_pago": "pendiente",
    "created_at": "2024-01-15T10:30:00.000Z",
    ...
  }
}
```

### Response (Error)

```json
{
  "success": false,
  "error": "Faltan campos requeridos: orderId, clienteNombre, clienteEmail",
  "details": "..."
}
```

---

## 💳 3. Actualizar Estado de Pago

### Request

```javascript
const response = await fetch('/api/bold/update-payment-status', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'ORD-1234567890',
    status: 'approved', // approved, rejected, pending, cancelled, expired
    transactionId: 'BOLD-TX-987654321' // Opcional
  })
});

const data = await response.json();
```

### Response (Success)

```json
{
  "success": true,
  "order": {
    "id": "uuid-de-la-orden",
    "order_id": "ORD-1234567890",
    "estado_pago": "aprobado",
    "bold_transaction_id": "BOLD-TX-987654321",
    "fecha_pago": "2024-01-15T10:35:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z",
    ...
  }
}
```

---

## 📋 4. Listar Órdenes

### Request - Todas las órdenes

```javascript
const response = await fetch('/api/bold/list-orders?limit=50&offset=0');
const data = await response.json();
```

### Request - Filtrar por estado

```javascript
const response = await fetch('/api/bold/list-orders?status=aprobado&limit=20');
const data = await response.json();
```

### Request - Buscar por email

```javascript
const response = await fetch('/api/bold/list-orders?email=juan@ejemplo.com');
const data = await response.json();
```

### Request - Buscar orden específica

```javascript
const response = await fetch('/api/bold/list-orders?orderId=ORD-1234567890');
const data = await response.json();
```

### Response

```json
{
  "success": true,
  "orders": [
    {
      "id": "uuid-1",
      "order_id": "ORD-1234567890",
      "cliente_nombre": "Juan Pérez",
      "cliente_email": "juan@ejemplo.com",
      "cliente_telefono": "3001234567",
      "direccion_completa": "Calle 40 # 2-55",
      "ciudad": "Cartagena",
      "departamento": "Bolívar",
      "productos": [...],
      "subtotal": 1329700,
      "descuento": 132970,
      "costo_envio": 30000,
      "total": 1226730,
      "metodo_pago": "pse",
      "estado_pago": "aprobado",
      "bold_transaction_id": "BOLD-TX-987654321",
      "created_at": "2024-01-15T10:30:00.000Z",
      "fecha_pago": "2024-01-15T10:35:00.000Z"
    },
    ...
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 📊 5. Obtener Estadísticas

### Request

```javascript
const response = await fetch('/api/bold/list-orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'stats'
  })
});

const data = await response.json();
```

### Response

```json
{
  "success": true,
  "stats": {
    "total_ordenes": 150,
    "ordenes_aprobadas": 120,
    "ordenes_pendientes": 15,
    "ordenes_rechazadas": 10,
    "total_ventas": 45000000,
    "promedio_venta": 375000
  },
  "ventasPorDia": {
    "2024-01-15": 1500000,
    "2024-01-14": 2300000,
    "2024-01-13": 1800000,
    ...
  }
}
```

---

## 🎨 Ejemplos de Uso en Frontend

### Ejemplo 1: Mostrar Órdenes en Panel de Admin

```javascript
async function loadOrders(status = null, page = 1) {
  const limit = 20;
  const offset = (page - 1) * limit;
  
  let url = `/api/bold/list-orders?limit=${limit}&offset=${offset}`;
  if (status) {
    url += `&status=${status}`;
  }
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      displayOrders(data.orders);
      updatePagination(data.pagination);
    }
  } catch (error) {
    console.error('Error cargando órdenes:', error);
  }
}

function displayOrders(orders) {
  const container = document.getElementById('orders-container');
  
  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">${order.order_id}</span>
        <span class="order-status ${order.estado_pago}">${order.estado_pago}</span>
      </div>
      <div class="order-body">
        <p><strong>Cliente:</strong> ${order.cliente_nombre}</p>
        <p><strong>Email:</strong> ${order.cliente_email}</p>
        <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
        <p><strong>Fecha:</strong> ${formatDate(order.created_at)}</p>
      </div>
      <div class="order-actions">
        <button onclick="viewOrderDetails('${order.order_id}')">Ver Detalles</button>
      </div>
    </div>
  `).join('');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
```

### Ejemplo 2: Dashboard con Estadísticas

```javascript
async function loadDashboard() {
  try {
    const response = await fetch('/api/bold/list-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'stats' })
    });
    
    const data = await response.json();
    
    if (data.success) {
      updateStats(data.stats);
      renderSalesChart(data.ventasPorDia);
    }
  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

function updateStats(stats) {
  document.getElementById('total-ordenes').textContent = stats.total_ordenes;
  document.getElementById('ordenes-aprobadas').textContent = stats.ordenes_aprobadas;
  document.getElementById('total-ventas').textContent = formatCurrency(stats.total_ventas);
  document.getElementById('promedio-venta').textContent = formatCurrency(stats.promedio_venta);
  
  // Calcular tasa de conversión
  const tasaConversion = (stats.ordenes_aprobadas / stats.total_ordenes * 100).toFixed(1);
  document.getElementById('tasa-conversion').textContent = `${tasaConversion}%`;
}

function renderSalesChart(ventasPorDia) {
  // Usar librería de gráficos como Chart.js
  const ctx = document.getElementById('sales-chart').getContext('2d');
  
  const labels = Object.keys(ventasPorDia).sort();
  const data = labels.map(date => ventasPorDia[date]);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Ventas Diarias',
        data: data,
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Ventas de los Últimos 30 Días'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}
```

### Ejemplo 3: Buscar Orden por Email

```javascript
async function searchOrdersByEmail(email) {
  try {
    const response = await fetch(`/api/bold/list-orders?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    
    if (data.success) {
      if (data.orders.length === 0) {
        showMessage('No se encontraron órdenes para este email', 'info');
      } else {
        displayOrders(data.orders);
      }
    }
  } catch (error) {
    console.error('Error buscando órdenes:', error);
    showMessage('Error al buscar órdenes', 'error');
  }
}

// Uso
document.getElementById('search-btn').addEventListener('click', () => {
  const email = document.getElementById('email-input').value;
  if (email) {
    searchOrdersByEmail(email);
  }
});
```

### Ejemplo 4: Exportar Órdenes a CSV

```javascript
async function exportOrdersToCSV(status = null) {
  try {
    let url = '/api/bold/list-orders?limit=1000';
    if (status) {
      url += `&status=${status}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      const csv = convertToCSV(data.orders);
      downloadCSV(csv, `ordenes_${status || 'todas'}_${new Date().toISOString().split('T')[0]}.csv`);
    }
  } catch (error) {
    console.error('Error exportando órdenes:', error);
  }
}

function convertToCSV(orders) {
  const headers = [
    'ID Orden',
    'Cliente',
    'Email',
    'Teléfono',
    'Ciudad',
    'Total',
    'Estado',
    'Método de Pago',
    'Fecha'
  ];
  
  const rows = orders.map(order => [
    order.order_id,
    order.cliente_nombre,
    order.cliente_email,
    order.cliente_telefono,
    order.ciudad,
    order.total,
    order.estado_pago,
    order.metodo_pago,
    new Date(order.created_at).toLocaleString('es-CO')
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

---

## 🔍 Consultas SQL Útiles

### Ver órdenes con productos

```sql
SELECT 
  order_id,
  cliente_nombre,
  cliente_email,
  jsonb_array_length(productos) as cantidad_productos,
  total,
  estado_pago,
  created_at
FROM ordenes_pago
ORDER BY created_at DESC;
```

### Ventas por ciudad

```sql
SELECT 
  ciudad,
  COUNT(*) as total_ordenes,
  SUM(total) as total_ventas,
  AVG(total) as promedio_venta
FROM ordenes_pago
WHERE estado_pago = 'aprobado'
GROUP BY ciudad
ORDER BY total_ventas DESC;
```

### Productos más vendidos

```sql
SELECT 
  producto->>'name' as producto,
  SUM((producto->>'quantity')::int) as cantidad_vendida,
  SUM((producto->>'price')::numeric * (producto->>'quantity')::int) as total_ventas
FROM ordenes_pago,
  jsonb_array_elements(productos) as producto
WHERE estado_pago = 'aprobado'
GROUP BY producto->>'name'
ORDER BY cantidad_vendida DESC
LIMIT 10;
```

### Ventas por método de pago

```sql
SELECT 
  metodo_pago,
  COUNT(*) as total_ordenes,
  SUM(total) as total_ventas,
  ROUND(AVG(total), 2) as promedio_venta
FROM ordenes_pago
WHERE estado_pago = 'aprobado'
GROUP BY metodo_pago
ORDER BY total_ventas DESC;
```

---

## 📝 Notas Importantes

1. **Autenticación**: Estos endpoints deberían estar protegidos con autenticación en producción
2. **Rate Limiting**: Considera implementar límites de tasa para prevenir abuso
3. **Caché**: Implementa caché para consultas frecuentes (estadísticas, etc.)
4. **Logs**: Mantén logs detallados de todas las transacciones
5. **Backups**: Realiza backups regulares de la tabla `ordenes_pago`

---

## 🔗 Enlaces Útiles

- [Documentación Bold](https://bold.co/docs)
- [Supabase Dashboard](https://tscotizacion.tscosta.com.co/)
- [Guía de Integración](./INTEGRACION_BOLD.md)
