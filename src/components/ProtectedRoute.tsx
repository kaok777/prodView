import { Navigate } from "react-router-dom";
import { StorageService, StorageKeys } from "../services/StorageService";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = StorageService.get<string>(StorageKeys.ACCESS_TOKEN);
  const adminSession = StorageService.get<string>(StorageKeys.ADMIN_SESSION);

  if (!token || !adminSession) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
