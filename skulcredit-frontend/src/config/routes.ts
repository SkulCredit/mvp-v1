export class RouteConfig {
  private routes: string[];

  constructor(routes: string[]) {
    this.routes = routes;
  }

  matches(pathname: string): boolean {
    return this.routes.some((route) => {
      if (route === pathname) return true;
      if (route.endsWith("/*")) {
        const base = route.slice(0, -2);
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

export class PublicRoutes extends RouteConfig {
  constructor(extra: string[] = []) {
    super([
      "/",
      "/auth",
      "/auth/parent",
      "/auth/school",
      "/auth/admin",
      "/admin/auth/login",
      "/school/onboarding",
      ...extra,
    ]);
  }
}

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
      "/admin/applications",
      "/admin/applications/*",
      "/admin/disbursements",
      "/admin/disbursements/*",
      "/admin/schools",
      "/admin/schools/*",
      "/admin/repayments",
      "/admin/repayments/*",
      "/admin/risk",
      "/admin/risk/*",
      "/admin/compliance",
      "/admin/compliance/*",
      "/admin/audit",
      "/admin/audit/*",
      "/admin/reports",
      "/admin/reports/*",
      "/admin/analytics",
      "/admin/analytics/*",
      ...extra,
    ]);
  }
}

export const ROLE_ROUTE_PREFIX: Record<string, string> = {
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

export const ROLE_DASHBOARD: Record<string, string> = {
  parent: "/parent/dashboard",
  school: "/school/dashboard",
  admin: "/admin/dashboard",
};

export const publicRoutes = new PublicRoutes();
export const privateRoutes = new PrivateRoutes();
