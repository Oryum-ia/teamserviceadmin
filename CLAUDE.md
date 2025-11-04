# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Install dependencies
npm install
```

## Project Overview

TeamService Costa is a comprehensive service order management system built with:
- **Frontend**: Next.js 15.5.6 with React 19.2.0 and TypeScript
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS v4 with light/dark theme support
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for dashboard statistics

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Login page (root)
│   ├── paneladmin/               # Admin panel routes
│   │   ├── page.tsx              # Dashboard
│   │   └── ordenes/[id]/page.tsx # Order detail page
│   └── tecnico/                  # Technician panel
│       ├── page.tsx              # Technician dashboard
│       └── diagnostico/page.tsx  # Diagnosis module
├── components/                   # React components
│   ├── paneladmin/               # Admin components
│   │   ├── DashboardNuevo.tsx    # Main dashboard with stats
│   │   ├── OrdenesNuevo.tsx      # Order management
│   │   ├── Clientes.tsx          # Client management
│   │   ├── Usuarios.tsx          # User management
│   │   ├── Comentarios.tsx       # Comments system
│   │   ├── Desempeno.tsx         # Performance metrics
│   │   ├── Indicadores.tsx       # Statistics/indicators
│   │   └── inventario/           # Inventory components
│   │       ├── Accesorios.tsx    # Accessories
│   │       ├── Equipos.tsx       # Equipment
│   │       ├── Repuestos.tsx     # Spare parts
│   │       └── Categorias.tsx    # Categories
│   ├── LoginForm.tsx             # Authentication form
│   ├── NotificationBell.tsx      # Notification system
│   ├── NotificationModal.tsx     # Notification UI
│   ├── ThemeProvider.tsx         # Theme context (light/dark)
│   └── ToastContainer.tsx        # Toast notifications
├── lib/                          # Core utilities and services
│   ├── supabaseClient.ts         # Supabase client configuration
│   ├── ordenLocalStorage.ts      # Order state persistence
│   └── services/                 # API service layer
│       ├── ordenService.ts       # Order CRUD operations
│       ├── clienteService.ts     # Client CRUD operations
│       ├── usuarioService.ts     # User/Auth CRUD operations
│       ├── estadisticasService.ts # Dashboard statistics
│       ├── comentarioService.ts  # Comments system
│       ├── authService.ts        # Authentication service
│       ├── equipoService.ts      # Equipment management
│       ├── accesorioService.ts   # Accessories management
│       ├── categoriaService.ts   # Category management
│       ├── marcaService.ts       # Brand management
│       ├── modeloService.ts      # Model management
│       ├── repuestoService.ts    # Spare parts management
│       ├── productoTiendaService.ts # Shop products
│       ├── imagenService.ts      # Image upload/storage
│       ├── carruselService.ts    # Carousel management
│       └── desempenoService.ts   # Performance analytics
├── contexts/                     # React Context providers
│   ├── NotificationContext.tsx   # Notifications state
│   └── ToastContext.tsx          # Toast notifications state
├── types/                        # TypeScript type definitions
│   └── database.types.ts         # Database schema types
├── utils/                        # Utility functions
└── scripts/                      # Database setup scripts
    └── setup-supabase.sql        # Database initialization

public/
└── img/
    └── logo.jpg                  # Company logo
```

## Architecture & Key Patterns

### Authentication Flow
- Uses Supabase Auth with email/password
- Roles: `super-admin`, `admin`, `tecnico`
- Login page is at `/` (src/app/page.tsx)
- Protected routes check authentication via Supabase session
- Session persistence handled by Supabase client

### Service Layer Pattern
All database operations are centralized in `src/lib/services/` with separate service files for each entity:
- Services use Supabase client from `@/lib/supabaseClient`
- Each service exports async functions for CRUD operations
- Services handle error management and data transformation

### Order Management System
Orders flow through 4 phases with specific business rules:
1. **Recepción** - Initial order creation
2. **Diagnóstico** - Problem identification (technicians only)
3. **Cotización** - Cost estimation → requires client approval
4. **Reparación** - Service execution
5. **Finalizada** - Order completion

