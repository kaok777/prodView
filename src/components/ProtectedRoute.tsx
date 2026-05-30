import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Guards admin routes from unauthorized access
 *
 * Fixed: Admin Session Consistency Bug
 * Now uses reactive auth context instead of direct localStorage reads
 *
 * This ensures admin permissions are consistently recognized across
 * all page navigations, including client-side routing.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
