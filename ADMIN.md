# GreenRoot — Admin UI Reference

> Last updated: 2026-07-10

---

## What It Is

React + TypeScript admin portal for GreenRoot Product Owner / Super Admin.  
Used for platform operations — **not** for nursery business operations (those are on mobile).

Run locally (port 5173):
```bash
cd greenroot-admin && npm run dev
```
Login: mobile `9000000000` · OTP `123456`

---

## Stack

React 18 · TypeScript · Vite · Material UI · Redux Toolkit · RTK Query · React Hook Form · Zod · TanStack Table · Recharts

### Design Tokens

| Token | Value |
|---|---|
| Primary 900 | `#0B3D1C` |
| Primary 600 | `#1F7A3A` |
| Primary 500 | `#2E8B47` |
| Accent Lime | `#A3D65C` |
| Accent Amber | `#F5B942` |

---

## Commands

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run lint      # Lint
npm run test      # Unit tests
npm run test:e2e  # Playwright E2E tests
npm run format    # Format
```

---

## Module Status

Source of truth for APIs: `greenroot-api/docs/swagger/openapi.yaml`

| Module | Status | What's Done | What's Missing |
|---|---|---|---|
| Auth | ✅ Live | Login, token refresh, logout, me | — |
| Dashboard | ✅ Live | Cards + charts via `/api/v1/admin/dashboard` | — |
| Audit | ✅ Live | Read-only audit log table | — |
| Plants | ✅ Live | List, CRUD, images, care guide, detail panel, **category CRUD page** | — |
| Nurseries | ✅ Live | List, CRUD, detail panel (addresses add/edit/delete, team, status actions, edit) | — |
| Inventory | ✅ Live | List, CRUD, **nursery_id + plant_id filter inputs** | — |
| Plant Requests | ✅ Live | Global list, **response matching detail panel** (select/reject per supplier) | — |
| Orders | ✅ Live | List, detail panel, status update, inline item edit/delete, payments, dispatches, **create drawer** | — |
| Payments | ✅ Live | List, manual record (ORDER + **SUBSCRIPTION**), status/provider update | — |
| Subscriptions | ✅ Live | List, plans list, **lifecycle detail panel (renew dialog, cancel dialog, payment history)** | — |
| Vehicles | ✅ Live | List, CRUD, retire, **detail panel (info, tracking history, last known location)** | — |
| Drivers | ✅ Live | List, CRUD, deactivate, **detail panel (location, approve, edit)** | — |
| Dispatches | ✅ Live | List, create, status update, **detail panel (items, tracking, trip UUID)** | — |
| Tracking | ✅ Live | **Live tracking table (IN_TRANSIT dispatches, auto-refresh 30s, vehicle GPS link)** | — |
| Notifications | ✅ Live | List, devices, templates, **detail panel (mark-read, delete), template editor, mark-all-read** | — |
| Attachments | ✅ Live | List, **upload form (presign → PUT → save metadata)** | — |
| Users | ✅ Live | Admin list/search, detail drawer (profile, roles, addresses, sessions) | — |

---

## Priority Queue

All 7 priority items and all 6 module gap items are now **complete**. See NEXT_WEEK_ACTION_ITEMS.md for full log.

**Remaining (pre-production, not this phase):** See Section 5 in NEXT_WEEK_ACTION_ITEMS.md — rate limiting, CORS review, CI/CD, DB indexes, integration tests.

---

## Key Files

| File | Purpose |
|---|---|
| `src/app/router.tsx` | All routes |
| `src/api/adminResources.ts` | RTK Query endpoints + resource configs |
| `src/features/shared/ResourceListPage.tsx` | **Reference impl** — shared list page used by all modules |
| `src/features/plants/PlantDetailPanel.tsx` | **Reference impl** for new detail panels |
| `src/features/orders/OrderDetailPanel.tsx` | **Reference impl** for nested data panels |

---

## Admin UI Rules

- **Server-side pagination, filtering, sorting, search** on all tables
- **Public codes** (`USR-000001`, `PLT-000001`) shown as primary display identifiers; internal numeric IDs available for debugging
- **No hard-delete** of protected business records (orders, audit logs, completed quotations)
- **Destructive actions** require confirmation dialog + optional mandatory reason
- **API error handling:** `401` → redirect to login; `403` → permission denied; `404` → not found; `500` → safe error message
- **Never expose** raw errors, stack traces, SQL messages, tokens, or secrets
- **Audit logs immutable** — no edit/delete actions on audit screen

---

## API Integration Notes

Endpoints used by admin:
- `GET /api/v1/admin/users` — paginated user list with search
- `GET /api/v1/admin/users/:id` — user detail with roles/sessions/addresses
- `GET /api/v1/nurseries/:id/addresses` — nursery addresses
- `GET /api/v1/nurseries/:id/users` — nursery team
- `GET /api/v1/tracking/vehicle/:id` — vehicle tracking history
- `GET /api/v1/tracking/driver/:id` — driver tracking history
- `GET /api/v1/tracking/dispatch/:id` — dispatch tracking history
- `POST /api/v1/subscriptions/:id/renew` · `cancel`
- `GET /api/v1/plant-requests/:id/responses`

---

## Known Frontend Bugs Fixed

| Bug | Fix |
|---|---|
| Nursery list shows "—" for names | API returns `name` not `nursery_name`; fixed 4 occurrences in `NurseryApplicationsPage.tsx` |
| UserDetailPanel shows "Admin -" for null `last_name` | `[first_name, last_name].filter(Boolean).join(' ') \|\| '-'` in `UserDetailPanel.tsx` |
