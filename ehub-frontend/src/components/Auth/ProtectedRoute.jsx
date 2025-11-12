import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // If we have user data from localStorage, don't show loading spinner
  const hasCachedUser = localStorage.getItem('user');

  // Show loading only if we don't have cached user data and we're still verifying
  if (loading && !hasCachedUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If we have cached user data, show the content immediately
  // Even if we're still verifying in the background
  if (hasCachedUser && !isAuthenticated && loading) {
    // Allow access while we verify in the background
    // The axios interceptor will handle actual auth errors
  } else if (!isAuthenticated && !hasCachedUser) {
    // No cached data and not authenticated, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;