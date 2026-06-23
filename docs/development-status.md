# GreenRoot Admin — Development Status

## Admin UI Module Coverage

Source of truth for API: `../greenroot-api/docs/swagger/openapi.yaml`  
Detailed API coverage per module: [`api-integration-matrix.md`](api-integration-matrix.md)

---

## Module Status

| Module | API | Admin UI | Status |
|---|---|---|---|
| Auth | ✅ | ✅ Live | Login, refresh, logout, me |
| Dashboard | ✅ | ✅ Live | Cards + charts wired |
| Plants | ✅ | 🔶 Partial | List, CRUD, images, care guide done. **Category management missing** |
| Nurseries | ✅ | 🔶 Partial | List, CRUD, detail drawer done. **Address CRUD missing** |
| Inventory | ✅ | 🔶 Partial | List, CRUD done. **Nursery/plant-specific views missing** |
| Plant Requests | ✅ | 🔶 Partial | List done. **Matching/response workflow missing** |
| Orders | ✅ | 🔶 Partial | List, detail, status, items, payments, dispatches done. **Create/delete/item-edit missing** |
| Payments | ✅ | 🔶 Partial | List, manual record, status update done. **Subscription payment flow missing** |
| Subscriptions | ✅ | 🔶 Partial | List, plans done. **Lifecycle forms (renew/cancel) missing** |
| Vehicles | ✅ | 🔶 Partial | List, CRUD, retire done. **Detail workflow missing** |
| Drivers | ✅ | 🔶 Partial | List, CRUD, deactivate done. **Detail + location missing** |
| Dispatches | ✅ | 🔶 Partial | List, create, status update done. **Detail/items missing** |
| Tracking | ✅ | ❌ Pending | Nothing built — needs map/timeline UI |
| Notifications | ✅ | 🔶 Partial | List, devices, templates done. **Create/read/template-edit missing** |
| Attachments | ✅ | 🔶 Partial | List done. **Upload form missing** |
| Audit | ✅ | ✅ Live | Read-only list |
| Users | ✅ | 🔶 Partial | List, detail drawer (profile, roles, addresses, sessions) done |

---

## Priority Queue (Work On In This Order)

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
   Needs: ID lookup + map/timeline — `GET /api/v1/tracking/vehicle/:id` etc.

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

## Key Files Reference

| File | Purpose |
|---|---|
| `src/app/router.tsx` | All routes |
| `src/api/adminResources.ts` | RTK Query endpoints + resource configs |
| `src/features/shared/ResourceListPage.tsx` | Shared list page — used by all modules |
| `src/features/plants/PlantDetailPanel.tsx` | **Reference impl** for new detail panels |
| `src/features/orders/OrderDetailPanel.tsx` | **Reference impl** for nested data panels |

---

## Admin Login

| Environment | Mobile | OTP |
|---|---|---|
| Local (seeded DB) | `9000000777` | `123456` |
| Integration test DB | `9100000001` | `123456` |
