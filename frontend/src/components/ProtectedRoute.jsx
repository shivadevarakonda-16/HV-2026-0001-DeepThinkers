import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
        <p className="mt-2 text-muted">Verifying authentication status...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role) && user?.role !== 'admin') {
    return (
      <div className="container py-5">
        <div className="alert alert-danger shadow-sm">
          <h4 className="alert-heading">Access Denied</h4>
          <p>
            Your account role (<strong>{user?.role}</strong>) does not have permission to access this portal.
          </p>
          <hr />
          <p className="mb-0">
            Please log in with an authorized account (Required: {allowedRoles.join(', ')}).
          </p>
        </div>
      </div>
    );
  }

  return children;
}
