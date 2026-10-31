import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingState } from '../components/feedback/LoadingState';
import { AuthLayout } from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../layouts/ProtectedRoute';

const LoginPage = lazy(() =>
  import('../features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const TermsPage = lazy(() =>
  import('../features/legal/TermsPage').then((m) => ({ default: m.TermsPage })),
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ResourceListPage = lazy(() =>
  import('../features/shared/ResourceListPage').then((m) => ({ default: m.ResourceListPage })),
);
const BotanicalNamesPage = lazy(() =>
  import('../features/plants/BotanicalNamesPage').then((m) => ({ default: m.BotanicalNamesPage })),
);
const TopItemsPage = lazy(() =>
  import('../features/topItems/TopItemsPage').then((m) => ({ default: m.TopItemsPage })),
);
const MarketReviewPage = lazy(() =>
  import('../features/market/MarketPage').then((m) => ({ default: m.MarketReviewPage })),
);
const MarketAdsPage = lazy(() =>
  import('../features/market/MarketPage').then((m) => ({ default: m.MarketAdsPage })),
);
const CrashReportsPage = lazy(() =>
  import('../features/crashes/CrashReportsPage').then((m) => ({ default: m.CrashReportsPage })),
);
const PaymentIssuesPage = lazy(() =>
  import('../features/payments/PaymentIssuesPage').then((m) => ({ default: m.PaymentIssuesPage })),
);
const PushStatusPage = lazy(() => import('../features/push/PushStatusPage').then((m) => ({ default: m.PushStatusPage })));
const AssistantUsagePage = lazy(() => import('../features/assistant/AssistantUsagePage').then((m) => ({ default: m.AssistantUsagePage })));
const RetentionPage = lazy(() => import('../features/retention/RetentionPage').then((m) => ({ default: m.RetentionPage })));
const RiskPage = lazy(() => import('../features/risk/RiskPage').then((m) => ({ default: m.RiskPage })));
const ImagePoliciesPage = lazy(() =>
  import('../features/media/ImagePoliciesPage').then((m) => ({ default: m.ImagePoliciesPage })),
);
const VehicleOwnersPage = lazy(() =>
  import('../features/vehicles/VehicleOwners').then((m) => ({ default: m.VehicleOwnersPage })),
);
const VehicleLinksPage = lazy(() =>
  import('../features/vehicles/VehicleLinks').then((m) => ({ default: m.VehicleLinksPage })),
);
const PlantSuggestionsPage = lazy(() =>
  import('../features/plants/PlantSuggestionsPage').then((m) => ({ default: m.PlantSuggestionsPage })),
);
const PlantFamiliesPage = lazy(() =>
  import('../features/plants/PlantFamiliesPage').then((m) => ({ default: m.PlantFamiliesPage })),
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
const SmsPage = lazy(() =>
  import('../features/sms/SmsPage').then((m) => ({ default: m.SmsPage })),
);
const EmailPage = lazy(() =>
  import('../features/email/EmailPage').then((m) => ({ default: m.EmailPage })),
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
        <Route path="/terms" element={<TermsPage />} />
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
            <Route path="/top-items" element={<TopItemsPage />} />

            {/* Master Data */}
            <Route path="/plants" element={<BotanicalNamesPage />} />
            <Route path="/plants/categories" element={<PlantFamiliesPage />} />
            <Route path="/plants/suggestions" element={<PlantSuggestionsPage />} />
            <Route path="/payment-issues" element={<PaymentIssuesPage />} />
            <Route path="/market" element={<Navigate replace to="/market/review" />} />
            <Route path="/market/review" element={<MarketReviewPage />} />
            <Route path="/market/ads" element={<MarketAdsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/crash-reports" element={<CrashReportsPage />} />

            {/* Business Monitoring (read-only for Super Admin) */}
            <Route path="/quotations" element={<ResourceListPage resource="quotations" />} />
            <Route path="/orders" element={<ResourceListPage resource="orders" />} />
            <Route path="/dispatches" element={<ResourceListPage resource="dispatches" />} />
            <Route path="/sourcing-posts" element={<Navigate replace to="/market/ads" />} />
            <Route path="/sourcing-network" element={<ResourceListPage resource="sourcingNetwork" />} />
            <Route path="/notifications" element={<ResourceListPage resource="notifications" />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/notifications/templates" element={<ResourceListPage resource="notificationTemplates" />} />
            <Route path="/sms" element={<SmsPage />} />
            <Route path="/email" element={<EmailPage />} />
            <Route path="/push" element={<PushStatusPage />} />

            {/* Commercial */}
            <Route path="/payments" element={<ResourceListPage resource="payments" />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
            <Route path="/subscription-promos" element={<SubscriptionPromosPage />} />

            {/* Governance */}
            <Route path="/vehicles" element={<ResourceListPage resource="vehicles" />} />
            <Route path="/vehicle-owners" element={<VehicleOwnersPage />} />
            <Route path="/vehicle-links" element={<VehicleLinksPage />} />
            <Route path="/attachments" element={<ResourceListPage resource="attachments" />} />
            <Route path="/image-policies" element={<ImagePoliciesPage />} />
            <Route path="/risk" element={<RiskPage />} />
            <Route path="/data-retention" element={<RetentionPage />} />
            <Route path="/mango-ai" element={<AssistantUsagePage />} />
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
