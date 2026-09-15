/**
 * PublicRoute
 *
 * Gate for routes that are only meant for unauthenticated visitors
 * (landing page, login, register, etc.).
 *
 * Decision table:
 *
 *  sessionState        Result
 *  ──────────────────  ────────────────────────────────────────────────────
 *  "initializing"      Show spinner.  Make NO redirect.
 *  "authenticated"     Redirect to the user's role dashboard.
 *  "unauthenticated"   Render children (the public page).
 *
 * This stops an already-logged-in user from seeing the login page if they
 * navigate back to /auth/* manually or via the browser back button.
 */
import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleDashboard, AuthSpinner } from "../context/AuthContext";

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { sessionState, user } = useAuth();

  // ── Still bootstrapping — never redirect yet ──────────────────────────────
  if (sessionState === "initializing") {
    return <AuthSpinner />;
  }

  // ── Already logged in — go to their dashboard ─────────────────────────────
  if (sessionState === "authenticated" && user) {
    return <Navigate to={roleDashboard(user.role)} replace />;
  }

  // ── Guest — show the public page ──────────────────────────────────────────
  return <>{children}</>;
};

export default PublicRoute;
