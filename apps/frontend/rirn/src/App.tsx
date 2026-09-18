import { Outlet, Route, Routes, useLocation } from 'react-router';
import { LogOut } from 'lucide-react';
import {
  AppShell,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Toaster,
  TooltipProvider,
} from '@mockups/web-ui';
import { getPageTitle, navigation } from './navigation';
import { DiscoverPage } from './pages/discover';
import { MappingsPage } from './pages/mappings';
import { LoginPage } from './pages/login';
import { QuotaMeter } from './components/quota-meter';
import { logout, useCompanySession } from './lib/company-session';

function Shell() {
  const { pathname } = useLocation();
  const { user } = useCompanySession();
  if (!user) return null;

  return (
    <AppShell
      navigation={navigation}
      title={getPageTitle(pathname)}
      brand={{ alt: 'Qwipo RIRN' }}
      topBarActions={<QuotaMeter />}
      user={{
        name: user.name,
        subtitle: user.company,
        initials: user.initials,
      }}
      userMenu={
        <>
          <DropdownMenuLabel>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs font-normal text-gray-600">
              {user.company} · {user.companyCode}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </>
      }
    >
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  const { user } = useCompanySession();

  return (
    <TooltipProvider>
      {!user ? (
        <LoginPage />
      ) : (
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<DiscoverPage />} />
            <Route path="mappings" element={<MappingsPage />} />
            <Route path="*" element={<DiscoverPage />} />
          </Route>
        </Routes>
      )}
      <Toaster />
    </TooltipProvider>
  );
}
