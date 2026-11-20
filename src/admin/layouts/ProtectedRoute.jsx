import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/admin/context/AuthContext";
import FullScreenSpinner from "@/shared/components/FullScreenSpinner";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
