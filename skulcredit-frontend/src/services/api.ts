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
  setRefresh: (_t: string) => {},
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

const userKey = (id: string) => `sc_user_${id}`;
const LEGACY_KEYS = ["sc_user", "skulcredit_user"];

export const userStorage = {
  get: <T>(id?: string): T | null => {
    try {
      if (id) {
        const scoped = localStorage.getItem(userKey(id));
        if (scoped) return JSON.parse(scoped) as T;
      }
      for (const k of LEGACY_KEYS) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw) as { id?: string } & T;
          if (!id || parsed.id === id) return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  },
  set: (user: { id: string } & object): void => {
    try {
      localStorage.setItem(userKey(user.id), JSON.stringify(user));
      for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    } catch {}
  },
  clear: (id?: string): void => {
    if (id) localStorage.removeItem(userKey(id));
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
  },
};
