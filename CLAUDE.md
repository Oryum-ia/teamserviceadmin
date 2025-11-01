# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TeamService Costa is a service order management system for technical repair services. Built with Next.js 15, React 19, TypeScript, and Supabase (PostgreSQL + Auth). The application manages a 4-phase workflow for service orders: diagnosis → quotation → repair → completed.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

**Note:** Both `package-lock.json` and `pnpm-lock.yaml` exist in the repo. Always use `npm` to avoid tool conflicts.

## Initial Setup Requirements

**CRITICAL:** This application requires Supabase configuration before it will work. If you encounter "Invalid login credentials" or "relation does not exist" errors:

1. Execute the SQL script at [scripts/setup-supabase.sql](scripts/setup-supabase.sql) in Supabase SQL Editor
2. Create the admin user in Supabase Auth (see [GUIA_VISUAL_SETUP.md](GUIA_VISUAL_SETUP.md))
3. Verify `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

See [README.md](README.md) for detailed setup instructions.

## Architecture Overview

### Application Structure

- **Entry Points:**
  - [src/app/page.tsx](src/app/page.tsx) - Login page
  - [src/app/paneladmin/page.tsx](src/app/paneladmin/page.tsx) - Admin panel (main application)
  - [src/app/tecnico/](src/app/tecnico/) - Technician area

- **Routing:** Next.js 15 App Router with client-side navigation
- **Path Alias:** `@/*` maps to `./src/*` (configured in [tsconfig.json](tsconfig.json))

### Data Layer Architecture

**Service Pattern:** All Supabase interactions are centralized in service modules located in [src/lib/services/](src/lib/services/):

- [clienteService.ts](src/lib/services/clienteService.ts) - Customer CRUD operations
- [ordenService.ts](src/lib/services/ordenService.ts) - Service order management
- [usuarioService.ts](src/lib/services/usuarioService.ts) - User management
- [estadisticasService.ts](src/lib/services/estadisticasService.ts) - Dashboard statistics
- [equipoService.ts](src/lib/services/equipoService.ts) - Equipment catalog
- [modeloService.ts](src/lib/services/modeloService.ts) - Model catalog
- [accesorioService.ts](src/lib/services/accesorioService.ts) - Accessories catalog
- [repuestoService.ts](src/lib/services/repuestoService.ts) - Parts/spare parts

**Key Principle:** UI components should NEVER directly import or use the Supabase client. Always use service functions.

### State Management

Three React contexts provide global state:

- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) - User authentication and session
- [src/contexts/NotificationContext.tsx](src/contexts/NotificationContext.tsx) - Real-time notifications
- [src/contexts/ToastContext.tsx](src/contexts/ToastContext.tsx) - Toast notifications

Session is stored in localStorage with the key `userSession`.

### UI Component Organization

- [src/components/paneladmin/](src/components/paneladmin/) - Main admin panel sections:
  - `DashboardNuevo.tsx` - Statistics dashboard
  - `OrdenesNuevo.tsx` - Service orders list and management
  - `Clientes.tsx` - Customer management
  - `Usuarios.tsx` - User management (super-admin only)
  - `Comentarios.tsx` - Backtrack comments
  - `SidebarNuevo.tsx` - Navigation sidebar

- [src/components/paneladmin/ordenes/](src/components/paneladmin/ordenes/) - Order-related components:
  - `OrdenModal.tsx` - Main order modal (create/edit)
  - `SearchableSelect.tsx` - Single searchable dropdown
  - `MultiSearchableSelect.tsx` - Multi-select searchable dropdown
  - `EquipoModal.tsx`, `ModeloModal.tsx`, `AccesorioModal.tsx`, `RepuestoModal.tsx` - Catalog modals

### Type System

TypeScript types are defined in [src/types/database.types.ts](src/types/database.types.ts):

- `UserRole`: `'tecnico' | 'administrador' | 'super-admin'`
- `OrdenPhase`: `'diagnostico' | 'cotizacion' | 'reparacion' | 'finalizada'`
- `OrdenStatus`: `'pendiente' | 'en_proceso' | 'espera_repuestos' | 'completada' | 'cancelada'`
- `Cliente`: Customer entity (supports both natural and legal persons)
- `Usuario`: User entity with role-based permissions
- `Orden`: Service order with JSONB fields for phase data

## Order Workflow & Business Rules

### Phase Progression

Service orders follow a strict 4-phase workflow:

1. **Diagnostico (Diagnosis)** - Technician evaluates equipment and problem
2. **Cotizacion (Quotation)** - Cost estimate created and sent to customer
3. **Reparacion (Repair)** - Actual repair work performed
4. **Finalizada (Completed)** - Order closed

### Critical Business Rules

1. **Phase Immutability:** Once an order advances to the next phase, data from previous phases becomes read-only
2. **Quotation Approval Required:** The quotation MUST be approved by the customer (`cotizacion.aprobada_por_cliente = true`) before advancing to repair phase
3. **Backtracking:** Orders can move backward between phases, but require a comment explaining why (stored in `comentarios_retroceso`)
4. **Waiting for Parts:** Orders can be marked as "espera_repuestos" from any phase
5. **JSONB Structure:** Each phase stores its data in dedicated JSONB columns (`diagnostico`, `cotizacion`, `reparacion`)

### Service Functions for Phase Management

From [ordenService.ts](src/lib/services/ordenService.ts):

- `actualizarDiagnostico(ordenId, diagnostico)` - Update diagnosis (only if in diagnostico phase)
- `avanzarACotizacion(ordenId, cotizacion)` - Advance from diagnostico to cotizacion
- `actualizarCotizacion(ordenId, cotizacion)` - Update quotation (only if in cotizacion phase)
- `avanzarAReparacion(ordenId, reparacion)` - Advance from cotizacion to reparacion (validates approval)
- `finalizarOrden(ordenId)` - Complete order
- `agregarComentarioRetroceso(ordenId, comentario)` - Add backtrack comment when moving to previous phase
- `marcarEsperaRepuestos(ordenId)` - Mark order as waiting for parts

## Database Schema

### Main Tables

- **clientes** - Customer information (natural/legal persons with NIT/CC)
- **usuarios** - System users with roles (tecnico, administrador, super-admin)
- **ordenes** - Service orders with phase tracking
- **comentarios** - Backtrack comments (when orders move backward)
- **inventario** - Accessories and models catalog
- **productos_tienda** - Products for landing page

### Row Level Security (RLS)

All tables have RLS enabled with role-based policies:
- **Tecnicos:** Read/write access to orders they're assigned to
- **Administradores:** Full access except user management
- **Super-admin:** Complete access to all tables

## Authentication Flow

1. User logs in via [LoginForm.tsx](src/components/LoginForm.tsx)
2. Supabase Auth validates credentials
3. User data is stored in `localStorage` with key `userSession`
4. [paneladmin/page.tsx](src/app/paneladmin/page.tsx) checks session on mount
5. If no valid session, redirects to login

## Styling & Theming

- **Framework:** Tailwind CSS v4 (via PostCSS)
- **Theme System:** Light/dark mode toggle with theme stored in localStorage
- **Global Styles:** [src/app/globals.css](src/app/globals.css)
- **Theme Provider:** [ThemeProvider.tsx](src/components/ThemeProvider.tsx)
- **Primary Color:** Yellow/amber (configurable in Tailwind)

## Key Development Patterns

### When Adding New Service Functions

1. Create or update service file in [src/lib/services/](src/lib/services/)
2. Import Supabase client from [supabaseClient.ts](src/lib/supabaseClient.ts)
3. Use TypeScript types from [database.types.ts](src/types/database.types.ts)
4. Add proper error handling with console logs (use ✅ for success, ❌ for errors)
5. Return data in a consistent format

### When Creating New Components

1. Place in appropriate directory ([src/components/](src/components/) or [src/components/paneladmin/](src/components/paneladmin/))
2. Use `'use client'` directive for client components
3. Import theme via `useTheme()` hook for dark mode support
4. Follow existing naming conventions (PascalCase for components)

### When Modifying Order Logic

- Always check current `fase_actual` before allowing updates
- Validate business rules (e.g., quotation approval before repair)
- Use the service functions rather than direct Supabase queries
- Remember that JSONB fields can be partial - handle undefined gracefully

## Important File References

- **Supabase Setup:** [scripts/setup-supabase.sql](scripts/setup-supabase.sql)
- **Visual Setup Guide:** [GUIA_VISUAL_SETUP.md](GUIA_VISUAL_SETUP.md)
- **Technical Documentation:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Quick Start:** [INICIO_RAPIDO.md](INICIO_RAPIDO.md)
- **Complete Implementation:** [IMPLEMENTACION_COMPLETA.md](IMPLEMENTACION_COMPLETA.md)

## Testing & Validation

There is currently no test runner configured. Manual testing workflow:

1. Start dev server: `npm run dev`
2. Test routes:
   - Login: http://localhost:3000
   - Admin panel: http://localhost:3000/paneladmin
   - Technician: http://localhost:3000/tecnico
3. Verify phase transitions with real orders
4. Test role-based access control with different user types

## Common Gotchas

1. **Service vs Client Import:** Never import `supabase` directly in components - use service functions
2. **Phase Validation:** Always validate phase before updating order data
3. **JSONB Nullability:** Check for undefined/null in JSONB fields before accessing nested properties
4. **Lock File Mismatch:** Use `npm` not `pnpm` (both lock files exist)
5. **Session Check:** Panel admin page checks localStorage on mount - missing session = redirect to login
