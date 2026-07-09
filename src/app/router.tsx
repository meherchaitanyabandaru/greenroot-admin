import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingState } from '../components/feedback/LoadingState';
import { AuthLayout } from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../layouts/ProtectedRoute';

const LoginPage = lazy(() =>
  import('../features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ResourceListPage = lazy(() =>
  import('../features/shared/ResourceListPage').then((m) => ({ default: m.ResourceListPage })),
);
const CategoryManagementPage = lazy(() =>
  import('../features/plants/CategoryManagementPage').then((m) => ({
    default: m.CategoryManagementPage,
  })),
);
const NurseryApplicationsPage = lazy(() =>
  import('../features/nurseries/NurseryApplicationsPage').then((m) => ({
    default: m.NurseryApplicationsPage,
  })),
);
const TrackingPage = lazy(() =>
  import('../features/tracking/TrackingPage').then((m) => ({ default: m.TrackingPage })),
);
const SubscriptionsPage = lazy(() =>
  import('../features/subscriptions/SubscriptionsPage').then((m) => ({ default: m.SubscriptionsPage })),
);
const SubscriptionPlansPage = lazy(() =>
  import('../features/subscriptions/SubscriptionPlansPage').then((m) => ({ default: m.SubscriptionPlansPage })),
);
const SubscriptionPromosPage = lazy(() =>
  import('../features/subscriptions/SubscriptionPromosPage').then((m) => ({ default: m.SubscriptionPromosPage })),
);
const AuditLogsPage = lazy(() =>
  import('../features/audit/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })),
);
const SecurityLogsPage = lazy(() =>
  import('../features/audit/SecurityLogsPage').then((m) => ({ default: m.SecurityLogsPage })),
);

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingState label="Loading GreenRoot Admin" />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />

            {/* Platform Users */}
            <Route path="/users" element={<ResourceListPage resource="users" />} />
            <Route path="/drivers" element={<ResourceListPage resource="drivers" />} />

            {/* Approvals */}
            <Route path="/nurseries/applications" element={<NurseryApplicationsPage />} />

            {/* Nurseries */}
            <Route path="/nurseries" element={<ResourceListPage resource="nurseries" />} />
            <Route path="/inventory" element={<ResourceListPage resource="inventory" />} />

            {/* Master Data */}
            <Route path="/plants" element={<ResourceListPage resource="plants" />} />
            <Route path="/plants/categories" element={<CategoryManagementPage />} />

            {/* Business Monitoring (read-only for Super Admin) */}
            <Route path="/quotations" element={<ResourceListPage resource="quotations" />} />
            <Route path="/orders" element={<ResourceListPage resource="orders" />} />
            <Route path="/dispatches" element={<ResourceListPage resource="dispatches" />} />
            <Route path="/requests" element={<ResourceListPage resource="requests" />} />
            <Route path="/sourcing-posts" element={<ResourceListPage resource="sourcingPosts" />} />
            <Route path="/sourcing-network" element={<ResourceListPage resource="sourcingNetwork" />} />
            <Route path="/notifications" element={<ResourceListPage resource="notifications" />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/notifications/templates" element={<ResourceListPage resource="notificationTemplates" />} />

            {/* Commercial */}
            <Route path="/payments" element={<ResourceListPage resource="payments" />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
            <Route path="/subscription-promos" element={<SubscriptionPromosPage />} />

            {/* Governance */}
            <Route path="/vehicles" element={<ResourceListPage resource="vehicles" />} />
            <Route path="/attachments" element={<ResourceListPage resource="attachments" />} />
            <Route path="/notifications/devices" element={<ResourceListPage resource="notificationDevices" />} />
            <Route path="/audit" element={<AuditLogsPage />} />
            <Route path="/security-logs" element={<SecurityLogsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Suspense>
  );
}
