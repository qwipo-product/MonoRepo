import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { authService } from './api/services/auth.service';
import Layout from './layout/Layout';
import RequireAuth from './routes/RequireAuth';
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

/** Route table mirrors the original exactly (spec 00 §4.1). Unknown URLs render nothing (no wildcard route). */
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
          <Route index element={<Navigate to="/orders" replace />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
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
                <Route path="trips" element={<TripsPage key="trips" />} />
                {/* CDS tab: trips the CDS service center created for orders already confirmed as CDS (never on /trips). */}
                <Route path="cds" element={<Navigate to="/cds/pickup-indents" replace />} />
                <Route path="cds/pickup-indents" element={<TripsPage key="cds-pickups" view="cds-pickups" />} />
                <Route path="cds/credit-notes" element={<TripsPage key="cds-credit-notes" view="cds-credit-notes" />} />
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
        </Routes>
      </Suspense>
      <MockPanel />
    </>
  );
}
