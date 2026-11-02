import React from 'react';
import { Navigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert, ArrowLeft, Mountain } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-forest-200 border-t-forest-700 animate-spin mb-4" />
        <p className="text-forest-900 font-serif text-lg font-medium">Verifying Himalayan Session</p>
        <p className="text-charcoal-500 text-sm mt-1">Connecting with StayLocal security service...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-sand-300 p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-5">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-forest-950 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-charcoal-600 mb-6 leading-relaxed">
            Your account is currently registered with the{' '}
            <span className="font-semibold text-forest-800 uppercase text-xs px-2 py-0.5 rounded bg-sand-200">
              {user.role}
            </span>{' '}
            role. This specific portal area requires{' '}
            <span className="font-semibold text-forest-900">
              {allowedRoles.join(' or ')}
            </span>{' '}
            privileges.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/profile"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-forest-700 text-white hover:bg-forest-800 text-sm font-medium transition-colors"
            >
              <Mountain className="w-4 h-4" />
              Go to My Profile
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-sand-300 bg-sand-50 hover:bg-sand-100 text-charcoal-700 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
