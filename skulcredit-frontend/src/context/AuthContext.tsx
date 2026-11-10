import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Navigate } from "react-router-dom";
import { AxiosError } from "axios";
import apiClient from "../services/apiClient";
import authService, {
  AuthUser as ServiceAuthUser,
} from "../services/authService";
import { tokenStorage, userStorage } from "../services/api";
import { ROLE_DASHBOARD } from "../config/routes";

export interface AuthUser {
  id: string;
  email: string;
  role:
    | "parent"
    | "school"
    | "admin"
    | "super_admin"
    | "customer_service"
    | "customer_service_manager"
    | "accountant"
    | "risk_management";
  name?: string;
  firstName?: string;
  lastName?: string;
  schoolName?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  phoneNumber?: string | null;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
  profilePhotoUrl?: string | null;
}

export type SessionState = "initializing" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  sessionState: SessionState;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    expectedRole?: string,
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
  register: (
    userData: Record<string, unknown>,
    role?: string,
  ) => Promise<AuthUser>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

function enrichUser(raw: ServiceAuthUser): AuthUser {
  const firstName = raw.profile?.firstName ?? raw.firstName;
  const lastName = raw.profile?.lastName ?? raw.lastName;
  return {
    id: raw.id,
    email: raw.email,
    role: (raw.role as string).toLowerCase() as AuthUser["role"],
    firstName,
    lastName,
    schoolName: (raw as { schoolName?: string }).schoolName,
    isEmailVerified: raw.isEmailVerified,
    isActive: raw.isActive,
    phoneNumber: raw.phoneNumber,
    lastLogin: raw.lastLogin,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    profilePhotoUrl:
      (raw as { profilePhotoUrl?: string | null }).profilePhotoUrl ?? null,
    name: firstName
      ? `${firstName} ${lastName ?? ""}`.trim()
      : ((raw as { schoolName?: string }).schoolName ?? raw.email),
  };
}

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function wipeSession(userId?: string): void {
  tokenStorage.clear();
  userStorage.clear(userId);
}

function isDefinitiveAuthFailure(err: unknown): boolean {
  const status = (err as AxiosError)?.response?.status;
  return status === 401 || status === 403;
}

export function roleDashboard(role: AuthUser["role"]): string {
  return ROLE_DASHBOARD[role] ?? "/auth";
}

