# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

- Install deps
```bash path=null start=null
npm install
```
- Dev server
```bash path=null start=null
npm run dev
```
- Build / start (prod)
```bash path=null start=null
npm run build
npm start
```
- Lint
```bash path=null start=null
npm run lint
```
- Tests: no test runner configured (there is no `npm test` script).

Note: Both `package-lock.json` and `pnpm-lock.yaml` exist. Prefer npm (per README and scripts) to avoid tool mismatch.

## Big-picture architecture

- Framework: Next.js 15 (App Router) with React 19 and Tailwind CSS v4.
- Entry points: `src/app/page.tsx` (login) and `src/app/paneladmin/page.tsx` (admin). There is also a technician area under `src/app/tecnico/`.
- State/contexts: `src/contexts/` contains `AuthContext`, `NotificationContext`, and `ToastContext` used across admin UI.
- Services/data layer: `src/lib/supabaseClient.ts` centralizes Supabase client; `src/lib/services/` has domain modules (clientes, ordenes, usuarios, accesorios, equipos, modelos, repuestos, estadísticas) that wrap Supabase queries and are consumed by UI components.
- UI composition: `src/components/paneladmin/` holds feature views (e.g., Dashboard/Ordenes/Usuarios/Clientes) and shared UI such as sidebar and modals; subfolder `paneladmin/ordenes` includes reusable selects and modals.
- Types/utilities: `src/types/` (e.g., `database.types.ts`, `notifications.ts`) and `src/utils/` utilities.

Navigation and data flow
- Admin page switches sections via local state and callbacks passed into child components.
- Auth/session from `AuthContext`; notifications/toasts via corresponding contexts and components (e.g., `NotificationBell.tsx`, `ToastContainer.tsx`).
- Service modules are the only place that touch Supabase; UI imports from `src/lib/services/*`.

## Tooling and configs

- Next.js images configured in `next.config.ts` (formats, sizes, qualities).
- TypeScript: strict config with path alias `@/* -> ./src/*` in `tsconfig.json`.
- ESLint: `npm run lint` uses Next.js ESLint setup; no project-local eslint config file present.
- Tailwind v4 via PostCSS (`@tailwindcss/postcss`); global styles in `src/app/globals.css`.

## Environment and setup prerequisites

- Supabase is required. Run the SQL bootstrap at `scripts/setup-supabase.sql` and follow:
  - `README.md` (Inicio Rápido) and `GUIA_VISUAL_SETUP.md` for step-by-step setup.
  - `SUPABASE_SETUP.md` for technical details.
- The app expects Supabase env vars in `.env.local` (see README). Do not commit secrets.

## Helpful routes during dev

- Login: http://localhost:3000/
- Admin: http://localhost:3000/paneladmin
- Technician: http://localhost:3000/tecnico
