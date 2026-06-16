import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as api from "./api";

type ViewerAuthStatus = "loading" | "authed" | "guest";

type ViewerAuthCtx = {
  status: ViewerAuthStatus;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<ViewerAuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ViewerAuthStatus>("loading");
  const [username, setUsername] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api.me();
      if (res.authenticated) {
        setStatus("authed");
        setUsername(res.username);
      } else {
        setStatus("guest");
        setUsername(null);
      }
    } catch {
      setStatus("guest");
      setUsername(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (user: string, password: string) => {
    await api.login(user, password);
    setStatus("authed");
    setUsername(user.trim() || user);
  }, []);

  const register = useCallback(async (user: string, password: string) => {
    const res = await api.register(user, password);
    setStatus("authed");
    setUsername(res.username);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setStatus("guest");
      setUsername(null);
    }
  }, []);

  const value = useMemo(
    () => ({ status, username, login, register, logout, refresh }),
    [status, username, login, register, logout, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useViewerAuth(): ViewerAuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useViewerAuth must be used inside <AuthProvider>");
  return ctx;
}
