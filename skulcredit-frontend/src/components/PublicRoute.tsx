import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthSpinner } from "../context/AuthContext";
import { ROLE_DASHBOARD } from "../config/routes";

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { sessionState, user } = useAuth();
  const location = useLocation();

  if (sessionState === "initializing") {
    return <AuthSpinner />;
  }

  if (sessionState === "authenticated" && user) {
    const isAdminPath = location.pathname.startsWith("/admin");
    const dest =
      ROLE_DASHBOARD[user.role] ?? (isAdminPath ? "/admin/dashboard" : "/auth");
    return <Navigate to={dest} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
