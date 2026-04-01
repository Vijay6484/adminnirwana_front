import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccessRoute, NAV_ITEMS } from '../lib/permissions';

interface AccessRouteProps {
  children: React.ReactNode;
}

function firstAllowedPath(role: string, permissions: string[] | undefined): string {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'manager') return '/';
  if (r === 'staff') {
    const perms = permissions || [];
    const item = NAV_ITEMS.find(
      (n) => n.permissionKey !== 'dashboard' && n.permissionKey !== 'users' && perms.includes(n.permissionKey)
    );
    return item?.path || '/no-access';
  }
  return '/';
}

const AccessRoute: React.FC<AccessRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return null;
  }

  if (location.pathname === '/no-access') {
    return <>{children}</>;
  }

  if (!canAccessRoute(user, location.pathname)) {
    const fallback = firstAllowedPath(user.role, user.permissions);
    if (location.pathname !== fallback) {
      return <Navigate to={fallback} replace />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">You do not have access to this page.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AccessRoute;
