/**
 * ACCESS TOKEN  — kept in memory only (module-level variable).
 *   • Never written to localStorage / sessionStorage.
 *   • Lost on page refresh — recovered via a silent cookie-based refresh call
 *     that AuthContext runs on mount.
 *   • Not accessible to injected scripts (XSS mitigation).
 *
 * REFRESH TOKEN — httpOnly cookie set by the backend.
 *   • Never touches JavaScript at all.
 *   • Sent automatically by the browser to /api/v1/auth/* routes.
 *   • SameSite=Strict (prod) / Lax (dev) prevents CSRF.
 *
 * USER PROFILE  — stored in localStorage as non-sensitive display data only
 *   (name, email, role). No tokens.
 */

let _accessToken: string | null = null;

export const tokenStorage = {
  getAccess: () => _accessToken,
  setAccess: (t: string) => {
    _accessToken = t;
  },
  clearAccess: () => {
    _accessToken = null;
  },

  getRefresh: () => null as string | null,
  setRefresh: (_t: string) => {
  },
  setTokens: (a: string, _r: string) => {
    _accessToken = a;
  },
  clear: () => {
    _accessToken = null;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  },
};

const USER_KEY = "sc_user";

export const userStorage = {
  get: <T>(): T | null => {
    try {
      const raw =
        localStorage.getItem(USER_KEY) ??
        localStorage.getItem("skulcredit_user");
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set: (user: unknown): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
    }
  },
  clear: (): void => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("skulcredit_user");
  },
};
