/**
 * Route configuration — mirrors the Next.js middleware pattern.
 *
 * Defines which paths are public (no auth required) and which are private
 * (require authentication + specific role).  Used by:
 *
 *  1. The inline pre-React script in index.html  (synchronous, zero-flicker)
 *  2. ProtectedRoute / PublicRoute components    (runtime React layer)
 *  3. AppRouter                                  (declarative route tree)
 */

// ─────────────────────────────────────────────────────────────────────────────
// RouteConfig base class
// ─────────────────────────────────────────────────────────────────────────────

export class RouteConfig {
  private routes: string[];

  constructor(routes: string[]) {
    this.routes = routes;
  }

  /**
   * Returns true when the given pathname matches any registered route.
   * Supports:
   *   "/exact/path"   – exact match
   *   "/prefix/*"     – prefix match (startsWith)
   */
  matches(pathname: string): boolean {
    return this.routes.some((route) => {
      if (route === pathname) return true;
      if (route.endsWith("/*")) {
        const base = route.slice(0, -2); // strip "/*"
        return pathname === base || pathname.startsWith(base + "/");
      }
      return false;
    });
  }

  getRoutes(): string[] {
    return [...this.routes];
  }

  addRoutes(routes: string[]): void {
    this.routes.push(...routes);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public routes — accessible without authentication.
// Authenticated users visiting these are redirected to their dashboard.
// ─────────────────────────────────────────────────────────────────────────────

export class PublicRoutes extends RouteConfig {
  constructor(extra: string[] = []) {
    super([
      "/",               // landing / marketing home
      "/auth",           // role selector
      "/auth/parent",    // parent login + register
      "/auth/school",    // school login + register
      "/auth/admin",     // admin login
      "/school/onboarding", // school registration (no credentials yet)
      ...extra,
    ]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Private routes — require authentication.
// Subdivided by role for cross-role access prevention.
// ─────────────────────────────────────────────────────────────────────────────

export class PrivateRoutes extends RouteConfig {
  constructor(extra: string[] = []) {
    super([
      "/parent/*",
      "/school/dashboard",
      "/school/dashboard/*",
      "/school/applications",
      "/school/applications/*",
      "/school/students",
      "/school/students/*",
      "/school/disbursement",
      "/school/disbursement/*",
      "/school/settings",
      "/school/settings/*",
      "/admin/dashboard",
      "/admin/dashboard/*",
      ...extra,
    ]);
  }
}

// Role-to-route prefix map — used to enforce cross-role access control.
export const ROLE_ROUTE_PREFIX: Record<string, string> = {
  parent: "/parent",
  school: "/school",
  admin:  "/admin",
};

// Role home dashboards.
export const ROLE_DASHBOARD: Record<string, string> = {
  parent: "/parent/dashboard",
  school: "/school/dashboard",
  admin:  "/admin/dashboard",
};

// ─────────────────────────────────────────────────────────────────────────────
// Singleton instances (imported by route guards and the router)
// ─────────────────────────────────────────────────────────────────────────────

export const publicRoutes  = new PublicRoutes();
export const privateRoutes = new PrivateRoutes();
