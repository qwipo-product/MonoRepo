import { Navigate, Route, Routes } from 'react-router';

import { AuthProvider } from './lib/auth-context';
import Login from './screens/Login';
import DashboardLayout from './layouts/DashboardLayout';
import PromotionsList from './screens/promotions/PromotionsList';
import BasicsStep from './screens/promotions/create/BasicsStep';
import DetailsStep from './screens/promotions/create/DetailsStep';
import SurfaceStep from './screens/promotions/create/SurfaceStep';
import PublishStep from './screens/promotions/create/PublishStep';
import NotificationsList from './screens/notifications/NotificationsList';
import NotificationCreate from './screens/notifications/NotificationCreate';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/promotions" replace />} />
          <Route path="/promotions" element={<PromotionsList />} />
          <Route path="/promotions/create" element={<BasicsStep />} />
          <Route path="/promotions/create/details" element={<DetailsStep />} />
          <Route path="/promotions/create/surface" element={<SurfaceStep />} />
          <Route path="/promotions/create/publish" element={<PublishStep />} />
          <Route path="/notifications" element={<NotificationsList />} />
          <Route path="/notifications/create" element={<NotificationCreate />} />
        </Route>
        <Route path="*" element={<Navigate to="/promotions" replace />} />
      </Routes>
    </AuthProvider>
  );
}
