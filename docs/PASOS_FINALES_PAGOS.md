# 🚀 Pasos Finales para Activar Pagos Bold

## ✅ Estado Actual

### Lo que YA ESTÁ:
- ✅ Tabla `ordenes_pago` creada en Supabase
- ✅ Todos los campos necesarios
- ✅ Índices básicos (order_id, cliente_email, estado_pago, created_at)
- ✅ Trigger para actualizar `updated_at`
- ✅ Componentes React creados
- ✅ Servicios TypeScript implementados
- ✅ Integración en el panel de administración

### ⚠️ Lo que FALTA:

## 1. Agregar Políticas RLS (IMPORTANTE)

**Sin estas políticas, el panel de administración NO podrá leer las órdenes.**

### Ejecutar en Supabase SQL Editor:

```sql
-- Habilitar RLS
ALTER TABLE public.ordenes_pago ENABLE ROW LEVEL SECURITY;

-- Política para lectura (usuarios autenticados)
CREATE POLICY "Permitir lectura de órdenes a usuarios autenticados"
  ON public.ordenes_pago
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserción (service_role)
CREATE POLICY "Permitir inserción de órdenes desde servicio"
  ON public.ordenes_pago
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Política para actualización (service_role)
CREATE POLICY "Permitir actualización de órdenes desde servicio"
  ON public.ordenes_pago
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para eliminación (service_role)
CREATE POLICY "Permitir eliminación de órdenes desde servicio"
  ON public.ordenes_pago
  FOR DELETE
  TO service_role
  USING (true);
```

**O ejecutar el archivo completo:**
```bash
# Desde Supabase SQL Editor, copiar y pegar:
migrations/20260129_add_rls_policies_ordenes_pago.sql
```

### Verificar políticas:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'ordenes_pago';
```

Deberías ver 4 políticas:
- `Permitir lectura de órdenes a usuarios autenticados`
- `Permitir inserción de órdenes desde servicio`
- `Permitir actualización de órdenes desde servicio`
- `Permitir eliminación de órdenes desde servicio`

---

## 2. Agregar Índices Adicionales (OPCIONAL pero RECOMENDADO)

Estos índices mejorarán el rendimiento de búsquedas y filtros:

```sql
-- Índice para búsqueda por transaction ID de Bold
CREATE INDEX IF NOT EXISTS idx_ordenes_pago_bold_transaction_id 
  ON public.ordenes_pago(bold_transaction_id);

-- Índice para filtrado por método de pago
CREATE INDEX IF NOT EXISTS idx_ordenes_pago_metodo_pago 
  ON public.ordenes_pago(metodo_pago);
```

**O ejecutar el archivo completo:**
```bash
# Desde Supabase SQL Editor, copiar y pegar:
migrations/20260129_add_indices_ordenes_pago.sql
```

### Verificar índices:
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ordenes_pago'
ORDER BY indexname;
```

Deberías ver 6 índices en total:
- `idx_ordenes_pago_order_id`
- `idx_ordenes_pago_cliente_email`
- `idx_ordenes_pago_estado_pago`
- `idx_ordenes_pago_created_at`
- `idx_ordenes_pago_bold_transaction_id` ⭐ NUEVO
- `idx_ordenes_pago_metodo_pago` ⭐ NUEVO

---

## 3. Probar la Funcionalidad

### Paso 1: Acceder al Panel
1. Inicia sesión en el panel de administración
2. Busca "Pagos Bold" en el sidebar
3. Haz clic para acceder

### Paso 2: Verificar que Carga
- ✅ Debería mostrar la lista de órdenes (vacía si no hay datos)
- ✅ Debería mostrar los filtros
- ✅ Debería mostrar la barra de búsqueda

### Paso 3: Crear Orden de Prueba (Opcional)

Si no tienes órdenes aún, puedes crear una de prueba:

```sql
INSERT INTO public.ordenes_pago (
  order_id,
  cliente_nombre,
  cliente_email,
  cliente_telefono,
  direccion_completa,
  ciudad,
  departamento,
  productos,
  subtotal,
  descuento,
  costo_envio,
  total,
  metodo_pago,
  estado_pago
) VALUES (
  'ORD-TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'Cliente de Prueba',
  'prueba@ejemplo.com',
  '3001234567',
  'Calle 40 # 2-55, Barrio Centro',
  'Cartagena',
  'Bolívar',
  '[
    {
      "id": "prod-1",
      "name": "Hidrolavadora KÄRCHER K2",
      "model": "K2 Basic",
      "price": 549900,
      "quantity": 1,
      "image": "/img/productos/k2.jpg"
    }
  ]'::jsonb,
  549900,
  0,
  30000,
  579900,
  'pse',
  'aprobado'
);
```

