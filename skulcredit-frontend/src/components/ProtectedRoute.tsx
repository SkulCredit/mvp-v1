/**
 * ProtectedRoute
 *
 * Gate for every route that requires a logged-in user.
 *
 * Decision table:
 *
 *  sessionState        allowedRoles check   Result
 *  ──────────────────  ───────────────────  ──────────────────────────────────
 *  "initializing"      –                    Show spinner. Make NO redirect.
 *  "authenticated"     role matches         Render children.
 *  "authenticated"     role mismatch        Redirect to user's OWN dashboard.
 *  "unauthenticated"   –                    Redirect to /auth.
 *
 * The "initializing" guard is the primary defence against the
 * "refresh → login" flicker.  ProtectedRoute will never redirect while the
 * bootstrap is still resolving the session.
 *
 * Once sessionState reaches "authenticated" it can ONLY return to
 * "unauthenticated" via an explicit logout() or a confirmed 401/403 from the
 * server.  Transient network failures keep the user in "authenticated".
 */
import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthSpinner, roleDashboard } from "../context/AuthContext";
import { privateRoutes } from "../config/routes";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Lowercase role strings accepted by this route: "parent" | "school" | "admin" */
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { sessionState, user } = useAuth();

  // ── Still bootstrapping — never redirect yet ──────────────────────────────
  if (sessionState === "initializing") {
    return <AuthSpinner />;
  }

  // ── Not authenticated — send to the auth hub ──────────────────────────────
  if (sessionState === "unauthenticated") {
    return <Navigate to="/auth" replace />;
  }

  // ── Authenticated but wrong role — send to own dashboard ──────────────────
  // (prevents a parent from manually typing /admin/dashboard etc.)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleDashboard(user.role)} replace />;
  }

  // ── Authenticated + correct role — render the page ────────────────────────
  return <>{children}</>;
};

export default ProtectedRoute;
