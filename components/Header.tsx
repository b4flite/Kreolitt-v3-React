import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/authService';
import { UserRole } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ transparent = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Determine the label and path for the "Manager Section" link
  const getAction = () => {
    if (!user) return { label: 'Login', path: '/login' };
    if (user.role === UserRole.CLIENT) return { label: 'My Bookings', path: '/portal' };
    return { label: 'Dashboard', path: '/dashboard' };
  };

  const action = getAction();
  // Check if we are currently on the home page to potentially styling active states (optional)
  const isHome = location.pathname === '/';

  return (
    <header className={`w-full z-50 transition-all duration-300 ${transparent
      ? 'absolute top-0 left-0 bg-transparent py-6'
      : 'bg-white shadow-sm border-b border-gray-100 py-4 relative'
      }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Left: Logo & Business Name */}
        <Link to="/" className="group">
          <Logo lightText={transparent} className="h-10 md:h-12 transition-transform group-hover:scale-105" />
        </Link>

        {/* Right: Navigation Links */}
        <div className="flex items-center space-x-6 md:space-x-8">
          <Link
            to="/"
            className={`font-medium text-sm md:text-base transition-colors ${transparent ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-sey-blue'
              } ${isHome && transparent ? 'text-white underline' : ''}`}
          >
            Home
          </Link>

          {user?.role === UserRole.CLIENT && (
            <Link
              to="/portal/profile"
              className={`font-medium text-sm md:text-base transition-colors ${transparent ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-sey-blue'
                } ${location.pathname === '/portal/profile' ? 'text-sey-blue font-bold' : ''}`}
            >
              My Profile
            </Link>
          )}

          <Link
            to={action.path}
            className={`px-5 py-2.5 text-sm md:text-base font-semibold rounded-full transition-all duration-300 transform hover:-translate-y-0.5 ${transparent
              ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-sey-blue'
              : 'bg-sey-blue text-white hover:bg-blue-800 shadow-md hover:shadow-lg'
              }`}
          >
            {action.label}
          </Link>

          {user && (
            <button
              onClick={logout}
              className={`text-sm font-medium transition-colors ${transparent ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-sey-red'
                }`}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
};