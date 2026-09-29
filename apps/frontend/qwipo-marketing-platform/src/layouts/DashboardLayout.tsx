import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { Megaphone, Bell, LogOut } from 'lucide-react';
import { AppShell, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@mockups/web-ui';
import type { NavItem } from '@mockups/web-ui';

import { useAuth } from '../lib/auth-context';

const NAV: NavItem[] = [
  { name: 'Promotions', href: '/promotions', icon: Megaphone },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const title = NAV.find((item) => item.href && location.pathname.startsWith(item.href))?.name ?? 'Qwipo Marketing Platform';

  return (
    <AppShell
      navigation={NAV}
      title={title}
      user={{ name: user.name, subtitle: user.subtitle, initials: user.avatarInitials }}
      userMenu={
        <>
          <DropdownMenuLabel>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs font-normal text-gray-600">{user.subtitle}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-red-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </>
      }
    >
      <Outlet />
    </AppShell>
  );
}
