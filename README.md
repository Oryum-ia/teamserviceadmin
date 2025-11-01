# TeamService Costa - Sistema de Gestión de Órdenes de Servicio

Sistema completo de gestión de órdenes de servicio técnico con Supabase, Next.js 15 y React 19.

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#descripción-del-proyecto)
- [Características Principales](#características-principales)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Configuración](#instalación-y-configuración)
- [Uso de la Aplicación](#uso-de-la-aplicación)
- [Roles y Permisos](#roles-y-permisos)
- [Contribución](#contribución)
- [Licencia](#licencia)

## 📖 Descripción del Proyecto

TeamService Costa es una aplicación web diseñada para gestionar órdenes de servicio técnico de manera eficiente. Permite a los técnicos y administradores realizar un seguimiento completo del ciclo de vida de las reparaciones, desde el diagnóstico inicial hasta la entrega final del equipo.

El sistema está construido con una arquitectura moderna que separa claramente el frontend y el backend, utilizando Supabase como servicio de base de datos y autenticación, lo que garantiza seguridad, escalabilidad y facilidad de mantenimiento.

## ⚠️ IMPORTANTE: Primero configura Supabase

Si ves el error **"Invalid login credentials"**, es porque necesitas configurar la base de datos primero.

**Sigue esta guía paso a paso:** [GUIA_VISUAL_SETUP.md](./GUIA_VISUAL_SETUP.md)

## ✨ Características Principales

### ✅ Módulos Implementados
- 🏠 **Dashboard** - Estadísticas en tiempo real con gráficos interactivos
- 📋 **Órdenes** - Gestión completa con 4 fases (diagnóstico, cotización, reparación, finalizada)
- 👥 **Clientes** - Gestión de personas naturales y jurídicas con información detallada
- 💬 **Comentarios** - Sistema de seguimiento de retrocesos de fase
- 👤 **Usuarios** - Gestión de técnicos, administradores y super-admin con control de acceso
- 🏪 **Admin-tienda** - Gestión de productos para la landing page
- 📦 **Inventarios** - Control de accesorios y modelos de equipos

### 🔨 En Desarrollo
- 📊 **Indicadores** - Estadísticas avanzadas y reportes personalizados
- 📈 **Desempeño** - Métricas por técnico y sede
- 📱 **Notificaciones** - Sistema de alertas y recordatorios
- 📄 **Reportes** - Generación de informes PDF y Excel

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15.5.6, React 19.2.0, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Estilos**: Tailwind CSS con diseño responsive
- **Iconos**: Lucide React
- **Validación de formularios**: Formik + Yup
- **Manejo de estado**: React Context API
- **Gestión de archivos**: Supabase Storage

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Páginas de Next.js
│   ├── paneladmin/         # Panel de administración
│   └── tecnico/            # Panel para técnicos
├── components/             # Componentes React
│   ├── paneladmin/         # Componentes del panel admin
│   └── ...                 # Otros componentes
├── contexts/               # Contextos de React
├── lib/                    # Utilidades y configuraciones
│   ├── services/           # Servicios de API
│   └── validations/        # Esquemas de validación
├── types/                  # Definiciones de TypeScript
└── utils/                  # Funciones utilitarias
```

## 🚀 Instalación y Configuración

### 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta en Supabase (https://supabase.com)
- Git para clonar el repositorio

### 📋 Pasos para empezar:

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Oryum-ia/teamserviceadmin.git
   cd teamserviceadmin
   ```

2. **Configurar Supabase** (15 minutos)
   - Lee: [GUIA_VISUAL_SETUP.md](./GUIA_VISUAL_SETUP.md)
   - Ejecuta el script: [scripts/setup-supabase.sql](./scripts/setup-supabase.sql)
   - Crea el usuario admin en Supabase

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   Edita `.env.local` con tus credenciales de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_anonima_de_supabase
   SUPABASE_SERVICE_ROLE_KEY=tu_key_de_servicio_de_supabase
   ```

4. **Instalar dependencias**
   ```bash
   npm install
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**
   Navega a [http://localhost:3000](http://localhost:3000)

## 🎯 Uso de la Aplicación

### Inicio de Sesión

1. Accede con las credenciales de administrador creadas durante la configuración
2. Los roles disponibles son: `super-admin`, `admin`, y `tecnico`

### Gestión de Órdenes

1. **Crear Orden**: Desde el panel de órdenes, haz clic en "Nueva Orden"
2. **Seguimiento**: Las órdenes pasan por 4 fases:
   - Diagnóstico: Identificación del problema
   - Cotización: Estimación de costos
   - Reparación: Ejecución del servicio
   - Finalizada: Entrega del equipo
3. **Comentarios**: Añade notas en cada fase para documentar el progreso

### Gestión de Usuarios

1. **Crear Usuario**: Solo los super-admin pueden crear nuevos usuarios
2. **Asignar Roles**: Define los permisos de acceso según el rol
3. **Gestión de Sedes**: Organiza usuarios por ubicación geográfica

## 👥 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| Super-admin | Acceso completo, gestión de usuarios, configuración del sistema |
| Admin | Gestión de órdenes, clientes, inventario, usuarios técnicos |
| Técnico | Gestión de órdenes asignadas, actualización de estados |

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o preguntas, contacta a:
- Email: soporte@teamservicecosta.com
- Issues de GitHub: [Crear Issue](https://github.com/Oryum-ia/teamserviceadmin/issues)

4. **Abrir en navegador**
   ```
   http://localhost:3000
   ```

5. **Iniciar sesión**
   - Email: `admin@teamservice.com`
   - Password: `Admin123!`

## 📚 Documentación Completa

- [GUIA_VISUAL_SETUP.md](./GUIA_VISUAL_SETUP.md) - Configuración paso a paso con imágenes
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Documentación técnica de Supabase
- [INICIO_RAPIDO.md](./INICIO_RAPIDO.md) - Guía rápida de 5 minutos
- [IMPLEMENTACION_COMPLETA.md](./IMPLEMENTACION_COMPLETA.md) - Documentación completa del código

## 📂 Estructura del Proyecto

```
teamservicecosta/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Login
│   │   └── paneladmin/
│   │       └── page.tsx                # Panel principal
│   ├── components/
│   │   ├── paneladmin/
│   │   │   ├── DashboardNuevo.tsx      # Dashboard
│   │   │   ├── OrdenesNuevo.tsx        # Gestión de órdenes
│   │   │   ├── Clientes.tsx            # Gestión de clientes
│   │   │   ├── Usuarios.tsx            # Gestión de usuarios
│   │   │   ├── Comentarios.tsx         # Comentarios
│   │   │   └── SidebarNuevo.tsx        # Menú lateral
│   │   ├── LoginForm.tsx               # Formulario de login
│   │   └── ThemeProvider.tsx           # Tema claro/oscuro
│   └── lib/
│       ├── supabase.ts                 # Cliente de Supabase
│       └── services/
│           ├── clienteService.ts       # CRUD clientes
│           ├── ordenService.ts         # CRUD órdenes
│           └── usuarioService.ts       # CRUD usuarios
├── scripts/
│   └── setup-supabase.sql              # Script de inicialización
└── public/
    └── img/
        └── logo.jpg                    # Logo de la empresa
```

## 🔄 Flujo de Trabajo de Órdenes

1. **Diagnóstico** - Técnico evalúa el equipo
2. **Cotización** - Se genera presupuesto → Cliente aprueba
3. **Reparación** - Se realiza el trabajo
4. **Finalizada** - Orden completada

### Estados posibles:
- Pendiente
- En proceso
- Espera de repuestos
- Completada
- Cancelada

## 🎯 Validaciones Importantes

- ✅ No se puede modificar una fase anterior
- ✅ La cotización debe ser aprobada antes de reparación
- ✅ Se puede marcar "espera de repuestos" en cualquier fase
- ✅ Los comentarios de retroceso se registran automáticamente

## 🔐 Roles del Sistema

- **Técnico**: Trabajo en diagnóstico y reparación
- **Administrador**: Acceso completo excepto gestión de usuarios
- **Super-admin**: Acceso total, gestión de usuarios

## 🚀 Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint
```

## 📊 Base de Datos

### Tablas principales:
- **clientes** - Información de clientes (natural/jurídica)
- **usuarios** - Usuarios del sistema con roles
- **ordenes** - Órdenes de servicio con todas sus fases
- **comentarios** - Comentarios de retroceso
- **inventario** - Accesorios y modelos
- **productos_tienda** - Productos para landing page

### Campos JSONB en órdenes:
- **diagnostico**: Descripción del problema, notas, preventivos
- **cotizacion**: Repuestos, costos, aprobación del cliente
- **reparacion**: Trabajo realizado, repuestos usados

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Autenticación con Supabase Auth
- Políticas de acceso por rol
- Validación de permisos en el frontend y backend

## 📞 Configuración de Supabase

Las credenciales ya están en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://caodmkmabgyueofjwgek.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**No necesitas cambiar nada**, solo ejecutar el script SQL.

## 🐛 Solución de Problemas

### Error: "Invalid login credentials"
**Solución:** Lee [GUIA_VISUAL_SETUP.md](./GUIA_VISUAL_SETUP.md) - Necesitas configurar Supabase primero.

### Error: "relation 'clientes' does not exist"
**Solución:** Ejecuta el script [scripts/setup-supabase.sql](./scripts/setup-supabase.sql) en Supabase SQL Editor.

### Error: "permission denied"
**Solución:** Verifica que las políticas RLS estén configuradas correctamente.

### No veo estadísticas en el dashboard
**Solución:** Crea algunas órdenes de prueba primero.

## 🎨 Tema Claro/Oscuro

El sistema incluye soporte para tema claro y oscuro. Usa el botón en el header para cambiar.

## 📝 Notas Importantes

1. **Primer inicio**: Debes configurar Supabase antes de usar el sistema
2. **Usuario admin**: Créalo siguiendo [GUIA_VISUAL_SETUP.md](./GUIA_VISUAL_SETUP.md)
3. **Logo**: Cambia `/public/img/logo.jpg` por tu logo
4. **Colores**: El sistema usa amarillo como color principal (editable en Tailwind)

## 🎉 ¡Listo para usar!

Una vez completada la configuración de Supabase, tendrás un sistema completo de gestión de órdenes de servicio con:

- ✅ Autenticación segura
- ✅ Gestión de clientes
- ✅ Gestión de órdenes con 4 fases
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión de usuarios por roles
- ✅ Sistema de comentarios
- ✅ Tema claro/oscuro
- ✅ Responsive design

**¿Necesitas ayuda?** Revisa la documentación en los archivos `.md` del proyecto.