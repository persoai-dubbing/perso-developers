"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/portal/sidebar";
import { Header } from "@/components/portal/header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { PortalProvider, usePortal } from "@/lib/portal-context";

function getPageTitle(pathname: string): string {
  if (pathname === "/overview") return "Home";
  if (pathname === "/usage") return "API Usage";
  if (pathname === "/api-keys") return "API Keys";
  if (pathname.startsWith("/docs")) return "Documentation";
  return "Home";
}

function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { spaceInfo, creditBalance, authFailed, sidebarOpen, setSidebarOpen } =
    usePortal();
  const title = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar mobile onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="lg:ml-64">
        <Header
          title={title}
          authFailed={authFailed}
          spaceInfo={spaceInfo}
          creditBalance={creditBalance}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalProvider>
      <PortalShell>{children}</PortalShell>
    </PortalProvider>
  );
}
