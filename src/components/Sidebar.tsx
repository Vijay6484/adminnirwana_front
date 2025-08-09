import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  Image, 
  Coffee, 
  Calendar,
  X,
  LogOut,
  Ticket,
  FileText,
  Grid,
  Users,
  Wifi,
  MapPin,
  Star
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={20} /> },
    { name: 'Properties', path: '/accommodations', icon: <Building2 size={20} /> },
    { name: 'Gallery', path: '/gallery', icon: <Image size={20} /> },
    // { name: 'Services', path: '/services', icon: <Coffee size={20} /> },
    { name: 'Bookings', path: '/bookings', icon: <Calendar size={20} /> },
    { name: 'Calendar', path: '/calendar', icon: <Calendar size={20} /> },
    { name: 'Amenities', path: '/amenities', icon: <Wifi size={20} /> },
    { name: 'Cities', path: '/cities', icon: <MapPin size={20} /> },
    { name: 'Ratings', path: '/ratings', icon: <Star size={20} /> },
    { name: 'Coupons', path: '/coupons', icon: <Ticket size={20} /> },
    { name: 'Blogs', path: '/blogs', icon: <FileText size={20} /> },
    { name: 'Categories', path: '/categories', icon: <Grid size={20} /> },
    { name: 'Users', path: '/users', icon: <Users size={20} /> },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gradient-to-b from-nature-800 to-nature-900 text-white transition duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-5">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-amber-400" />
              <span className="text-xl font-bold">Resort Admin</span>
            </div>
            <button onClick={closeSidebar} className="md:hidden">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-nature-700 text-white shadow-lg'
                      : 'text-nature-100 hover:bg-nature-700 hover:text-white'
                  }`
                }
              >
                <div className="mr-3 flex-shrink-0">{item.icon}</div>
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t border-nature-700 p-4">
            <button className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-nature-100 hover:bg-nature-700 hover:text-white">
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