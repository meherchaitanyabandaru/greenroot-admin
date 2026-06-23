import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingState } from '../components/feedback/LoadingState';
import { AuthLayout } from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../layouts/ProtectedRoute';

const LoginPage = lazy(() =>
  import('../features/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const ResourceListPage = lazy(() =>
  import('../features/shared/ResourceListPage').then((module) => ({
    default: module.ResourceListPage,
  })),
);
const CategoryManagementPage = lazy(() =>
  import('../features/plants/CategoryManagementPage').then((module) => ({
    default: module.CategoryManagementPage,
  })),
);
const TrackingPage = lazy(() =>
  import('../features/tracking/TrackingPage').then((module) => ({
    default: module.TrackingPage,
  })),
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
            <Route path="/users" element={<ResourceListPage resource="users" />} />
            <Route path="/plants" element={<ResourceListPage resource="plants" />} />
            <Route path="/plants/categories" element={<CategoryManagementPage />} />
            <Route path="/nurseries" element={<ResourceListPage resource="nurseries" />} />
            <Route path="/inventory" element={<ResourceListPage resource="inventory" />} />
            <Route path="/requests" element={<ResourceListPage resource="requests" />} />
            <Route path="/orders" element={<ResourceListPage resource="orders" />} />
            <Route path="/payments" element={<ResourceListPage resource="payments" />} />
            <Route path="/dispatches" element={<ResourceListPage resource="dispatches" />} />
            <Route path="/vehicles" element={<ResourceListPage resource="vehicles" />} />
            <Route path="/drivers" element={<ResourceListPage resource="drivers" />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/notifications" element={<ResourceListPage resource="notifications" />} />
            <Route path="/notifications/devices" element={<ResourceListPage resource="notificationDevices" />} />
            <Route path="/notifications/templates" element={<ResourceListPage resource="notificationTemplates" />} />
            <Route path="/subscriptions" element={<ResourceListPage resource="subscriptions" />} />
            <Route path="/subscription-plans" element={<ResourceListPage resource="subscriptionPlans" />} />
            <Route path="/attachments" element={<ResourceListPage resource="attachments" />} />
            <Route path="/audit" element={<ResourceListPage resource="audit" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Suspense>
  );
}
