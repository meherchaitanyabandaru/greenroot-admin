# GreenRoot — Admin UI Reference

> Last updated: 2026-07-19

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
| Dashboard | ✅ Live | **Real figures only** from `/api/v1/admin/dashboard` (today's orders/dispatches in IST, active trips, order vs subscription revenue, pending payments, failed logins and app crashes in 24 h, catalog vs botanical names), real 7-day chart, *Needs attention* (approvals, reported ads, crashes, SMS/email mock mode), recent audit activity. The earlier invented numbers, chart and panels were removed. | — |
| Audit | ✅ Live | Read-only audit and security logs with user names; trigger (`INSERT`) and service (`CREATE`) entries shown alike | — |
| Local Market | ✅ Live | `/market`: reported-ads queue (dismiss / take down ad) and published ads | — |
| App Crash Reports | ✅ Live | `/crash-reports`: mobile/web crashes with platform, version, fatal filters and stack trace | — |
| Plants | ✅ Live | **`/plants` lists all 16,57,866 World Flora Online names** (`BotanicalNamesPage`: search ranked by best match, status/rank/catalog filters, family filter from the URL, server paging). A name's drawer shows family/genus/rank, accepted name, synonyms, and its catalog plant (existing `PlantDetailPanel` editor) or **Add to catalog**. **`/plants/categories` lists the 735 plant families** (`PlantFamiliesPage`) with name/accepted/in-catalog counts; a family opens `/plants?family=…`. The old category CRUD page is removed. Plant edit form: scientific-name autocomplete fills `wfo_id`. | Filter for catalog plants that still need a common name |
| Nurseries | ✅ Live | List, CRUD, detail panel (addresses add/edit/delete, team, status actions, edit) | — |
| Inventory | ✅ Live | List, CRUD, **nursery_id + plant_id filter inputs** | — |
| Plant Requests | ✅ Live | Global list, **response matching detail panel** (select/reject per supplier) | — |
| Orders | ✅ Live | List, detail panel, status update, inline item edit/delete, payments, dispatches, **create drawer** | — |
| Payments | ✅ Live | List, manual record (ORDER + **SUBSCRIPTION**), status/provider update | — |
| Subscriptions | ✅ Live | List with subscriber name, nursery and mobile (searchable), plans list, **lifecycle detail panel (renew dialog, cancel dialog, payment history)** | — |
| Vehicles | ✅ Live | List, CRUD, retire, **detail panel (info, tracking history, last known location)** | — |
| Drivers | ✅ Live | List, CRUD, deactivate, **detail panel (location, approve, edit)** | — |
| Dispatches | ✅ Live | List, create, status update, **detail panel (items, tracking, trip UUID)** | — |
| Tracking | ✅ Live | **Live tracking table (IN_TRANSIT dispatches, auto-refresh 30s, vehicle GPS link)** | — |
| Notifications | ✅ Live | List, devices, templates, **detail panel (mark-read, delete), template editor, mark-all-read** | — |
| Attachments | ✅ Live | List, **upload form (presign → PUT → save metadata)** | — |
| Users | ✅ Live | Admin list/search, detail drawer (profile, roles, addresses, sessions) | — |
| Email | ✅ Live | `/email`: go-live checklist, sender (From/Reply-To, domain verified), templates (sandboxed HTML/text live preview, test send), message log. Shares `features/messaging/shared.tsx` with SMS | Bounce/complaint webhooks |
| SMS / DLT | ✅ Live | `/sms`: go-live checklist, Principal Entity, headers, templates (live preview, typed-variable editor, Copy for DLT, test send, approved-text lock), message log | Gateway delivery reports |

---

## Priority Queue

All 7 priority items and all 6 module gap items are now **complete**. See NEXT_WEEK_ACTION_ITEMS.md for full log.

**CI** (`.github/workflows/ci.yml`, on `master` and PRs): `npm ci`, `npm audit --omit=dev --audit-level=high`, lint (errors fail), vitest, type check + build. Dependabot opens weekly npm and monthly Actions updates; PRs use `.github/pull_request_template.md`; `CODEOWNERS` set. Done 2026-10-17: react-router-dom 7.18.4 and vitest 4.1.11 upgrades → `npm audit` 0.

> Use npm ≥ 11 for `npm audit fix` (npm 10.9.2 crashes with `edgesOut`): `npx npm@11.21.0 audit fix`.

**Remaining (pre-production):** Playwright e2e in CI; generated TypeScript client from the OpenAPI spec (Phase 3, A1); branch protection on `master` (owner action). Lint is clean (0 errors, 0 warnings, 2026-10-19).

**UI rules (2026-10-19):** never show invented numbers; show names, not database ids (`user_name`, `owner_name`, `nursery_name` come from the API); statuses go through `StatusChip` (unknown codes render humanized, never raw); enum columns through `toLabel` (keeps acronyms such as UPI, OTP).

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

- **Backend-driven capabilities.** Action buttons (confirm, cancel, renew, etc.) are driven by the `capabilities` object returned in each resource response. Never hardcode role-string checks in the frontend — consume what the API says.
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
- `GET /api/v1/vehicles/:id/tracking[/latest]` — vehicle tracking history (admin only since 2026-10-17)
- `GET /api/v1/drivers/:id/tracking/latest` — driver last location
- `GET /api/v1/dispatches/:id/tracking` — dispatch tracking history
- `POST /api/v1/subscriptions/:id/renew` · `cancel`
- `GET /api/v1/plant-requests/:id/responses`

---

## Known Frontend Bugs Fixed

| Bug | Fix |
|---|---|
| Nursery list shows "—" for names | API returns `name` not `nursery_name`; fixed 4 occurrences in `NurseryApplicationsPage.tsx` |
| UserDetailPanel shows "Admin -" for null `last_name` | `[first_name, last_name].filter(Boolean).join(' ') \|\| '-'` in `UserDetailPanel.tsx` |
