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
    // Admin routes → admin login page; everything else → /auth
    // Preserve the intended destination so login can redirect back
    const isAdminRoute = location.pathname.startsWith("/admin");
    const isSchoolRoute =
      location.pathname.startsWith("/school") ||
      location.pathname.startsWith("/funding-partner");
    const nextParam = `?next=${encodeURIComponent(location.pathname + location.search)}`;
    const loginPath = isAdminRoute
      ? `/admin/auth/login${nextParam}`
      : isSchoolRoute
        ? `/auth/school${nextParam}`
        : "/auth";
    return <Navigate to={loginPath} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleDashboard(user.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
