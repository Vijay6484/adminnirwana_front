import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Building2, Image, Calendar, X, LogOut, Ticket, FileText,
  Users, Wifi, MapPin, Star, Car, Package, Megaphone, Coffee,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NAV_ITEMS, navItemVisible } from '../lib/permissions';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

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

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((item) => user && navItemVisible(user, item.permissionKey));

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gradient-to-b from-nature-800 to-nature-900 text-white transition duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-5">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-amber-400" />
              <span className="text-xl font-bold">Oraastays Admin</span>
            </div>
            <button onClick={closeSidebar} className="md:hidden">
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            {visibleItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `group flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive
                    ? 'bg-nature-700 text-white shadow-lg'
                    : 'text-nature-100 hover:bg-nature-700 hover:text-white'
                  }`
                }
              >
                <div className="mr-3 flex-shrink-0">{iconFor(item.name)}</div>
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-nature-700 p-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-nature-100 hover:bg-nature-700 hover:text-white"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
