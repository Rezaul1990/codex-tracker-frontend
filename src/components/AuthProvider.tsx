"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authApi from "@/lib/authApi";
import type { AuthStatus, AuthUser } from "@/types/auth";

type AuthContextValue = {
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  status: AuthStatus;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const result = await authApi.getCurrentUser();
      setUser(result.data || null);
      setStatus(result.data ? "authenticated" : "unauthenticated");
    } catch {
      try {
        const result = await authApi.refreshAuth();
        setUser(result.data || null);
        setStatus(result.data ? "authenticated" : "unauthenticated");
      } catch {
        setUser(null);
        setStatus("unauthenticated");
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      login: async (input) => {
        const result = await authApi.login(input);
        setUser(result.data || null);
        setStatus(result.data ? "authenticated" : "unauthenticated");
      },
      logout: async () => {
        await authApi.logout();
        setUser(null);
        setStatus("unauthenticated");
      },
      refresh,
      status,
      user,
    }),
    [refresh, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
