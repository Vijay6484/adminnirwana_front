import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Building2,
  Image,
  Calendar,
  Ticket,
  FileText,
  Package,
  Users,
  Wifi,
  MapPin,
  Star,
  Car,
  Megaphone,
  Coffee,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NAV_ITEMS, navItemVisible } from '../lib/permissions';

const iconFor = (name: string) => {
  const map: Record<string, React.ReactNode> = {
    Dashboard: <Home size={20} />,
    Properties: <Building2 size={20} />,
    Gallery: <Image size={20} />,
    Bookings: <Calendar size={20} />,
    'Cab Bookings': <Car size={20} />,
    Cabs: <Car size={20} />,
    Packages: <Package size={20} />,
    'Package Bookings': <Package size={20} />,
    Calendar: <Calendar size={20} />,
    Amenities: <Wifi size={20} />,
    Cities: <MapPin size={20} />,
    Ratings: <Star size={20} />,
    Coupons: <Ticket size={20} />,
    'Exclusive offers': <Megaphone size={20} />,
    Blogs: <FileText size={20} />,
    Services: <Coffee size={20} />,
    Users: <Users size={20} />,
  };
  return map[name] || <Home size={20} />;
};

/** Bottom nav: first few items the user can access (same rules as sidebar). */
const MobileNav: React.FC = () => {
  const { user } = useAuth();
  const visibleItems = NAV_ITEMS.filter(
    (item) => user && navItemVisible(user, item.permissionKey)
  ).slice(0, 5);

  if (!user || visibleItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white md:hidden">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}
      >
        {visibleItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 ${
                isActive ? 'text-blue-700' : 'text-gray-500 hover:text-blue-700'
              }`
            }
          >
            <div>{iconFor(item.name)}</div>
            <span className="mt-1 text-xs">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