export const AuthSpinner: React.FC = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
    <div className="w-10 h-10 border-4 border-[#8b1c53] border-t-transparent rounded-full animate-spin" />
  </div>
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionState, setSessionState] =
    useState<SessionState>("initializing");

  useEffect(() => {
    const bootstrap = async () => {
      const cachedUser = userStorage.get<AuthUser>();
      if (cachedUser) setUser(cachedUser);

      try {
        const { accessToken } = await authService.refreshTokens();
        tokenStorage.setAccess(accessToken);

        const payload = parseJwt(accessToken);
        if (payload) {
          const freshUser: AuthUser = {
            ...(cachedUser ?? ({} as AuthUser)),
            id: String(payload["userId"] ?? cachedUser?.id ?? ""),
            email: String(payload["email"] ?? cachedUser?.email ?? ""),
            role: ((payload["roles"] as string[])?.[0]?.toLowerCase() ??
              cachedUser?.role ??
              "parent") as AuthUser["role"],
            isEmailVerified:
              (payload["security"] as { emailVerified?: boolean })
                ?.emailVerified ??
              cachedUser?.isEmailVerified ??
              false,
            isActive: true,
            phoneNumber: cachedUser?.phoneNumber ?? null,
            lastLogin: cachedUser?.lastLogin ?? null,
            createdAt: cachedUser?.createdAt ?? "",
            updatedAt: cachedUser?.updatedAt ?? "",
            name: cachedUser?.name,
            firstName: cachedUser?.firstName,
            lastName: cachedUser?.lastName,
            schoolName: cachedUser?.schoolName,
            profilePhotoUrl: cachedUser?.profilePhotoUrl ?? null,
          };
          userStorage.set(freshUser);
          setUser(freshUser);
        }

        setSessionState("authenticated");
      } catch (err) {
        if (isDefinitiveAuthFailure(err)) {
          wipeSession(cachedUser?.id);
          setUser(null);
          setSessionState("unauthenticated");
        } else {
          const path = window.location.pathname;
          const isAdminPath = path.startsWith("/admin");
          const isCsPath = path.startsWith("/cs");
          const isFinancePath = path.startsWith("/finance");
          const isParentPath = path.startsWith("/parent");
          const isSchoolPath = path.startsWith("/school");
          const ADMIN_ROLES = ["admin", "super_admin"];
          const CS_ROLES = [
            "customer_service",
            "customer_service_manager",
            "risk_management",
          ];
          const FINANCE_ROLES = ["accountant"];
          const wrongPath =
            (isAdminPath &&
              cachedUser &&
              !ADMIN_ROLES.includes(cachedUser.role)) ||
            (isCsPath && cachedUser && !CS_ROLES.includes(cachedUser.role)) ||
            (isFinancePath &&
              cachedUser &&
              !FINANCE_ROLES.includes(cachedUser.role)) ||
            (isParentPath && cachedUser && cachedUser.role !== "parent") ||
            (isSchoolPath && cachedUser && cachedUser.role !== "school");
          if (wrongPath && cachedUser) {
            wipeSession(cachedUser.id);
            setUser(null);
            setSessionState("unauthenticated");
          } else if (cachedUser) {
            setSessionState("authenticated");
          } else {
            setSessionState("unauthenticated");
          }
        }
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const handle = () => {
      wipeSession(user?.id);
      setUser(null);
      setSessionState("unauthenticated");
    };
    window.addEventListener("auth:session-expired", handle);
    return () => window.removeEventListener("auth:session-expired", handle);
  }, []);

  useEffect(() => {
    if (sessionState !== "authenticated" || !user || user.role !== "parent")
      return;
    apiClient
      .get<{ data: { profilePhotoUrl?: string | null } }>("/parents/profile")
      .then(({ data }) => {
        const photo = data.data.profilePhotoUrl ?? null;
        if (photo === user.profilePhotoUrl) return;
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, profilePhotoUrl: photo };
          userStorage.set(updated);
          return updated;
        });
      })
      .catch(() => {});
  }, [sessionState, user?.id]);

  useEffect(() => {
    if (
      sessionState !== "authenticated" ||
      !user ||
      (user.role !== "admin" &&
        user.role !== "super_admin" &&
        user.role !== "customer_service" &&
        user.role !== "customer_service_manager" &&
        user.role !== "accountant" &&
        user.role !== "risk_management")
    )
      return;
    apiClient
      .get<{ data: { avatarUrl?: string | null; fullName?: string | null } }>(
        user.role === "admin" || user.role === "super_admin"
          ? "/admin/profile"
          : "/cs/profile",
      )
      .then(({ data }) => {
        const d = data.data;
        const photo = d.avatarUrl ?? null;
        const name = d.fullName ?? null;
        if (photo === user.profilePhotoUrl && (!name || name === user.name))
          return;
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            profilePhotoUrl: photo ?? prev.profilePhotoUrl,
            name: name ?? prev.name,
          };
          userStorage.set(updated);
          return updated;
        });
      })
      .catch(() => {});
  }, [sessionState, user?.id]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      expectedRole?: string,
    ): Promise<AuthUser> => {
      const res = await authService.login({ email, password });
      const { user: apiUser, accessToken } = res.data;

      if (expectedRole && apiUser.role !== expectedRole) {
        throw new Error(
          `Unauthorized. Please login through the ${apiUser.role} portal.`,
        );
      }

      tokenStorage.setAccess(accessToken);
      const enriched = enrichUser(apiUser);
      userStorage.set(enriched);
      setUser(enriched);
      setSessionState("authenticated");
      return enriched;
    },
    [],
  );

  const register = useCallback(
    async (
      userData: Record<string, unknown>,
      role = "parent",
    ): Promise<AuthUser> => {
      const res = await authService.register(userData, role);
      const { user: apiUser, accessToken } = res.data;

      tokenStorage.setAccess(accessToken);
      const enriched = enrichUser(apiUser);
      userStorage.set(enriched);
      setUser(enriched);
      setSessionState("authenticated");
      return enriched;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
    } finally {
      wipeSession(user?.id);
      setUser(null);
      setSessionState("unauthenticated");
    }
  }, [user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      sessionState,
      isLoading: sessionState === "initializing",
      isInitializing: sessionState === "initializing",
      isAuthenticated: sessionState === "authenticated",
      login,
      logout,
      register,
      setUser,
    }),
    [user, sessionState, login, logout, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const RequireAuth: React.FC<{
  children: ReactNode;
  roles?: AuthUser["role"][];
}> = ({ children, roles }) => {
  const { sessionState, user } = useAuth();

  if (sessionState === "initializing") return <AuthSpinner />;
  if (sessionState === "unauthenticated")
    return <Navigate to="/auth" replace />;
  if (roles && user && !roles.includes(user.role))
    return <Navigate to={roleDashboard(user.role)} replace />;

  return <>{children}</>;
};

export const RedirectIfAuthenticated: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { sessionState, user } = useAuth();

  if (sessionState === "initializing") return <AuthSpinner />;
  if (sessionState === "authenticated" && user)
    return <Navigate to={roleDashboard(user.role)} replace />;

  return <>{children}</>;
};