### Paso 4: Probar Funcionalidades

#### Búsqueda:
- Busca por "Cliente de Prueba"
- Busca por "prueba@ejemplo.com"
- Busca por "ORD-TEST"

#### Filtros:
- Filtra por estado "Aprobado"
- Filtra por método "PSE"
- Combina filtros

#### Ver Detalles:
- Haz clic en la orden
- Verifica que se muestre toda la información
- Verifica que se muestren los productos

#### Exportar CSV:
- Haz clic en "Exportar CSV"
- Verifica que se descargue el archivo
- Abre el CSV y verifica los datos

---

## 4. Verificar Integración con Bold

### Flujo Completo:

1. **Landing Page**: Cliente agrega productos al carrito
2. **Checkout**: Cliente llena formulario
3. **API Generate Hash**: Se genera hash de integridad
4. **API Create Order**: Se crea orden en `ordenes_pago`
5. **Bold Payment**: Cliente paga
6. **Confirmación**: Se actualiza estado en `ordenes_pago`
7. **Panel Admin**: Administrador ve la orden en "Pagos Bold"

### Verificar APIs:

```bash
# Test generate-hash
curl -X POST http://localhost:3000/api/bold/generate-hash \
  -H "Content-Type: application/json" \
  -d '{"orderId":"TEST-123","amount":50000,"currency":"COP"}'

# Test create-order
curl -X POST http://localhost:3000/api/bold/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId":"TEST-123",
    "clienteNombre":"Test User",
    "clienteEmail":"test@example.com",
    "clienteTelefono":"3001234567",
    "direccionCompleta":"Calle 123",
    "ciudad":"Bogotá",
    "departamento":"Cundinamarca",
    "productos":[],
    "subtotal":50000,
    "total":50000,
    "metodoPago":"pse"
  }'
```

---

## 🐛 Solución de Problemas

### Error: "No se pueden cargar las órdenes"

**Causa**: Faltan políticas RLS

**Solución**: Ejecutar el script de políticas RLS (Paso 1)

### Error: "Permission denied"

**Causa**: Usuario no tiene permisos

**Solución**: 
1. Verificar que el usuario esté autenticado
2. Verificar políticas RLS
3. Verificar que `SUPABASE_SERVICE_KEY` esté configurada en `.env`

### No se muestran órdenes

**Causa**: No hay datos o filtros muy restrictivos

**Solución**:
1. Verificar que existan órdenes en la tabla
2. Limpiar filtros
3. Crear orden de prueba

### Error al exportar CSV

**Causa**: No hay órdenes para exportar

**Solución**: Verificar que haya órdenes visibles después de aplicar filtros

---

## ✅ Checklist Final

### Base de Datos:
- [ ] Políticas RLS agregadas
- [ ] Índices adicionales agregados (opcional)
- [ ] Políticas verificadas
- [ ] Índices verificados

### Pruebas:
- [ ] Panel de Pagos carga correctamente
- [ ] Lista de órdenes se muestra
- [ ] Búsqueda funciona
- [ ] Filtros funcionan
- [ ] Modal de detalles funciona
- [ ] Exportar CSV funciona
- [ ] Eliminar orden funciona

### Integración:
- [ ] API generate-hash funciona
- [ ] API create-order funciona
- [ ] API update-payment-status funciona
- [ ] Flujo completo de pago funciona

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs del navegador** (F12 → Console)
2. **Revisa los logs de Supabase** (Dashboard → Logs)
3. **Verifica las variables de entorno** (`.env`)
4. **Consulta la documentación**:
   - [PAGOS_BOLD_ADMIN.md](./PAGOS_BOLD_ADMIN.md)
   - [INTEGRACION_BOLD.md](./INTEGRACION_BOLD.md)
   - [EJEMPLOS_API_BOLD.md](./EJEMPLOS_API_BOLD.md)

---

## 🎉 ¡Listo!

Una vez completados estos pasos, la funcionalidad de Pagos Bold estará 100% operativa.

**Próximos pasos recomendados:**
1. Implementar webhooks de Bold para actualizaciones en tiempo real
2. Agregar dashboard de estadísticas con gráficos
3. Implementar notificaciones de nuevas órdenes
4. Agregar reportes personalizados
