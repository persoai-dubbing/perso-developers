"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getConfig } from "@/lib/api";
import {
  Key,
  BarChart3,
  FileText,
  Video,
  Mic,
  PenLine,
  BookOpen,
  ChevronDown,
  Upload,
  MessageSquare,
  Star,
  Shield,
  Globe,
  LayoutGrid,
  Home,
  Activity,
  HelpCircle,
  AudioLines,
  AudioWaveform,
} from "lucide-react";

const navigation = [
  { name: "Home", href: "/overview", icon: Home },
  { name: "Usage", href: "/usage", icon: Activity },
  { name: "API Keys", href: "/api-keys", icon: Key },
];

const apiReferenceSubNav = [
  { name: "Introduction", href: "/docs", icon: BookOpen },
  { name: "Authentication", href: "/docs/authentication", icon: Shield },
];

const persoApiSubNav = [
  { name: "Space", href: "/docs/space", icon: LayoutGrid },
  { name: "Media", href: "/docs/file", icon: Upload },
  { name: "Dubbing", href: "/docs/dubbing", icon: Video },
  { name: "Editing", href: "/docs/editing", icon: PenLine },
  { name: "Usage", href: "/docs/usage", icon: BarChart3 },
  { name: "Lip Sync", href: "/docs/lip-sync", icon: Mic },
  { name: "STT", href: "/docs/stt", icon: AudioLines },
  { name: "Audio Separation", href: "/docs/audio-separation", icon: AudioWaveform },
  { name: "Language", href: "/docs/language", icon: Globe },
  { name: "Feedback", href: "/docs/feedback", icon: MessageSquare },
  { name: "Community Spotlight", href: "/docs/community-spotlight", icon: Star },
  { name: "Help", href: "/docs/help", icon: HelpCircle },
];

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobile, onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const isDocsSection = pathname.startsWith("/docs");
  const [apiRefOpen, setApiRefOpen] = useState(true);
  const [serviceUrl, setServiceUrl] = useState("");

  useEffect(() => {
    getConfig().then((config) => {
      if (config.loginLink) setServiceUrl(config.loginLink);
    });
  }, []);

  return (
    <aside className={cn(
      "flex h-screen w-64 flex-col border-r border-border bg-sidebar",
      !mobile && "fixed left-0 top-0 z-40"
    )}>
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <a href={serviceUrl ? `${serviceUrl}/workspace` : "#"} className="cursor-pointer">
          <img
            decoding="auto"
            width="129"
            height="36"
            src="/perso-icon.png"
            alt="Perso AI"
            style={{ display: "block", objectFit: "contain", objectPosition: "center" }}
          />
        </a>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Developers
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {item.name}
            </Link>
          );
        })}

        {/* API Reference section */}
        <div>
          <button
            onClick={() => setApiRefOpen(!apiRefOpen)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isDocsSection
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <FileText className={cn("h-4 w-4", isDocsSection && "text-primary")} />
            API Reference
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 transition-transform",
                apiRefOpen ? "rotate-0" : "-rotate-90"
              )}
            />
          </button>

          {apiRefOpen && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
              {apiReferenceSubNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                    {item.name}
                  </Link>
                );
              })}

              {/* PersoAPI section */}
              <div className="mt-2 pt-2 border-t border-border">
                <p className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  Perso API
                </p>
                {persoApiSubNav.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
