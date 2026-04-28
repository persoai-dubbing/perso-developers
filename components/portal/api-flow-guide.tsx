"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApiGuide } from "@/lib/api-docs-data";

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-green-100 text-green-700",
  PUT: "bg-amber-100 text-amber-700",
  PATCH: "bg-purple-100 text-purple-700",
  DELETE: "bg-red-100 text-red-700",
};

const authLabels: Record<string, { label: string; className: string }> = {
  "XP-API-KEY": {
    label: "XP-API-KEY",
    className: "border-violet-300 text-violet-600",
  },
  None: {
    label: "No Auth",
    className: "border-gray-300 text-gray-500",
  },
};

export function ApiFlowGuide({ guide }: { guide: ApiGuide }) {
  return (
    <div
      id={guide.id}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-base font-semibold text-foreground">
          {guide.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {guide.description}
        </p>
      </div>

      <div className="px-6 py-4 space-y-0">
        {guide.steps.map((step, idx) => (
          <div key={step.step} className="relative flex gap-4">
            {/* Vertical line connector */}
            {idx < guide.steps.length - 1 && (
              <div className="absolute left-[15px] top-[32px] bottom-0 w-px bg-border" />
            )}

            {/* Step number circle */}
            <div className="relative z-10 flex items-center justify-center w-[31px] h-[31px] rounded-full border-2 border-primary bg-background text-primary text-sm font-bold shrink-0 mt-0.5">
              {step.step}
            </div>

            {/* Step content */}
            <div className={cn("flex-1 pb-5", idx === guide.steps.length - 1 && "pb-0")}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">
                  {step.title}
                </span>
                {step.method && (
                  <Badge
                    className={cn(
                      "font-mono text-[10px] px-1.5",
                      methodColors[step.method]
                    )}
                  >
                    {step.method}
                  </Badge>
                )}
                {step.auth && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-4",
                      authLabels[step.auth]?.className
                    )}
                  >
                    {authLabels[step.auth]?.label}
                  </Badge>
                )}
              </div>

              {step.path && (
                <code className="text-xs text-muted-foreground mt-1 block break-all">
                  {step.path}
                </code>
              )}

              <p className="text-sm text-muted-foreground mt-1.5">
                {step.description}
              </p>

              {step.headers && (
                <div className="mt-2 rounded border border-border bg-secondary/30 p-3">
                  <p className="text-xs font-medium text-foreground mb-1">
                    Required Headers
                  </p>
                  <div className="font-mono text-xs space-y-0.5">
                    {Object.entries(step.headers).map(([key, value]) => (
                      <p key={key}>
                        <code className="bg-muted px-1 py-0.5 rounded">
                          {key}: {value}
                        </code>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {step.codeExample && (
                <div className="mt-2 rounded border border-border bg-secondary/30 p-3">
                  <p className="text-xs font-medium text-foreground mb-1">
                    Example
                  </p>
                  <pre className="font-mono text-xs whitespace-pre-wrap break-all text-muted-foreground">
                    {step.codeExample}
                  </pre>
                </div>
              )}

              {step.note && (
                <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded px-2.5 py-1.5 border border-border/50">
                  {step.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface GuideTocItem {
  id: string;
  title: string;
  categoryTitle: string;
}

export function GuideToc({ items }: { items: GuideTocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const ids = items.map((item) => item.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (!mounted) return null;

  return createPortal(
    <div className="hidden xl:block fixed right-16 top-1/2 -translate-y-1/2 z-[9999] group/toc">
      {/* Collapsed: indicator bars */}
      <div className="group-hover/toc:hidden flex flex-col items-center gap-1.5 py-4 w-10">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "h-1 rounded-full transition-all duration-200 bg-primary",
              activeId === item.id ? "w-7 opacity-100" : "w-5 opacity-40"
            )}
          />
        ))}
      </div>

      {/* Expanded: full TOC on hover */}
      <div className="hidden group-hover/toc:block">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xl">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Guides
          </h3>
          <div className="space-y-0.5">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary/60 group",
                  activeId === item.id && "bg-secondary/80"
                )}
              >
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 shrink-0"
                >
                  {item.categoryTitle}
                </Badge>
                <span
                  className={cn(
                    "font-medium text-xs group-hover:text-primary whitespace-nowrap",
                    activeId === item.id
                      ? "text-primary font-semibold"
                      : "text-foreground"
                  )}
                >
                  {item.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
