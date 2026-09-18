
import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleDashboard, AuthSpinner } from "../context/AuthContext";

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { sessionState, user } = useAuth();

  if (sessionState === "initializing") {
    return <AuthSpinner />;
  }

  if (sessionState === "authenticated" && user) {
    return <Navigate to={roleDashboard(user.role)} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
