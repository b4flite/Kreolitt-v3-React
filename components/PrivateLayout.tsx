import React, { Suspense, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../services/authService';
import { UserRole } from '../types';
import { Header } from './Header';
import { SidebarLink } from './SidebarLink';
import { LoadingScreen } from './LoadingScreen';
import { 
  HomeIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  MegaphoneIcon,
  PhotoIcon,
  ClipboardDocumentListIcon,
  SquaresPlusIcon
} from '@heroicons/react/24/outline';

interface PrivateLayoutProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const PrivateLayout = ({ children, allowedRoles }: PrivateLayoutProps) => {
  const { user, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Unauthorized
  }

  return (
    <div className="flex flex-col h-screen bg-island-base overflow-hidden font-sans">
      {/* Global Header - Persistent across public and private pages - Hidden on Print */}
      <div className="print:hidden">
        <Header transparent={false} />
      </div>

      <div className="flex flex-1 overflow-hidden relative p-4 gap-4">
        {/* Sidebar - Desktop - Floating Glass Panel Style */}
        <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg rounded-3xl z-10 print:hidden transition-all">
          
          <nav className="flex-1 p-4 pt-6 space-y-2 overflow-y-auto">
            {user.role !== UserRole.CLIENT && (
              <>
                <SidebarLink to="/dashboard" icon={HomeIcon} label="Dashboard" />
                <SidebarLink to="/bookings" icon={CalendarIcon} label="Bookings" />
                <SidebarLink to="/reports" icon={ClipboardDocumentListIcon} label="Reports & Manifests" />
                <SidebarLink to="/finances" icon={CurrencyDollarIcon} label="Finances & Tax" />
                
                {/* Manager & Admin can see Users */}
                {(user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) && (
                  <SidebarLink to="/users" icon={UserGroupIcon} label="User Management" />
                )}

                {/* Content Management - Admin Only (or Manager if desired later) */}
                {user.role === UserRole.ADMIN && (
                  <>
                    <div className="pt-6 pb-2 px-4">
                       <p className="text-[10px] font-bold text-island-muted/60 uppercase tracking-widest font-display">Content</p>
                    </div>
                    <SidebarLink to="/services-cms" icon={SquaresPlusIcon} label="Our Services" />
                    <SidebarLink to="/adverts" icon={MegaphoneIcon} label="Adverts & Offers" />
                    <SidebarLink to="/gallery" icon={PhotoIcon} label="Photo Gallery" />
                  </>
                )}
                
                {/* Only Admin can see Settings */}
                {user.role === UserRole.ADMIN && (
                  <>
                    <div className="pt-6 pb-2 px-4">
                       <p className="text-[10px] font-bold text-island-muted/60 uppercase tracking-widest font-display">System</p>
                    </div>
                    <SidebarLink to="/settings" icon={Cog6ToothIcon} label="Settings" />
                  </>
                )}
              </>
            )}
            {user.role === UserRole.CLIENT && (
               <SidebarLink to="/portal" icon={HomeIcon} label="My Bookings" />
            )}
          </nav>

          <div className="p-4 border-t border-island-sand">
             <div className="mb-4 px-2">
                <p className="text-sm font-bold text-island-navy truncate font-display">{user.name}</p>
                <p className="text-xs text-island-muted capitalize">{user.role.toLowerCase()}</p>
             </div>
             <button 
               onClick={logout}
               className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-island-terra hover:bg-island-terra/10 rounded-xl transition-colors"
             >
               <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
               Sign Out
             </button>
             
             {/* Signature & Version */}
             <div className="mt-4 text-center">
                <p className="text-[9px] text-island-muted/50 font-mono tracking-wider">v2.2.4 &copy; JBVservices</p>
             </div>
          </div>
        </aside>

        {/* Mobile Header & Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative rounded-3xl bg-white shadow-sm border border-island-sand/50 print:border-none print:shadow-none">
          
          {/* Mobile Toolbar for Sidebar Toggle - Hidden on Print */}
          <div className="md:hidden bg-white/90 backdrop-blur-sm border-b border-island-sand p-4 flex justify-between items-center z-20 print:hidden">
             <span className="text-sm font-bold text-island-navy uppercase tracking-widest font-display">
                Menu
             </span>
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -mr-2 rounded-lg hover:bg-island-sand text-island-navy">
               {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
             </button>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute inset-0 bg-white/95 backdrop-blur-xl z-30 pt-6 px-6 flex flex-col animate-in fade-in slide-in-from-top-5">
               <nav className="space-y-2 flex-1 overflow-y-auto pb-8">
                  {user.role !== UserRole.CLIENT && (
                    <>
                      <SidebarLink to="/dashboard" icon={HomeIcon} label="Dashboard" onClick={() => setMobileMenuOpen(false)} />
                      <SidebarLink to="/bookings" icon={CalendarIcon} label="Bookings" onClick={() => setMobileMenuOpen(false)} />
                      <SidebarLink to="/reports" icon={ClipboardDocumentListIcon} label="Reports" onClick={() => setMobileMenuOpen(false)} />
                      <SidebarLink to="/finances" icon={CurrencyDollarIcon} label="Finances" onClick={() => setMobileMenuOpen(false)} />
                      
                      {(user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) && (
                         <SidebarLink to="/users" icon={UserGroupIcon} label="Users" onClick={() => setMobileMenuOpen(false)} />
                      )}
                      
                      {user.role === UserRole.ADMIN && (
                        <>
                          <div className="my-4 border-t border-island-sand"></div>
                          <SidebarLink to="/services-cms" icon={SquaresPlusIcon} label="Our Services" onClick={() => setMobileMenuOpen(false)} />
                          <SidebarLink to="/adverts" icon={MegaphoneIcon} label="Adverts" onClick={() => setMobileMenuOpen(false)} />
                          <SidebarLink to="/gallery" icon={PhotoIcon} label="Gallery" onClick={() => setMobileMenuOpen(false)} />
                          <SidebarLink to="/settings" icon={Cog6ToothIcon} label="Settings" onClick={() => setMobileMenuOpen(false)} />
                        </>
                      )}
                    </>
                  )}
                  {user.role === UserRole.CLIENT && (
                     <SidebarLink to="/portal" icon={HomeIcon} label="My Bookings" onClick={() => setMobileMenuOpen(false)} />
                  )}
                   <div className="my-4 border-t border-island-sand"></div>
                   <button 
                     onClick={() => { logout(); setMobileMenuOpen(false); }}
                     className="flex items-center w-full px-4 py-3 text-island-terra font-medium rounded-xl hover:bg-island-terra/5"
                   >
                     <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                     Sign Out
                   </button>
               </nav>
            </div>
          )}

          {/* Main Content Area - Print width adjustment */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible custom-scrollbar">
            <Suspense fallback={<LoadingScreen />}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
};