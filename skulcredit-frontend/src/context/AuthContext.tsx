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
import authService, {
  AuthUser as ServiceAuthUser,
} from "../services/authService";
import { tokenStorage, userStorage } from "../services/api";

export interface AuthUser {
  id: string;
  email: string;
  role: "parent" | "school" | "admin";
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
}

interface AuthContextValue {
  user: AuthUser | null;
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
    role: raw.role,
    firstName,
    lastName,
    schoolName: (raw as { schoolName?: string }).schoolName,
    isEmailVerified: raw.isEmailVerified,
    isActive: raw.isActive,
    phoneNumber: raw.phoneNumber,
    lastLogin: raw.lastLogin,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
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

function clearSession(): void {
  tokenStorage.clear();
  userStorage.clear();
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  // ── Bootstrap — restore session on mount ──────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      // Restore cached user profile immediately for instant render
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
          };
          userStorage.set(freshUser);
          setUser(freshUser);
        }
      } catch {
        tokenStorage.clear();
        userStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const handle = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("auth:session-expired", handle);
    return () => window.removeEventListener("auth:session-expired", handle);
  }, []);

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
      setUser(enriched);
      userStorage.set(enriched);
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
      setUser(enriched);
      userStorage.set(enriched);
      return enriched;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isInitializing: isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      register,
      setUser,
    }),
    [user, isLoading, login, logout, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const RequireAuth: React.FC<{
  children: ReactNode;
  roles?: AuthUser["role"][];
}> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-[#8b1c53] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const RedirectIfAuthenticated: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-[#8b1c53] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    const destination =
      user.role === "admin"
        ? "/admin/dashboard"
        : user.role === "school"
          ? "/school/dashboard"
          : "/parent/dashboard";
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};
