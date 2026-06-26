import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user } = useAuth();

  if (!user) {
    // Redirect to login if user session not active
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    // Redirect non-admins to dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
