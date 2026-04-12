# FinOps — Financial Operations Web

Angular client for **multi-tenant financial operations**: authenticate against a Spring Boot API, manage **financial orders** (create, filter, approve/reject), administer **users** (admin only), and view a **dashboard** with order stats and an **FX** sample rate.

**UI language:** English (labels, tables, buttons, and client-side messages).

---

## Prerequisites

- **Node.js** (LTS recommended) and **npm** (see `package.json` for `packageManager`).
- A running **Financial Operations** backend (Spring Boot) — default local URL assumed below.

---

## Quick start

```bash
npm install
npm start
```

Open **http://localhost:4200/**. The dev server uses the **development** build (`environment.development.ts`), which sets `apiUrl` to **`/api`**.

### Backend and proxy

`proxy.conf.json` forwards **`/api`** → **`http://localhost:8080`** and strips the `/api` prefix, so browser calls to `/api/financial-orders` hit `http://localhost:8080/financial-orders`.

1. Start the API on port **8080** (or change `proxy.conf.json`).
2. Run `npm start` (same as `ng serve` with proxy).

**Production builds** use `src/environments/environment.ts` — set `apiUrl` to your real API base (no `/api` rewrite unless your gateway matches that pattern).

---

## NPM scripts

| Command      | Description                                      |
|-------------|---------------------------------------------------|
| `npm start` | Dev server (`ng serve`, development + proxy).    |
| `npm run build` | Production build → `dist/`.                  |
| `npm run watch` | Development build in watch mode.             |
| `npm test`  | Unit tests (**Vitest** via `ng test`).           |

---

## Features

### Authentication

- **Login** (`/auth/login`) and **register** (`/auth/register`) — JWT stored in `sessionStorage`; claims (`sub`, `companyId`, `role`, email) drive the shell and role checks.
- **Auth** and **error** HTTP interceptors attach `Authorization: Bearer …` and redirect to login on **401**.

### Dashboard (`/dashboard`)

- KPI-style cards: total orders, pending, approved, rejected (paged calls per status).
- Sample **FX** rate (e.g. USD → BRL) with fallback error text if the service fails.
- Shortcuts: **View orders**, **Manage users** (admin only).

### Financial orders (`/orders`)

- Collapsible **new order** form (type, amount, description).
- Filter **Pending** / **All**.
- Table with actions for **PENDING** rows:
  - **ADMIN:** **Approve** and **Reject** (stacked buttons; reject uses an optional browser `prompt` for `reason`, sent as JSON to `POST .../reject`).
  - **FINANCE:** helper text *Awaiting approval* (no approve/reject; backend enforces `ROLE_ADMIN` on those endpoints).

### User management (`/users`)

- **ADMIN only** (`authGuard` + `roleGuard` with `roles: ['ADMIN']`).
- Paginated table (email, company name from `companyName` when the API provides it, role, active, delete).
- **Create user** (email, password, role `ADMIN` | `FINANCE`).

### Shell

- Sidebar: **Dashboard**, **Orders**, **Administration → Users** (admin), profile, **Sign out**.
- Collapsible sidebar and responsive top bar; global search field is present but disabled (“coming soon”).

---

## Roles (aligned with backend)

| Role      | Orders (create/list) | Approve / reject | `/users` |
|-----------|----------------------|------------------|----------|
| **ADMIN** | Yes                  | Yes              | Yes      |
| **FINANCE** | Yes                | No (UI + API **403**) | No (redirect) |

---

## Project structure (high level)

```
src/app/
├── core/                 # AuthService, guards, interceptors, shared models
├── features/
│   ├── auth/             # Login & register
│   ├── dashboard/        # Summary + FX
│   ├── financial-orders/ # Orders list & workflow
│   └── users/            # Admin user CRUD
├── app.ts / app.html     # Root shell & layout
├── app.routes.ts         # Lazy-loaded feature routes
└── app.config.ts         # Router, HttpClient + interceptors
```

---

## Tech stack

- **Angular** 21.x (standalone components, lazy routes, SCSS).
- **TypeScript** ~5.9, **RxJS** 7.x.
- **Vitest** for unit tests (`ng test`).
- Styling: global **`src/styles.scss`** (`card`, `data-table`, sidebar, etc.).

---

## Documentation in this repo

| File | Contents |
|------|----------|
| **`FRONTEND_DESIGN_UX.md`** | UX decisions, layout, role-specific copy, orders table behaviour. |
| **`FRONTEND_RENAME.md`** | Technical Angular guide: stack, folders, `AuthService`, guards, approve/reject API details, user list & `companyName`. |

Backend behaviour, JWT claims, and API contracts are described in the **financial-operations-system** repository (`README.md`, `MANUAL_IMPLEMENTACAO.md`).

---

## Further reading

- [Angular CLI](https://angular.dev/tools/cli)
- [Angular docs](https://angular.dev)

---

## Scaffolding (Angular CLI)

```bash
ng generate component component-name
ng generate --help
```

---

*Generated with Angular CLI 21.x; project name: `financial-operations-web`.*
