import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading, userProjects } = useAuth();
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Check if the user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if the user has the required role
  if (allowedRoles && user && !allowedRoles.map(role => role.toLowerCase()).includes(user.role.toLowerCase())) {
    // Redirect contractors to their first project or admins to dashboard based on role
    if (user.role.toLowerCase() === 'contractor') {
      if (userProjects.length > 0) {
        return <Navigate to={`/project/${userProjects[0]}`} replace />;
      } else {
        // If contractor has no projects, redirect to login with message
        return <Navigate to="/login" replace />;
      }
    } else {
      return <Navigate to="/" replace />;
    }
  }
  
  // If all checks pass, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute; 