Critical validation: Cannot modify previous phases once advanced. `ordenService.ts:29` enforces this.

### State Management
- **Context API**: Theme (light/dark), notifications, toasts
- **Local Storage**: Order state persistence via `ordenLocalStorage.ts`
- **Supabase**: User sessions, real-time subscriptions

### Dashboard System
Real-time statistics via `estadisticasService.ts`:
- Order counts by status and phase
- Performance metrics by technician
- Trends and comparisons
- Uses Recharts for data visualization

### Theme System
Light/dark mode via `ThemeProvider.tsx`:
- Persisted in localStorage key `teamservice-theme`
- Applied across all components using `useTheme()` hook
- Styled with Tailwind CSS classes

## Database Setup (CRITICAL)

**The system requires Supabase configuration before first use.**

Setup steps:
1. Create a Supabase project
2. Execute `scripts/setup-supabase.sql` in Supabase SQL Editor
3. Configure `.env.local` with Supabase credentials (use `.env.example` as template)
4. Create an admin user via Supabase Auth
5. Login with: admin@teamservice.com / Admin123! (after setup)

Key database tables:
- `usuarios` - System users with roles
- `clientes` - Client information (natural/jurídica)
- `ordenes` - Service orders with JSONB fields for phases
- `comentarios` - Retroactive comments and phase changes
- `equipos` - Equipment catalog
- `inventario` - Accessories and spare parts
- `encuestas` - Customer satisfaction surveys
- `pqr` - Complaints and claims system

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_NAME=TeamService Costa
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development Workflow

### Running Tests
No explicit test configuration found. Add testing framework (Jest/Vitest) if needed.

### Linting & Code Quality
- ESLint configured with `eslint.config.mjs`
- Extends: `next/core-web-vitals`, `next/typescript`
- Run with `npm run lint`

### Type Safety
- TypeScript configuration in `tsconfig.json`
- Database types in `src/types/database.types.ts`
- Generated types from Supabase schema

### Component Development
Components use:
- Functional components with hooks
- TypeScript for type safety
- Tailwind CSS for styling
- Lucide React for icons
- Theme-aware styling (light/dark mode)

## Key Technical Decisions

### Phase Validation
Business rule: Orders cannot regress to previous phases. This is enforced in the service layer with checks before phase transitions.

### JSONB Fields in Orders
Complex order data stored in JSONB fields:
- `diagnostico`: Problem description, notes, preventive measures
- `cotizacion`: Parts, costs, client approval
- `reparacion`: Work performed, parts used

### Real-time Updates
Supabase subscriptions used for:
- Live order status updates
- Notification system
- Dashboard statistics refresh

### Role-Based Access
- **super-admin**: Full access, user management
- **admin**: Order, client, inventory management (no user management)
- **tecnico**: Assigned orders only, diagnosis and repair phases

## Troubleshooting

### "Invalid login credentials"
- Database not configured: Run `scripts/setup-supabase.sql`
- No admin user: Create in Supabase Auth

### "relation does not exist"
- Missing SQL execution in Supabase
- Check SQL script execution history

### Permission denied
- RLS policies not configured
- Verify Supabase RLS setup

## Build & Deployment

- Next.js build output: `.next/` directory
- Static assets: `public/` directory
- Environment: Configure production Supabase project
- No CI/CD configuration found

## Important Files to Know

- `src/lib/supabaseClient.ts:1` - Database client configuration
- `src/lib/services/ordenService.ts:29` - Phase validation logic
- `src/app/layout.tsx:1` - Root layout with providers
- `src/components/ThemeProvider.tsx:1` - Theme management
- `scripts/setup-supabase.sql:1` - Database schema initialization

## Performance Considerations

- Supabase queries use efficient indexing
- Dashboard statistics cached/cached queries
- React.memo not widely used (potential optimization opportunity)
- Image optimization via Next.js Image component (not extensively used)

## Security Notes

- Row Level Security (RLS) should be enabled on all Supabase tables
- Service role key only used server-side
- Client-side uses anon key only
- Sensitive operations require user authentication
- No API keys or secrets in client code
