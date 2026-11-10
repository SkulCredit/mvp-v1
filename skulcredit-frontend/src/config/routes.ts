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
      "/auth/staff",
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
      "/cs/*",
      ...extra,
    ]);
  }
}

export const ROLE_ROUTE_PREFIX: Record<string, string> = {
  parent: "/parent",
  school: "/school",
  admin: "/admin",
  super_admin: "/admin",
  customer_service: "/cs",
  customer_service_manager: "/cs",
  accountant: "/finance",
  risk_management: "/cs",
};

export const ROLE_DASHBOARD: Record<string, string> = {
  parent: "/parent/dashboard",
  school: "/school/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
  customer_service: "/cs/dashboard",
  customer_service_manager: "/cs/dashboard",
  accountant: "/finance/dashboard",
  risk_management: "/cs/dashboard",
};

export const publicRoutes = new PublicRoutes();
export const privateRoutes = new PrivateRoutes();
