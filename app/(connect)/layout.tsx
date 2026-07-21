"use client";

import { Header } from "@/components/portal/header";
import { PortalProvider, usePortal } from "@/lib/portal-context";

// Focused layout for /connect: portal header without sidebar, search, or status tools
function ConnectShell({ children }: { children: React.ReactNode }) {
  const { userProfile, authFailed } = usePortal();

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Connect"
        logo={{
          src: "https://portal-static.perso.ai/_next/static/media/perso_ai_dubbing.81e52417.webp",
          alt: "Perso Dubbing",
        }}
        authFailed={authFailed}
        userProfile={userProfile}
        hideTools
      />
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalProvider>
      <ConnectShell>{children}</ConnectShell>
    </PortalProvider>
  );
}
