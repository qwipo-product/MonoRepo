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

// CDS (Cross Dock Store) Management — separate sign-in and role-based screens under /cds (src/pages/cds).
const CdsLoginPage = lazy(() => import('./pages/cds/CdsLoginPage'));
const CdsLayout = lazy(() => import('./pages/cds/CdsLayout'));
const RequireCds = lazy(() => import('./pages/cds/CdsLayout').then((m) => ({ default: m.RequireCds })));
const CdsHome = lazy(() => import('./pages/cds/CdsLayout').then((m) => ({ default: m.CdsHome })));
const CdsByRole = lazy(() => import('./pages/cds/CdsLayout').then((m) => ({ default: m.ByRole })));
const CdsOrders = lazy(() => import('./pages/cds/OrdersPage'));
const CdsOrderDetails = lazy(() => import('./pages/cds/OrdersPage').then((m) => ({ default: m.OrderDetailsPage })));
const CdsPickupPlanning = lazy(() => import('./pages/cds/ScPlanningPages').then((m) => ({ default: m.PickupPlanningPage })));
const CdsCreatePickupPlan = lazy(() => import('./pages/cds/ScPlanningPages').then((m) => ({ default: m.CreatePickupPlanPage })));
const CdsTrips = lazy(() => import('./pages/cds/TripsPage'));
const CdsTripDetails = lazy(() => import('./pages/cds/TripsPage').then((m) => ({ default: m.TripDetailsPage })));
const CdsReports = lazy(() => import('./pages/cds/AdminPages').then((m) => ({ default: m.ReportsPage })));
const CdsSettings = lazy(() => import('./pages/cds/AdminPages').then((m) => ({ default: m.SettingsPage })));
const CdsStores = lazy(() => import('./pages/cds/AdminPages').then((m) => ({ default: m.StoresPage })));
// CDS User: LBNP-style screens with the store's CDS data (src/pages/cds/user).
const CuOrders = lazy(() => import('./pages/cds/user/CuOrdersPage').then((m) => ({ default: m.CuOrdersPage })));
const CuOrderDetails = lazy(() => import('./pages/cds/user/CuOrderDetailsPage').then((m) => ({ default: m.CuOrderDetailsPage })));
const CuDeliveryRoutes = lazy(() => import('./pages/cds/user/CuDeliveryRoutesPage').then((m) => ({ default: m.CuDeliveryRoutesPage })));
const CuCreateRoute = lazy(() => import('./pages/cds/user/CuCreateRoutePage').then((m) => ({ default: m.CuCreateRoutePage })));
const CuRouteDetails = lazy(() => import('./pages/cds/user/CuRouteDetailsPage').then((m) => ({ default: m.CuRouteDetailsPage })));
const CuTrips = lazy(() => import('./pages/cds/user/CuTripsPage').then((m) => ({ default: m.CuTripsPage })));
const CuTripDetails = lazy(() => import('./pages/cds/user/CuTripDetailsPage').then((m) => ({ default: m.CuTripDetailsPage })));
const CuReports = lazy(() => import('./pages/cds/user/CuReportsPage').then((m) => ({ default: m.CuReportsPage })));
const CuCustomers = lazy(() => import('./pages/cds/user/CuCustomersPage').then((m) => ({ default: m.CuCustomersPage })));
const CuSettings = lazy(() => import('./pages/cds/user/CuSettingsPage').then((m) => ({ default: m.CuSettingsPage })));

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
          <Route path="/cds/login" element={<CdsLoginPage />} />
          <Route path="/cds" element={<RequireCds />}>
            <Route element={<CdsLayout />}>
              <Route index element={<CdsHome />} />
              <Route path="orders" element={<RequireCds page={['sc-orders', 'cu-orders']}><CdsByRole sc={<CdsOrders />} cu={<CuOrders />} /></RequireCds>} />
              <Route path="orders/:id" element={<RequireCds page={['sc-orders', 'cu-orders']}><CdsByRole sc={<CdsOrderDetails />} cu={<CuOrderDetails />} /></RequireCds>} />
              <Route path="pickup-planning" element={<RequireCds page={'sc-pickup'}><CdsPickupPlanning /></RequireCds>} />
              <Route path="pickup-planning/create" element={<RequireCds page={'sc-pickup'}><CdsCreatePickupPlan /></RequireCds>} />
              {/* Deliver to CDS is created with each pickup plan; its trips are in Trips › CDS Delivery Trips. */}
              <Route path="deliver-to-cds" element={<Navigate to="/cds/trips?tab=CDS_DELIVERY" replace />} />
              <Route path="trips" element={<RequireCds page={['sc-trips', 'cu-trips']}><CdsByRole sc={<CdsTrips />} cu={<CuTrips />} /></RequireCds>} />
              <Route path="trips/:id" element={<CdsByRole sc={<CdsTripDetails />} cu={<CuTripDetails />} />} />
              <Route path="reports" element={<RequireCds page={['sc-reports', 'cu-reports']}><CdsByRole sc={<CdsReports />} cu={<CuReports />} /></RequireCds>} />
              <Route path="settings" element={<RequireCds page={['sc-settings', 'cu-settings']}><CdsByRole sc={<CdsSettings />} cu={<CuSettings />} /></RequireCds>} />
              <Route path="stores" element={<RequireCds page={'sc-stores'}><CdsStores /></RequireCds>} />
              <Route path="delivery-planning" element={<RequireCds page={'cu-delivery'}><CuDeliveryRoutes /></RequireCds>} />
              <Route path="delivery-planning/create" element={<RequireCds page={'cu-delivery'}><CuCreateRoute /></RequireCds>} />
              <Route path="delivery-planning/:id" element={<RequireCds page={'cu-delivery'}><CuRouteDetails /></RequireCds>} />
              <Route path="customers" element={<RequireCds page={'cu-customers'}><CuCustomers /></RequireCds>} />
              <Route path="*" element={<CdsHome />} />
            </Route>
          </Route>
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
        </Routes>
      </Suspense>
      <MockPanel />
    </>
  );
}
