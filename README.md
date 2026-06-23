# GreenRoot Admin

React + TypeScript admin portal for GreenRoot platform operators.

## Run Locally

```bash
npm install
cp .env.example .env
npm run dev
```

Portal: `http://localhost:5173`  
Login: mobile `9000000777` · OTP `123456`

## Commands

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run lint      # Lint
npm run test      # Unit tests
npm run test:e2e  # Playwright E2E tests
npm run format    # Format
```

## Stack

React 18 · TypeScript · Vite · Material UI · Redux Toolkit · RTK Query · React Hook Form · Zod · TanStack Table · Recharts

## Design System

| Token | Value |
|---|---|
| Primary 900 | `#0B3D1C` |
| Primary 600 | `#1F7A3A` |
| Primary 500 | `#2E8B47` |
| Accent Lime | `#A3D65C` |
| Accent Amber | `#F5B942` |

## Documentation

| Doc | Contents |
|---|---|
| [`docs/development-status.md`](docs/development-status.md) | Module status, priority queue, key files |
| [`docs/api-integration-matrix.md`](docs/api-integration-matrix.md) | Detailed API-to-UI coverage per module |

## Backend Contract

API spec: `../greenroot-api/docs/swagger/openapi.yaml`  
RBAC policy: `../greenroot-api/docs/rbac-matrix.md`

## Full Project Context

See [`../AI_CONTEXT.md`](../AI_CONTEXT.md) for cross-repo master context.
