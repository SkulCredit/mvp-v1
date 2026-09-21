import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthSpinner, roleDashboard } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { sessionState, user } = useAuth();
  const location = useLocation();

  if (sessionState === "initializing") {
    return <AuthSpinner />;
  }

  if (sessionState === "unauthenticated") {
    // Admin routes → admin login page; everything else → generic /auth
    const isAdminRoute = location.pathname.startsWith("/admin");
    const loginPath = isAdminRoute
      ? `/admin/auth/login?next=${encodeURIComponent(location.pathname)}`
      : "/auth";
    return <Navigate to={loginPath} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleDashboard(user.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
