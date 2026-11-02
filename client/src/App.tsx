import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { DestinationsPage } from './pages/DestinationsPage';
import { DestinationDetailPage } from './pages/DestinationDetailPage';
import { StaysPage } from './pages/StaysPage';
import { StayDetailPage } from './pages/StayDetailPage';
import { ExperiencesPage } from './pages/ExperiencesPage';
import { ExperienceDetailPage } from './pages/ExperienceDetailPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { HostBookingsPage } from './pages/HostBookingsPage';
import { HostListingsPage } from './pages/HostListingsPage';
import { GuideDashboardPage } from './pages/GuideDashboardPage';
import { AdminVerificationPage } from './pages/AdminVerificationPage';
import { AdminHostAssignmentsPage } from './pages/AdminHostAssignmentsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="destinations" element={<DestinationsPage />} />
          <Route path="destinations/:id" element={<DestinationDetailPage />} />
          <Route path="stays" element={<StaysPage />} />
          <Route path="stays/:id" element={<StayDetailPage />} />
          <Route path="experiences" element={<ExperiencesPage />} />
          <Route path="experiences/:id" element={<ExperienceDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings"
            element={
              <ProtectedRoute allowedRoles={['tourist', 'admin']}>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="host/bookings"
            element={
              <ProtectedRoute allowedRoles={['host', 'admin']}>
                <HostBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="host/listings"
            element={
              <ProtectedRoute allowedRoles={['host', 'admin']}>
                <HostListingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="guide/dashboard"
            element={
              <ProtectedRoute allowedRoles={['guide', 'admin']}>
                <GuideDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/verification"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminVerificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/assignments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminHostAssignmentsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;
