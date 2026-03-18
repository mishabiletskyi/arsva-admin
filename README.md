# README

## Launch

### Install dependencies

```bash
npm install
```

### Local env

Create `.env` from `.env.example`.

Available variables:

- `VITE_APP_NAME`
- `VITE_API_BASE_URL`
- `VITE_MANAGER_SIGNUP_ENABLED`
- `VITE_MANAGER_SIGNUP_CODE`

### Run dev server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Stack

- `React 19`
- `TypeScript`
- `Vite`
- `MUI`
- `React Router`
- `React Query`
- `Axios`

## Root Files

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `eslint.config.js`
- `.env.example`
- `index.html`

## Root Folders

- `public/`
- `src/`
- `dist/`
- `node_modules/`

## Source Structure

### `src/app`

Application bootstrap and global configuration.

- `providers.tsx` — React Query provider, MUI theme provider, auth provider
- `router.tsx` — route tree
- `theme.ts` — MUI theme

### `src/api`

HTTP layer.

- `client.ts` — Axios client, base URL, bearer token injection
- `auth.api.ts` — auth requests
- `platform.api.ts` — platform requests

### `src/components`

Shared UI.

- `layout/AppLayout.tsx` — sidebar, topbar, outlet shell
- `common/ProtectedRoute.tsx` — auth gate
- `common/PageHeader.tsx` — page header block
- `common/SectionCard.tsx` — shared card wrapper

### `src/features`

Feature pages and feature logic.

- `auth/`
- `dashboard/`
- `organizations/`
- `properties/`
- `tenants/`
- `imports/`
- `call-logs/`
- `call-policy/`
- `outbound-calls/`
- `reports/`
- `admin-users/`

### `src/types`

Shared TypeScript contracts.

- `auth.ts`
- `access.ts`
- `platform.ts`

### `src/utils`

Helpers.

- `storage.ts` — token and scope persistence
- `errors.ts` — API error formatting
- `useClientPagination.ts` — shared client-side pagination hook

## Entry Flow

Application entry:

- `src/main.tsx`

Boot order:

1. React root is created
2. `AppProviders` is mounted
3. `AppRouter` is mounted
4. root error boundary wraps the app

## Providers

Defined in `src/app/providers.tsx`.

Order:

1. `QueryClientProvider`
2. `ThemeProvider`
3. `CssBaseline`
4. `AuthProvider`

## Routing

Defined in `src/app/router.tsx`.

Public route:

- `/login`

Protected routes:

- `/`
- `/organizations`
- `/properties`
- `/tenants`
- `/imports`
- `/call-logs`
- `/call-policy`
- `/outbound-calls`
- `/reports`
- `/admin-users`

## Auth and Scope

Defined in `src/features/auth/AuthContext.tsx`.

Responsibilities:

- login
- register manager
- logout
- fetch current user
- derive auth state
- load organizations
- load properties
- store selected organization
- store selected property
- derive permission flags

Main exposed values:

- `user`
- `isAuthenticated`
- `isLoading`
- `isScopeLoading`
- `isPlatformOwner`
- `organizations`
- `properties`
- `scope`
- `currentOrganization`
- `currentProperty`
- `currentMembership`
- `currentRole`
- `canManageOrganizations`
- `canManageAdminUsers`
- `canEditCurrentScope`

## Browser Storage

Defined in `src/utils/storage.ts`.

Stored values:

- access token
- selected organization id
- selected property id

## API Layer

### Axios client

Defined in `src/api/client.ts`.

Behavior:

- uses `VITE_API_BASE_URL`
- falls back to default base URL if env is missing
- sends JSON by default
- injects `Authorization: Bearer <token>` when token exists

### Auth API

Defined in `src/api/auth.api.ts`.

Used for:

- login
- register manager
- get current user

### Platform API

Defined in `src/api/platform.api.ts`.

Used for:

- organizations
- properties
- tenants
- CSV imports
- call logs
- dashboard tasks
- call policy
- outbound call jobs
- reports
- admin users

## Layout

Defined in `src/components/layout/AppLayout.tsx`.

Contains:

- permanent left sidebar
- top application bar
- organization chip
- role chip
- user menu
- sign out action
- route outlet

## Feature Modules

### Dashboard

File:

- `src/features/dashboard/pages/DashboardPage.tsx`

Contains:

- tenant count
- call log count
- CSV import count
- selected property card
- task board

### Organizations

File:

- `src/features/organizations/pages/OrganizationsPage.tsx`

Contains:

- organization list
- create dialog
- edit dialog

### Properties

File:

- `src/features/properties/pages/PropertiesPage.tsx`

Contains:

- property list
- create dialog
- edit dialog

### Tenants

File:

- `src/features/tenants/pages/TenantsPage.tsx`

Contains:

- tenant list
- property switcher
- include archived toggle
- create dialog
- edit dialog
- archive action
- restore action
- advanced optional fields section

### CSV Imports

File:

- `src/features/imports/pages/ImportsPage.tsx`

Contains:

- CSV upload
- import history
- row-level import errors
- delete import history action

### Call Logs

File:

- `src/features/call-logs/pages/CallLogsPage.tsx`

Contains:

- call log list
- property switcher
- details dialog
- transcript
- recording URL
- raw payload

### Call Policy

File:

- `src/features/call-policy/pages/CallPolicyPage.tsx`

Contains:

- presets
- call limits
- call window
- days late range
- active flag

### Outbound Calls

File:

- `src/features/outbound-calls/pages/OutboundCallsPage.tsx`

Contains:

- tenant selection list
- tenant list sorting by `Tenant`
- tenant list sorting by `Days Late`
- tenant pagination
- outbound job history
- outbound job history pagination
- raw job details dialog

### Reports

File:

- `src/features/reports/pages/ReportsPage.tsx`

Contains:

- export buttons
- date filters

### Admin Users

File:

- `src/features/admin-users/pages/AdminUsersPage.tsx`

Contains:

- admin user list
- create dialog
- edit dialog
- memberships management
- property access management

## Pagination

Shared pagination hook:

- `src/utils/useClientPagination.ts`

Pages using client-side pagination:

- organizations
- properties
- tenants
- CSV imports
- call logs
- admin users
- outbound calls tenant selection
- outbound calls job history

## Permissions

UI behavior depends on:

- authenticated user
- current role
- current organization
- current property

Examples:

- organization management requires platform owner access
- admin user management requires platform owner access
- viewer role is read-only in multiple modules
- some modules require selected property

## Backend Dependencies

Frontend expects backend support for:

- auth login
- current user
- organizations
- properties
- tenants
- archive/restore tenant
- CSV import upload
- CSV import history
- CSV import delete
- call logs
- call policy
- outbound call jobs
- reports
- admin users
- admin memberships
- admin property access

## Current Frontend Assumptions

- selected organization and property drive most data requests
- outbound calls are started manually from selected tenant ids
- call policy rules are backend-driven
- deleting CSV history should not delete imported tenant data

## Files To Review First

Recommended review order:

1. `src/app/router.tsx`
2. `src/features/auth/AuthContext.tsx`
3. `src/api/client.ts`
4. `src/api/platform.api.ts`
5. `src/components/layout/AppLayout.tsx`
6. feature pages in `src/features/`

## Build Output

Production output:

- `dist/`

Build command:

```bash
npm run build
```
