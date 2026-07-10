"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { userApi } from "@/lib/api";
import type { UserProfile } from "@/lib/api";

interface PortalContextValue {
  userProfile: UserProfile | null;
  authFailed: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    userApi
      .getProfile()
      .then((res) => {
        setUserProfile(res.result);
      })
      .catch(() => {
        setAuthFailed(true);
      });

    const handleAuthExpired = () => setAuthFailed(true);
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  return (
    <PortalContext.Provider
      value={{ userProfile, authFailed, sidebarOpen, setSidebarOpen }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}
