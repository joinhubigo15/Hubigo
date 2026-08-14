"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  roleName: string;
  roleSlug: string;
  permissions: string[];
  lastLoginAt: string | null;
  lastLoginIp: string | null;
}

interface AdminAuthContextType {
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, twoFactorCode: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, message: "Not initialized" }),
  logout: () => {},
  hasPermission: () => false,
});

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { cache: "no-store" });
      if (!res.ok) {
        setAdmin(null);
        return;
      }
      const body = await res.json();
      setAdmin(body.data ?? null);
    } catch {
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, [refreshSession]);

  const login = async (email: string, password: string, twoFactorCode: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, twoFactorCode }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        return { success: false, message: body.message || "Invalid admin credentials or unauthorized account." };
      }

      setAdmin(body.data.admin);
      return { success: true, message: body.message };
    } catch {
      return { success: false, message: "Couldn't reach the server — check your connection and try again." };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    fetch("/api/admin/logout", { method: "POST" }).finally(() => {
      setAdmin(null);
      router.push("/admin/login");
    });
  };

  const hasPermission = (perm: string): boolean => {
    if (!admin) return false;
    if (admin.permissions.includes("*") || admin.roleSlug === "super_admin") return true;
    return admin.permissions.includes(perm);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
