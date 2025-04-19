import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, Permission } from '@/lib/auth-context';
import { Loader } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: Permission;
}

const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, hasPermission } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1F2C] text-white">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-12 w-12 animate-spin text-purple-600" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check for required permission
  if (requiredPermission) {
    try {
      if (!hasPermission(requiredPermission)) {
        return <Navigate to="/unauthorized" />;
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      return <Navigate to="/login" />;
    }
  }

  // Render the children if authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute; 