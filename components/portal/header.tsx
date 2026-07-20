"use client";

import { useState, useEffect } from "react";
import { Menu, LogIn, Eye, EyeOff, Check, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ApiSearch } from "@/components/portal/api-search";
import { getConfig } from "@/lib/api";
import type { UserProfile } from "@/lib/api";

interface HeaderProps {
  title: string;
  description?: string;
  authFailed?: boolean;
  userProfile?: UserProfile | null;
  onMenuClick?: () => void;
  /** Hide the API Status link and API search */
  hideTools?: boolean;
  /** Render a brand logo instead of the text title */
  logo?: { src: string; alt: string };
}

function getDisplayName(profile: UserProfile): string {
  return profile.userName || profile.email || "";
}

export function Header({ title, description, authFailed, userProfile, onMenuClick, hideTools, logo }: HeaderProps) {
  const [loginLink, setLoginLink] = useState("");
  const [isLocal, setIsLocal] = useState(false);
  const [token, setToken] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    getConfig().then((config) => {
      if (config.loginLink) setLoginLink(config.loginLink);
      setIsLocal(config.profile === "local");
    }).catch(() => {});

    const savedToken = localStorage.getItem("access_token");
    if (savedToken) setToken(savedToken);
  }, []);

  const handleSave = () => {
    if (token.trim()) {
      localStorage.setItem("access_token", token);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 shrink-0"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {logo ? (
          <img
            src={logo.src}
            alt={logo.alt}
            className="block h-8 w-auto object-contain"
          />
        ) : (
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        )}

      </div>

      <div className="flex items-center gap-3 shrink-0">
        {!hideTools && (
          <>
            <a
              href="https://perso-developers.statuspage.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">API Status</span>
            </a>
            <ApiSearch />
          </>
        )}
        {/* Local profile access token input */}
        {isLocal && (
          <>
            <div className="hidden lg:flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-orange-500 border-orange-500/30">
                LOCAL
              </Badge>
              <div className="relative">
                <Input
                  type={isVisible ? "text" : "password"}
                  placeholder="Access Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-44 h-8 text-xs bg-muted/50 pr-8"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setIsVisible(!isVisible)}
                >
                  {isVisible ? (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <Button
                size="sm"
                variant={isSaved ? "outline" : "secondary"}
                onClick={handleSave}
                className="h-8 text-xs px-3"
              >
                {isSaved ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-green-500" />
                    Saved
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            <Separator orientation="vertical" className="hidden lg:block h-6" />
          </>
        )}

        {/* Auth state: login button or user name */}
        {authFailed ? (
          loginLink && (
            <a
              href={`${loginLink}/en/login?callbackUrl=${typeof window !== "undefined" ? encodeURIComponent(window.location.href) : ""}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              Login
            </a>
          )
        ) : (
          userProfile && (
            <>
              <Separator orientation="vertical" className="hidden sm:block h-6" />
              <div className="hidden sm:flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {getDisplayName(userProfile).charAt(0).toUpperCase()}
                </span>
                <span className="max-w-40 truncate text-sm font-medium text-foreground">
                  {getDisplayName(userProfile)}
                </span>
              </div>
            </>
          )
        )}
      </div>
    </header>
  );
}
