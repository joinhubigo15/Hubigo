"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ApiClientError,
  AuthSession,
  PublicUser,
  logoutRequest,
  refreshRequest,
} from "@/app/lib/api";

interface AuthContextValue {
  user: PublicUser | null;
  accessToken: string | null;
  initializing: boolean;
  logout: () => Promise<void>;
  setSession: (session: AuthSession) => void;
  updateUser: (user: PublicUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // On first load, try to silently restore a session from the httpOnly refresh cookie.
    refreshRequest()
      .then((session) => {
        setUser(session.user);
        setAccessToken(session.accessToken);
      })
      .catch(() => {
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const setSession = useCallback((session: AuthSession) => {
    setUser(session.user);
    setAccessToken(session.accessToken);
  }, []);

  const updateUser = useCallback((updated: PublicUser) => {
    setUser(updated);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, accessToken, initializing, logout, setSession, updateUser }),
    [user, accessToken, initializing, logout, setSession, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { ApiClientError };
