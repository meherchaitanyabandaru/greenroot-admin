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
npm run build     # Build (CI compile check; API URL defaults to localhost)
npm run build:release  # What gets deployed: needs VITE_API_BASE_URL=https://api.<domain>
npm run lint      # Lint
npm run test      # Unit tests
npm run test:e2e  # Playwright E2E tests
npm run format    # Format
```

**Browser tests (`tests/e2e`) need the local API on `localhost:8080` with mock OTP (dev only).** They're not in CI, which has no API. Run them before a release:
- `admin-pages.spec.ts`: signs in and opens all 32 pages; fails on any API 4xx/5xx or page crash.
- `admin-actions.spec.ts`: approves a new nursery application, suspends and reinstates a user, and shows a disputed delivery's confirmation, override reason and reported problem. Each test creates its own accounts through the API and checks the result through the API.

**Production security.** Tokens live in `sessionStorage` (gone with the tab;
admin sessions also expire after 12 h on the API). The dashboard is served by
CloudFront with a strict Content-Security-Policy, HSTS and frame denial
(greenroot-infra `deploy/terraform/cdn.tf`). Admin accounts can be limited to
office/VPN networks with `ADMIN_ALLOWED_CIDRS` on the API.

**Payment Issues** (`/payment-issues`): Razorpay payments the API could not apply
and refunds Razorpay failed. Settle each in the Razorpay dashboard, then resolve
it with a note. An email alarm fires when one appears.

---

## Module Status

Source of truth for APIs: `greenroot-api/docs/swagger/openapi.yaml`

| Module | Status | What's Done | What's Missing |
|---|---|---|---|
| Auth | ✅ Live | Login, token refresh, logout, me | — |
| Dashboard | ✅ Live | **Real figures only** from `/api/v1/admin/dashboard` (today's orders/dispatches in IST, active trips, order vs subscription revenue, pending payments, failed logins and app crashes in 24 h, catalog vs botanical names), real 7-day chart, *Needs attention* (approvals, reported ads, crashes, SMS/email mock mode), recent audit activity. The earlier invented numbers, chart and panels were removed. | — |
| Audit | ✅ Live | Read-only audit and security logs with user names; trigger (`INSERT`) and service (`CREATE`) entries shown alike | — |
| Local Market | ✅ Live | `/market/review`: reports queue (restore / dismiss / remove with strikes). `/market/ads`: every ad in any status (incl. *Deleted by owner*, with who and when), a *No location* filter for ads nearby lists never show, and a review panel with size, pickup point, road / truck access and the ad's map location; hide / restore / remove; unblock nurseries | — |
| App Crash Reports | ✅ Live | `/crash-reports`: mobile/web crashes with platform, version, fatal filters and stack trace | — |
| Plants | ✅ Live | **`/plants` lists all 16,57,866 World Flora Online names** (`BotanicalNamesPage`: search ranked by best match, status/rank/catalog filters, family filter from the URL, server paging). A name's drawer shows family/genus/rank, accepted name, synonyms, and its catalog plant (existing `PlantDetailPanel` editor) or **Add to catalog**. **`/plants/categories` lists the 735 plant families** (`PlantFamiliesPage`) with name/accepted/in-catalog counts; a family opens `/plants?family=…`. The old category CRUD page is removed. Plant edit form: scientific-name autocomplete fills `wfo_id`. | Filter for catalog plants that still need a common name |
| Plant Suggestions | ✅ Live (2026-10-23) | `features/plants/PlantSuggestionsPage.tsx` (`/plants/suggestions`, nav Plants → Suggestions): community suggestions for plants users could not find. Status filter (Pending default). Drawer: **Link** to an existing plant / botanical name (`PlantPicker`), **add as new** with the normal `PlantForm` (pre-filled; then APPROVED), or **Reject** with a reason. The user is notified. Duplicates/known names never reach the queue. | — |
| Nurseries | ✅ Live | List, CRUD, detail panel (addresses add/edit/delete, team, status actions, edit) | — |
| Top Items | ✅ Live (2026-10-19) | `features/topItems/TopItemsPage.tsx`: every nursery's top items (max 20 each, not stock), server-side search + paging (50/page), async nursery search, plant picker (resolves botanical names), add/edit/remove drawer, `n of 20` chip; Nursery → Top Items tab; Plant → Nurseries tab | — |
| Orders | ✅ Live | List, detail panel with each step's time (Pending → Confirmed → Loading → Loaded/Partly loaded → Completed), the one status move the API allows (Mark Confirmed / Mark Completed), loading proof (declaration, photos, truck), inline item edit/delete, payments, dispatches. No create (the API refuses admins); no address edit once completed or cancelled | — |
| Payments | ✅ Live | List, manual record (ORDER + **SUBSCRIPTION**), status/provider update | — |
| Subscriptions | ✅ Live | List with subscriber name, nursery and mobile (searchable), plans list, **lifecycle detail panel (record offline payment with real plan prices, cancel dialog, payment history with Razorpay ids, Razorpay refunds: latest payment, 7 days, reason required)** — see `greenroot-infra/docs/subscriptions.md` §3 | — |
| Vehicles | ✅ Live | List (owner, GreenRoot approval, approved drivers), CRUD with owner picker, retire, **detail panel (info, approve/reject/suspend the lorry, its driver links, tracking history, last known location)** | — |
| Plant Suggestions (`/plants/suggestions`) — extended 2026-10-30 | ✅ Live | Names from suggestions **and quotation requests**; search (typos match), usage count, similar names with "Merge into"; link makes the name a searchable alias; re-link corrects a wrong mapping; history of quotations never changes | — |
| Plant → Other names tab | ✅ Live (2026-10-30) | Aliases (local/common/synonym/trade/misspelling, language, region); add, retire/restore; flags a name used on another plant | — |
| Quotations: customer requests | ✅ Live (2026-10-30) | Status filter Requested / Declined / Cancelled; detail shows the customer's message, deadline, decline reason; custom lines marked "Not in the plant list" (and GreenRoot's later mapping); unpriced lines show — | — |
| Risk Review (`/risk`) | ✅ Live (2026-10-30) | Queue (open first, highest level first; filters), "Check now"; signal drawer with details, every action needs a note (start review, hold/release order, ask partner to verify, resolve, dismiss, confirm fraud — super admin), append-only history; Rules tab (on/off, threshold, level; price outliers stay LOW) | — |
| Orders → Confirmations | ✅ Live (2026-10-30) | Each party's confirmation word for word, who, role, when, evidence count | — |
| Image Policies (`/image-policies`) | ✅ Live (2026-10-30) | Per photo category: longest/shortest side, JPEG quality, max size, formats, compression on/off, with defaults and bounds; super admin edits (reason required, risky changes confirmed, saved as a new version); local preview compresses a sample photo in the browser (nothing uploaded); history per category. Attachments: photos go through `POST /storage/images` (ATTACHMENT), documents still presigned | — |
| Lorry Owners (`/vehicle-owners`) | ✅ Live (2026-10-30) | Owners need no app account; add/edit name, optional mobile, notes; lorry count | — |
| Driver ↔ Lorry Links (`/vehicle-links`) | ✅ Live (2026-10-30) | Review queue (pending first): driver, lorry, licence expiry and approval checks; approve, reject, suspend, reinstate, remove (note required except to approve; removal disabled during a trip); the driver is notified; every decision is in the audit log (module VEHICLES) | — |
| Drivers | ✅ Live | List, CRUD, deactivate, **detail panel (location, approve, edit)** | — |
| Attachment upload limit | ✅ Live (2026-10-23) | `AttachmentUploadForm` sends `size` (API max 20 MB); `attachmentRules.ts` refuses videos/audio, other formats and >20 MB before uploading (photos, PDF, Word, Excel, CSV, text). | — |
| Driver licence photo | ✅ Live (2026-10-23) | `DriverDetailPanel` shows the optional licence photo uploaded at signup (private bucket, link valid 1 h; refetch on focus renews it) or "Not attached". | — |
| Dispatches | ✅ Live | List, status update, **detail panel (trip times: created, driver accepted, left, started, delivered; items, tracking, trip UUID)**. Admins do not create trips (the nursery does, with the trip QR) | — |
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

## Mango AI usage (2026-10-30)

Messaging → **Mango AI** (`/mango-ai`, `features/assistant/`): AI calls and estimated USD by kind (speech to text, answers, read aloud), today and this month, against the global limits, and whether AI is on. It refreshes every minute. **Mango settings** on the same page: on/off switch and questions per person per day (0–50, default 5), via `GET/PUT /api/v1/admin/assistant/settings` (audit-logged). The cost limits stay in API environment variables. API: `GET /api/v1/admin/assistant/usage`. Test: `tests/unit/assistant`.

## Push notification status (2026-10-31)

Messaging → **Push notifications** (`/push`, `features/push/`): configuration and delivery shown apart. Configuration: whether the API loaded a Firebase service account (`FCM_SERVICE_ACCOUNT_JSON`) and its project id; the app's `google-services.json` alone does not let the server send. Delivery: health over the last 24 h (Not configured, No pushes in 24 h, Delivering, Some failing >10%, Failing ≥50%), registered and retired devices, delivered / failed / no-phone counts for 24 h and 7 days, last delivered and last failure. Counts come from `notifications.push_status` (written only by the push sender), not the inbox status. API: `GET /api/v1/notifications/push-status` (admin). Test: `tests/unit/push`.

Quotation detail: a **Type** row (Internal / Customer) and, for an internal draft made into a customer quotation, **Made a Customer Quotation** with when and by whom, read from the quotation's audit log (`quotationConversion.ts`). Test: `tests/unit/quotations`.

## Data retention (2026-10-31)

Logs → **Data Retention** (`/data-retention`, `features/retention/`): every retention rule with its action (delete, mask, report only), period, state (on/off, **legal review hold**, report only), the last dry run (eligible, on hold, size for files), the last execution, the next scheduled run, and a run history. Summary: rules on, legal holds, failed runs in 7 days, accounts deleted in 30 days, deleted accounts awaiting clean-up. Counts only: no names, numbers or record contents.

Any admin can start a dry run (one rule or all); it changes nothing. Only a super admin sees **Change**: period (per-rule minimum), on/off and clearing a legal hold (needs a note saying who confirmed it). Every change needs a reason and is audit-logged. Rules on legal hold and the report-only file rule cannot be switched on (the API and the database refuse). API: `GET /api/v1/admin/retention`, `GET /admin/retention/runs`, `POST /admin/retention/dry-run`, `POST /admin/retention/rules/{code}/dry-run`, `PUT /admin/retention/rules/{code}`. Policy: `greenroot-infra/docs/data-retention.md`. Test: `tests/unit/retention`.
