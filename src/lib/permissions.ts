/**
 * Permission keys must match backend `requireModuleAccess` / User.permissions[].
 * Managers get a fixed allowlist (see canAccessRoute). Staff use permissions[]. Admin: all.
 */

export type UserRole = 'admin' | 'manager' | 'staff';

export interface AuthUserShape {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole | string;
  permissions?: string[];
}

export const MANAGER_PERMISSION_KEYS = new Set([
  'dashboard',
  'properties',
  'bookings',
  'calendar',
  'amenities',
  'cities',
]);

export const STAFF_PERMISSION_OPTIONS: { key: string; label: string; path: string }[] = [
  { key: 'properties', label: 'Properties', path: '/accommodations' },
  { key: 'gallery', label: 'Gallery', path: '/gallery' },
  { key: 'bookings', label: 'Bookings', path: '/bookings' },
  { key: 'cab_bookings', label: 'Cab Bookings', path: '/cab-bookings' },
  { key: 'cabs', label: 'Cabs', path: '/cabs' },
  { key: 'packages', label: 'Packages', path: '/packages' },
  { key: 'package_bookings', label: 'Package Bookings', path: '/package-bookings' },
  { key: 'calendar', label: 'Calendar', path: '/calendar' },
  { key: 'amenities', label: 'Amenities', path: '/amenities' },
  { key: 'cities', label: 'Cities', path: '/cities' },
  { key: 'ratings', label: 'Ratings', path: '/ratings' },
  { key: 'coupons', label: 'Coupons', path: '/coupons' },
  { key: 'home_promotions', label: 'Exclusive offers (homepage)', path: '/home-promotions' },
  { key: 'blogs', label: 'Blogs', path: '/blogs' },
  { key: 'services', label: 'Services', path: '/services' },
];

export const NAV_ITEMS: {
  name: string;
  path: string;
  permissionKey: string;
}[] = [
  { name: 'Dashboard', path: '/', permissionKey: 'dashboard' },
  { name: 'Properties', path: '/accommodations', permissionKey: 'properties' },
  { name: 'Gallery', path: '/gallery', permissionKey: 'gallery' },
  { name: 'Bookings', path: '/bookings', permissionKey: 'bookings' },
  { name: 'Cab Bookings', path: '/cab-bookings', permissionKey: 'cab_bookings' },
  { name: 'Cabs', path: '/cabs', permissionKey: 'cabs' },
  { name: 'Packages', path: '/packages', permissionKey: 'packages' },
  { name: 'Package Bookings', path: '/package-bookings', permissionKey: 'package_bookings' },
  { name: 'Calendar', path: '/calendar', permissionKey: 'calendar' },
  { name: 'Amenities', path: '/amenities', permissionKey: 'amenities' },
  { name: 'Cities', path: '/cities', permissionKey: 'cities' },
  { name: 'Ratings', path: '/ratings', permissionKey: 'ratings' },
  { name: 'Coupons', path: '/coupons', permissionKey: 'coupons' },
  { name: 'Exclusive offers', path: '/home-promotions', permissionKey: 'home_promotions' },
  { name: 'Blogs', path: '/blogs', permissionKey: 'blogs' },
  { name: 'Services', path: '/services', permissionKey: 'services' },
  { name: 'Users', path: '/users', permissionKey: 'users' },
];

/** Route path pattern -> permission key (longest match wins for nested routes). */
const ROUTE_PERMISSIONS: { prefix: string; key: string }[] = [
  { prefix: '/accommodations', key: 'properties' },
  { prefix: '/gallery', key: 'gallery' },
  { prefix: '/bookings', key: 'bookings' },
  { prefix: '/cab-bookings', key: 'cab_bookings' },
  { prefix: '/cabs', key: 'cabs' },
  { prefix: '/packages', key: 'packages' },
  { prefix: '/package-bookings', key: 'package_bookings' },
  { prefix: '/calendar', key: 'calendar' },
  { prefix: '/amenities', key: 'amenities' },
  { prefix: '/cities', key: 'cities' },
  { prefix: '/ratings', key: 'ratings' },
  { prefix: '/coupons', key: 'coupons' },
  { prefix: '/home-promotions', key: 'home_promotions' },
  { prefix: '/blogs', key: 'blogs' },
  { prefix: '/services', key: 'services' },
  { prefix: '/users', key: 'users' },
];

export function permissionKeyForPath(pathname: string): string {
  const p = pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/';
  if (p === '/') return 'dashboard';
  const hit = ROUTE_PERMISSIONS.find((r) => p === r.prefix || p.startsWith(r.prefix + '/'));
  return hit ? hit.key : 'dashboard';
}

export function canAccessRoute(user: AuthUserShape | null, pathname: string): boolean {
  if (!user) return false;
  const p = pathname.replace(/\/$/, '') || '/';
  if (p === '/no-access') return true;

  const role = (user.role || '').toLowerCase();
  if (role === 'admin') return true;
  const key = permissionKeyForPath(pathname);

  if (role === 'manager') {
    if (key === 'users') return false;
    return MANAGER_PERMISSION_KEYS.has(key);
  }

  if (role === 'staff') {
    if (key === 'dashboard' || key === 'users') return false;
    const perms = user.permissions || [];
    return perms.includes(key);
  }

  return false;
}

export function navItemVisible(user: AuthUserShape | null, permissionKey: string): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  if (role === 'admin') return true;
  if (permissionKey === 'users') return role === 'admin';
  if (role === 'manager') {
    return MANAGER_PERMISSION_KEYS.has(permissionKey);
  }
  if (role === 'staff') {
    if (permissionKey === 'dashboard') return false;
    return (user.permissions || []).includes(permissionKey);
  }
  return false;
}
