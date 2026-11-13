import { lazy, Suspense, useEffect, type ReactElement } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { authService } from './api/services/auth.service';
import Layout from './layout/Layout';
import RequireAuth, { HomeRedirect, RequireProfile } from './routes/RequireAuth';
import { PHASE1_PAGES } from './pages/cross-dock/phase1Pages';
import DataLoading from './components/DataLoading';
import MockPanel from './components/MockPanel';
import LoginPage from './pages/auth/LoginPage';
import OtpPage from './pages/auth/OtpPage';
import RegisterPage from './pages/auth/RegisterPage';
import { PrivacyPolicyPage, TermsOfServicePage } from './pages/auth/LegalPages';

const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'));
const OrderDetailsPage = lazy(() => import('./pages/orders/OrderDetailsPage'));
const CreateOrderPage = lazy(() => import('./pages/create-order/CreateOrderPage'));
const SingleOrderPage = lazy(() => import('./pages/create-order/SingleOrderPage'));
const CustomerMasterPage = lazy(() => import('./pages/customer-master/CustomerMasterPage'));
const DeliveryRoutesPage = lazy(() => import('./pages/delivery-routes/DeliveryRoutesPage'));
const CreateDeliveryRoutePage = lazy(() => import('./pages/delivery-routes/CreateDeliveryRoutePage'));
const DeliveryRouteDetailsPage = lazy(() => import('./pages/delivery-routes/DeliveryRouteDetailsPage'));
const CustomerOrdersPage = lazy(() => import('./pages/delivery-routes/CustomerOrdersPage'));
const TripsPage = lazy(() => import('./pages/trips/TripsPage'));
const TripDetailsPage = lazy(() => import('./pages/trips/TripDetailsPage'));
const TripOrderDetailsPage = lazy(() => import('./pages/trips/TripOrderDetailsPage'));
const IssuesPage = lazy(() => import('./pages/issues/IssuesPage'));
const IssueDetailsPage = lazy(() => import('./pages/issues/IssueDetailsPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage'));
const StoreSettingsPage = lazy(() => import('./pages/settings/StoreSettingsPage'));
const AddressesPage = lazy(() => import('./pages/settings/AddressesPage'));
const DeliverySettingsPage = lazy(() => import('./pages/settings/DeliverySettingsPage'));
const BeatsPage = lazy(() => import('./pages/settings/BeatsPage'));
const ClustersPage = lazy(() => import('./pages/settings/ClustersPage'));
const ClusterEditorPage = lazy(() => import('./pages/settings/ClusterEditorPage'));
const PaymentSettingsPage = lazy(() => import('./pages/settings/PaymentSettingsPage'));
const UsersPermissionsPage = lazy(() => import('./pages/settings/UsersPermissionsPage'));
const CategorySequencePage = lazy(() => import('./pages/settings/CategorySequencePage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const SseTestPage = lazy(() => import('./pages/SseTestPage'));
const Phase1Placeholder = lazy(() => import('./pages/cross-dock/Phase1Placeholder'));
const ScOrdersPage = lazy(() => import('./pages/service-centre/ScOrdersPage'));
const PlanningListPage = lazy(() => import('./pages/cross-dock/planning/PlanningListPage'));
const CreateRoutePage = lazy(() => import('./pages/cross-dock/planning/CreateRoutePage'));
const RouteDetailsPage = lazy(() => import('./pages/cross-dock/planning/RouteDetailsPage'));
const ScTripsPage = lazy(() => import('./pages/service-centre/ScTripsPage'));
const ScTripDetailsPage = lazy(() => import('./pages/service-centre/ScTripDetailsPage'));
const CdsNetworkPage = lazy(() => import('./pages/service-centre/CdsNetworkPage'));
const ScReportsPage = lazy(() => import('./pages/service-centre/ScReportsPage'));
const ScSettingsPage = lazy(() => import('./pages/service-centre/ScSettingsPage'));
const InwardPage = lazy(() => import('./pages/cross-dock-store/InwardPage'));
const StoreOrdersPage = lazy(() => import('./pages/cross-dock-store/StoreOrdersPage'));
const GrnPage = lazy(() => import('./pages/cross-dock-store/GrnPage'));
const StoreTripsPage = lazy(() => import('./pages/cross-dock-store/StoreTripsPage'));
const RunDetailsPage = lazy(() => import('./pages/cross-dock-store/RunDetailsPage'));
const StoreReturnsPage = lazy(() => import('./pages/cross-dock-store/StoreReturnsPage'));
const CashPage = lazy(() => import('./pages/cross-dock-store/CashPage'));
const StoreReportsPage = lazy(() => import('./pages/cross-dock-store/StoreReportsPage'));
const CdsSettingsPage = lazy(() => import('./pages/cross-dock-store/StoreSettingsPage'));

/** Cross-dock pages that are built; every other menu entry still shows its phase 1 placeholder. */
const BUILT: Record<string, ReactElement> = {
  '/service-centre/orders': <ScOrdersPage />,
  '/service-centre/pickup-planning': <PlanningListPage mode="pickup" />,
  '/service-centre/return-planning': <PlanningListPage mode="return" />,
  '/service-centre/trips': <ScTripsPage />,
  '/service-centre/network': <CdsNetworkPage />,
  '/service-centre/reports': <ScReportsPage />,
  '/service-centre/settings': <ScSettingsPage />,
  '/cross-dock/inward': <InwardPage />,
  '/cross-dock/orders': <StoreOrdersPage />,
  '/cross-dock/delivery-planning': <PlanningListPage mode="delivery" />,
  '/cross-dock/trips': <StoreTripsPage />,
  '/cross-dock/returns': <StoreReturnsPage />,
  '/cross-dock/cash': <CashPage />,
  '/cross-dock/reports': <StoreReportsPage />,
  '/cross-dock/settings': <CdsSettingsPage />,
};

const crossDockRoutes = (profile: 'SERVICE_CENTRE' | 'CROSS_DOCK_STORE') =>
  PHASE1_PAGES.filter((p) => p.profile === profile).map((p) => (
    <Route key={p.path} path={p.path.slice(1)} element={BUILT[p.path] ?? <Phase1Placeholder page={p} />} />
  ));

/**
 * The original route table (spec 00 §4.1) is kept as-is for the Logistics Tech user. The two cross-dock users get
 * their own routes; each user is kept inside their own pages. Unknown URLs render nothing (no wildcard route).
 */
export default function App() {
  const navigate = useNavigate();
  useEffect(() => {
    authService.navigate = (p) => navigate(p);
  }, [navigate]);

  return (
    <>
      <Suspense fallback={<DataLoading />}>
        <Routes>
          <Route path="/auth">
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="otp" element={<OtpPage />} />
            <Route path="terms-of-service" element={<TermsOfServicePage />} />
            <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
          </Route>
          <Route index element={<HomeRedirect />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route element={<RequireProfile profile="SERVICE_CENTRE" />}>
                {crossDockRoutes('SERVICE_CENTRE')}
                <Route path="service-centre/trips/:id" element={<ScTripDetailsPage />} />
                <Route path="service-centre/pickup-planning/create" element={<CreateRoutePage key="pickup" mode="pickup" />} />
                <Route path="service-centre/pickup-planning/:id" element={<RouteDetailsPage key="pickup" mode="pickup" />} />
                <Route path="service-centre/return-planning/create" element={<CreateRoutePage key="return" mode="return" />} />
                <Route path="service-centre/return-planning/:id" element={<RouteDetailsPage key="return" mode="return" />} />
              </Route>
              <Route element={<RequireProfile profile="CROSS_DOCK_STORE" />}>
                {crossDockRoutes('CROSS_DOCK_STORE')}
                <Route path="cross-dock/trips/:id" element={<RunDetailsPage />} />
                <Route path="cross-dock/inward/:tripId" element={<GrnPage />} />
                <Route path="cross-dock/delivery-planning/create" element={<CreateRoutePage key="delivery" mode="delivery" />} />
                <Route path="cross-dock/delivery-planning/:id" element={<RouteDetailsPage key="delivery" mode="delivery" />} />
              </Route>
              <Route element={<RequireProfile profile="LOGISTICS_TECH" />}>
                <Route element={<RequireAuth requiredPage="orders" />}>
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="order-details" element={<OrderDetailsPage />} />
                  <Route path="create-order" element={<CreateOrderPage />} />
                  <Route path="create-single-order" element={<SingleOrderPage />} />
                </Route>
                <Route element={<RequireAuth requiredPage="delivery-routes" />}>
                  <Route path="delivery-routes" element={<DeliveryRoutesPage />} />
                  <Route path="delivery-routes/create" element={<CreateDeliveryRoutePage />} />
                  <Route path="delivery-route-details" element={<DeliveryRouteDetailsPage />} />
                  <Route path="customer-orders" element={<CustomerOrdersPage />} />
                </Route>
                <Route path="sse-test" element={<SseTestPage />} />
                <Route element={<RequireAuth requiredPage="trips" />}>
                  <Route path="trips" element={<TripsPage />} />
                  <Route path="trip-details/:id" element={<TripDetailsPage />} />
                  <Route path="trip-order-details/:tripId" element={<TripOrderDetailsPage />} />
                </Route>
                <Route element={<RequireAuth requiredPage="settings" />}>
                  <Route path="settings" element={<SettingsPage />}>
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="store" element={<StoreSettingsPage />} />
                    <Route path="addresses" element={<AddressesPage />} />
                    <Route path="delivery" element={<DeliverySettingsPage />} />
                    <Route path="beats" element={<BeatsPage />} />
                    <Route path="clusters" element={<ClustersPage />} />
                    <Route path="clusters/new" element={<ClusterEditorPage />} />
                    <Route path="clusters/:id/edit" element={<ClusterEditorPage />} />
                    <Route path="payment" element={<PaymentSettingsPage />} />
                    <Route path="users" element={<UsersPermissionsPage />} />
                    <Route path="category-sequence" element={<CategorySequencePage />} />
                  </Route>
                </Route>
                <Route path="issues" element={<IssuesPage />} />
                <Route path="issues/details/:id" element={<IssueDetailsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="customer-master" element={<CustomerMasterPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
      <MockPanel />
    </>
  );
}
