
| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| id | SERIAL BIGINT | Identificador único de la encuesta | Sí |
| nombre_completo | VARCHAR(255) | Nombre completo del usuario | Sí |
| email | VARCHAR(255) | Correo electrónico del usuario | Sí |
| telefono | VARCHAR(20) | Teléfono de contacto | No |
| sede | VARCHAR(50) | Sede donde fue atendido (monteria, cartagena, apartado) | Sí |
| atencion_calificacion | INTEGER | Calificación de atención (1-5) | Sí |
| calidad_calificacion | INTEGER | Calificación de calidad del servicio (1-5) | Sí |
| tiempo_calificacion | INTEGER | Calificación de tiempo de respuesta (1-5) | Sí |
| productos_calificacion | INTEGER | Calificación de productos/equipos (1-5) | Sí |
| satisfaccion_general | INTEGER | Satisfacción general (1-5) | Sí |
| recomendacion_puntuacion | INTEGER | Puntuación de recomendación (0-10) | Sí |
| comentarios | TEXT | Comentarios adicionales | No |
| fecha_creacion | TIMESTAMP | Fecha y hora de creación del registro | Sí |
| ip_address | INET | Dirección IP del usuario | No |
| user_agent | TEXT | Navegador del usuario | No |

### SQL para crear la tabla

```sql
CREATE TABLE encuestas (
    id SERIAL BIGINT PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    sede VARCHAR(50) NOT NULL CHECK (sede IN ('monteria', 'cartagena', 'apartado')),
    atencion_calificacion INTEGER NOT NULL CHECK (atencion_calificacion BETWEEN 1 AND 5),
    calidad_calificacion INTEGER NOT NULL CHECK (calidad_calificacion BETWEEN 1 AND 5),
    tiempo_calificacion INTEGER NOT NULL CHECK (tiempo_calificacion BETWEEN 1 AND 5),
    productos_calificacion INTEGER NOT NULL CHECK (productos_calificacion BETWEEN 1 AND 5),
    satisfaccion_general INTEGER NOT NULL CHECK (satisfaccion_general BETWEEN 1 AND 5),
    recomendacion_puntuacion INTEGER NOT NULL CHECK (recomendacion_puntuacion BETWEEN 0 AND 10),
    comentarios TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_encuestas_email ON encuestas(email);
CREATE INDEX idx_encuestas_sede ON encuestas(sede);
CREATE INDEX idx_encuestas_fecha ON encuestas(fecha_creacion);
```

---

## Tabla: PQR (Peticiones, Quejas y Reclamos)

Esta tabla almacenará todas las solicitudes PQR de los usuarios.

### Estructura de la tabla `pqr`

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| id | SERIAL BIGINT | Identificador único del PQR | Sí |
| tipo_solicitud | VARCHAR(20) | Tipo de solicitud (peticion, queja, reclamo, sugerencia, felicitacion) | Sí |
| nombre_completo | VARCHAR(255) | Nombre completo del solicitante | Sí |
| email | VARCHAR(255) | Correo electrónico del solicitante | Sí |
| telefono | VARCHAR(20) | Teléfono de contacto | Sí |
| ciudad | VARCHAR(50) | Ciudad del solicitante | Sí |
| asunto | VARCHAR(255) | Asunto de la solicitud | Sí |
| mensaje | TEXT | Descripción detallada de la solicitud | Sí |
| archivo_adjunto | VARCHAR(500) | Ruta del archivo adjunto (si existe) | No |
| estado | VARCHAR(20) | Estado de la solicitud (recibido, en_proceso, respondido, cerrado) | Sí |
| prioridad | VARCHAR(10) | Nivel de prioridad (baja, media, alta, urgente) | Sí |
| fecha_creacion | TIMESTAMP | Fecha y hora de creación del registro | Sí |
| fecha_actualizacion | TIMESTAMP | Fecha y hora de última actualización | Sí |
| fecha_respuesta | TIMESTAMP | Fecha y hora de respuesta | No |
| respuesta | TEXT | Respuesta proporcionada al solicitante | No |
| radicado | VARCHAR(20) | Número de radicado único | Sí |
| ip_address | INET | Dirección IP del usuario | No |
| user_agent | TEXT | Navegador del usuario | No |
| id_usuario_asignado | BIGINT | ID del usuario que atiende el caso | No |

### SQL para crear la tabla

```sql
CREATE TABLE pqr (
    id SERIAL BIGINT PRIMARY KEY,
    tipo_solicitud VARCHAR(20) NOT NULL CHECK (tipo_solicitud IN ('peticion', 'queja', 'reclamo', 'sugerencia', 'felicitacion')),
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    ciudad VARCHAR(50) NOT NULL CHECK (ciudad IN ('monteria', 'cartagena', 'apartado', 'otra')),
    asunto VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    archivo_adjunto VARCHAR(500),
    estado VARCHAR(20) NOT NULL DEFAULT 'recibido' CHECK (estado IN ('recibido', 'en_proceso', 'respondido', 'cerrado')),
    prioridad VARCHAR(10) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP,
    respuesta TEXT,
    radicado VARCHAR(20) NOT NULL UNIQUE,
    id_usuario_asignado BIGINT
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_pqr_email ON pqr(email);
CREATE INDEX idx_pqr_estado ON pqr(estado);
CREATE INDEX idx_pqr_tipo ON pqr(tipo_solicitud);
CREATE INDEX idx_pqr_fecha ON pqr(fecha_creacion);
CREATE INDEX idx_pqr_radicado ON pqr(radicado);
