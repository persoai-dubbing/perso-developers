"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { spaceApi, creditApi } from "@/lib/api";
import type { SpaceInfo, CreditBalance } from "@/lib/api";

interface PortalContextValue {
  spaceInfo: SpaceInfo | null;
  creditBalance: CreditBalance | null;
  authFailed: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [spaceInfo, setSpaceInfo] = useState<SpaceInfo | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    spaceApi
      .getList()
      .then((res) => {
        const defaultSpace = res.result.find((s) => s.isDefaultSpaceOwned);
        if (!defaultSpace) return;
        setSpaceInfo(defaultSpace);

        creditApi
          .getBalance(defaultSpace.spaceSeq, "video_translator")
          .then((creditRes) => setCreditBalance(creditRes.result))
          .catch(() => {});
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
      value={{ spaceInfo, creditBalance, authFailed, sidebarOpen, setSidebarOpen }}
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
