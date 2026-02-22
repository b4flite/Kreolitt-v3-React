import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole } from './types';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { PrivateLayout } from './components/PrivateLayout';

// Lazy Loaded Pages for Performance Optimization
const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const UpdatePasswordPage = React.lazy(() => import('./pages/UpdatePasswordPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const BookingsList = React.lazy(() => import('./pages/BookingsList'));
const FinancePage = React.lazy(() => import('./pages/FinancePage'));
const ClientPortal = React.lazy(() => import('./pages/ClientPortal'));
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const AdvertsPage = React.lazy(() => import('./pages/AdvertsPage'));
const GalleryPage = React.lazy(() => import('./pages/GalleryPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const ServicesCMSPage = React.lazy(() => import('./pages/ServicesCMSPage'));

const App: React.FC = () => {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />

            {/* Private Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateLayout allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                  <Dashboard />
                </PrivateLayout>
              }
            />
            <Route
              path="/bookings"
              element={
                <PrivateLayout allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                  <BookingsList />
                </PrivateLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateLayout allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                  <ReportsPage />
                </PrivateLayout>
              }
            />
            <Route
              path="/finances"
              element={
                <PrivateLayout allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                  <FinancePage />
                </PrivateLayout>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateLayout allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                  <UsersPage />
                </PrivateLayout>
              }
            />
            
            {/* Content Modules - Admin Only */}
            <Route
              path="/services-cms"
              element={
                <PrivateLayout allowedRoles={[UserRole.ADMIN]}>
                  <ServicesCMSPage />
                </PrivateLayout>
              }
            />
            <Route
              path="/adverts"
              element={
                <PrivateLayout allowedRoles={[UserRole.ADMIN]}>
                  <AdvertsPage />
                </PrivateLayout>
              }
            />
            <Route
              path="/gallery"
              element={
                <PrivateLayout allowedRoles={[UserRole.ADMIN]}>
                  <GalleryPage />
                </PrivateLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateLayout allowedRoles={[UserRole.ADMIN]}>
                  <SettingsPage />
                </PrivateLayout>
              }
            />

            <Route
              path="/portal"
              element={
                <PrivateLayout allowedRoles={[UserRole.CLIENT]}>
                  <ClientPortal />
                </PrivateLayout>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Toaster position="top-right" />
    </HashRouter>
  );
};

export default App;