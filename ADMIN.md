# GreenRoot — Admin UI Reference

> Last updated: 2026-06-28

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
| Plants | 🔶 Partial | List, CRUD, images, care guide, detail panel | **Category management screen** |
| Nurseries | 🔶 Partial | List, CRUD, detail panel (addresses, team, edit, delete) | **Address create/edit forms** |
| Inventory | 🔶 Partial | List, CRUD | **Nursery/plant-specific views** |
| Plant Requests | 🔶 Partial | Global list | **Matching/response workflow** |
| Orders | 🔶 Partial | List, detail panel, status update, items, payments, dispatches | **Create/delete/item-edit** |
| Payments | 🔶 Partial | List, manual record, status/provider update | **Subscription payment provider flow** |
| Subscriptions | 🔶 Partial | List, plans list | **Lifecycle forms (renew/cancel)** |
| Vehicles | 🔶 Partial | List, CRUD, retire | **Detail workflow** |
| Drivers | 🔶 Partial | List, CRUD, deactivate | **Detail + location** |
| Dispatches | 🔶 Partial | List, create, status update | **Detail/items workflow** |
| Tracking | ❌ Pending | Nothing — needs map/timeline UI | Requires ID lookup + map |
| Notifications | 🔶 Partial | List, devices, templates | **Create/read/template-edit** |
| Attachments | 🔶 Partial | List | **Upload form + metadata form** |
| Users | 🔶 Partial | Admin list/search, detail drawer (profile, roles, addresses, sessions) | — |

---

## Priority Queue (Build In This Order)

1. **Plant Request matching screen**  
   Path: `src/features/requests/`  
   Needs: `GET /api/v1/plant-requests/:id/responses` + inventory matching UI

2. **Subscription lifecycle forms**  
   Path: `src/features/subscriptions/`  
   Needs: `POST /api/v1/subscriptions/:id/renew` + cancel form

3. **Notification actions**  
   Path: `src/features/notifications/`  
   Needs: create notification, mark-read, template edit

4. **Tracking console**  
   Path: `src/features/tracking/`  
   Needs: ID lookup + map/timeline via `GET /api/v1/tracking/vehicle/:id` etc.

5. **Attachment upload**  
   Path: `src/features/attachments/`  
   Needs: metadata form + S3-ready file upload

6. **Nursery address CRUD**  
   Path: `src/features/nurseries/NurseryDetailPanel.tsx`  
   Needs: nested address create/edit forms

7. **Plant category management**  
   Path: `src/features/plants/`  
   Needs: dedicated category list/create/edit screen

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
