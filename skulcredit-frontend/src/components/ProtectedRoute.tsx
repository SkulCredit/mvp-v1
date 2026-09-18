
import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthSpinner, roleDashboard } from "../context/AuthContext";
import { privateRoutes } from "../config/routes";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { sessionState, user } = useAuth();

  if (sessionState === "initializing") {
    return <AuthSpinner />;
  }

  if (sessionState === "unauthenticated") {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleDashboard(user.role)} replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
