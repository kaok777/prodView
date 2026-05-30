import { Navigate } from "react-router-dom";
import { StorageService, StorageKeys } from "../services/StorageService";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const adminSession = StorageService.get<string>(StorageKeys.ADMIN_SESSION);

  if (!adminSession) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
