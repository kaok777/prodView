import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('accessToken');
  const adminSession = localStorage.getItem('adminSession');

  if (!token || !adminSession) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
