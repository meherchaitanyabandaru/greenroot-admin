# GreenRoot Admin API Integration Matrix

Source of truth: `../greenroot-api/docs/swagger/openapi.yaml`

This file tracks which Swagger APIs are wired into the admin portal and which APIs need a dedicated admin screen or a backend endpoint before they should be exposed.

Admin list screens prefer public codes such as `USR-000001`, `PLT-000001`, `ORD-20260622-0001`, and `PAY-20260622-0001` for business/support usage. Internal numeric IDs remain available in tables for debugging and existing API route compatibility.

## Status Legend

* Live: integrated in the admin UI.
* Partial: useful APIs exist, but the admin workflow is not complete yet.
* Pending: do not expose as a generic table; build a purpose-specific admin screen first.

## Module Coverage

| Module | Swagger APIs | Admin status | Notes |
| --- | --- | --- | --- |
| Auth | send OTP, verify OTP, refresh token, logout, me | Live | Login, token refresh, session check, and top-bar logout are wired. |
| Admin | dashboard summary | Live | Dashboard cards and charts use `/api/v1/admin/dashboard`. |
| Plants | list, detail, create, update, delete, categories, images, care guide | Partial | Plant list, server-side search, filters, pagination, sorting, create drawer, detail drawer, edit form, soft-delete action, image add, categories display, and care-guide view/edit are wired. Dedicated category management is next. |
| Nurseries | list, detail, create, update, delete, addresses, users | Partial | List, create, detail drawer (addresses, team, edit, delete) are wired. Address create/edit forms are next. |
| Inventory | list, create, detail, update, delete, by nursery, by plant | Partial | Inventory list, server-side search, status filter, pagination, sorting, create/edit drawer, and delete action are wired. Nursery/plant-specific inventory detail views are next. |
| Plant Requests | list, create, detail, update, cancel, responses | Partial | Global request list is wired. Matching/response workflow needs a dedicated screen. |
| Orders | list, create, detail, delete, status, items | Partial | Order list, server-side search, status filter, pagination, sorting, detail drawer, status update, items, related payments, and related dispatches are wired. Create/delete/item edit workflows are next. |
| Payments | list, manual record, detail, status, by order, by subscription | Partial | Payment list, server-side search, type/status/method filters, pagination, sorting, manual payment drawer, and status/provider update drawer are wired. Dedicated subscription payment provider workflow is next. |
| Subscriptions | plans, list, create, detail, status, renew, cancel, payments | Partial | Subscriptions and subscription plans are wired as list screens. Lifecycle actions need forms. |
| Vehicles | list, create, detail, update, retire | Partial | Vehicle list, server-side search, status filter, pagination, sorting, create/edit drawer, duplicate guard, and retire action are wired. Detail workflow is next. |
| Drivers | list, create, detail, update, deactivate, location | Partial | Driver list, server-side search, status filter, pagination, sorting, create/edit drawer, duplicate guard, and deactivate action are wired. Detail and location workflow are next. |
| Dispatches | list, create, detail, status, items, by order | Partial | Dispatch list, server-side search, status filter, pagination, sorting, create drawer, duplicate guard, and status update drawer are wired. Detail/items workflow is next. |
| Tracking | create point, vehicle/driver/dispatch history, latest point | Pending | Requires ID-based lookup and map/timeline UI. No global list endpoint exists. |
| Notifications | list, create, detail, delete, read, devices, templates | Partial | Notifications, devices, and templates are wired as list screens. Create/read/template edit actions are next. |
| Attachments | list, create metadata, detail, delete | Partial | Attachment list is wired. Upload/signing and metadata forms are next. |
| Audit | search audit logs | Live | Audit log table is wired as read-only. |
| Users | admin list/search, me, update me, get by ID, addresses, roles, sessions | Partial | Admin user list/search and detail drawer (profile, roles, addresses, sessions) are wired. |

## Next Recommended Admin Screens

1. ~~User detail drawer: roles, sessions, and addresses.~~ **Done** (`UserDetailPanel`)
2. ~~Nursery detail drawer: addresses, nursery users, status.~~ **Done** (`NurseryDetailPanel`)
3. Plant request matching: request responses and inventory matching screen.
4. Subscription lifecycle forms: renew, cancel actions.
5. Notification actions: create notification, mark-read, template edit.
6. Tracking console: vehicle/driver/dispatch ID lookup with latest point and timeline.
7. Attachment upload: metadata form and S3-ready file upload.
8. Nursery address create/edit forms (nested in NurseryDetailPanel).
