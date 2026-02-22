import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon: Icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group overflow-hidden ${
        isActive 
          ? 'bg-sey-blue text-white shadow-lg shadow-sey-blue/20' 
          : 'text-island-muted hover:bg-island-sand hover:text-island-navy'
      }`}
    >
      {/* Active Indicator Glow */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 rounded-full"></div>
      )}
      
      <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-island-muted group-hover:text-island-navy'}`} />
      <span className={`font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>{label}</span>
    </Link>
  );
};