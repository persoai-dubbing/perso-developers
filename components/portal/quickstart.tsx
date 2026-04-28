"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Video,
  Mic,
  Pencil,
  Languages,
  Key,
  BookOpen,
} from "lucide-react";

const items = [
  {
    icon: Video,
    title: "Video Dubbing",
    description: "Translate and dub videos into multiple languages automatically.",
    href: "/docs/dubbing",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Mic,
    title: "Lip Sync",
    description: "Generate synchronized mouth movements for translated audio.",
    href: "/docs/lip-sync",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Pencil,
    title: "Script Editing",
    description: "Fine-tune translated sentences and regenerate audio.",
    href: "/docs/editing",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Languages,
    title: "Multi-language",
    description: "Support for dozens of languages with auto-detection.",
    href: "/docs/language",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Key,
    title: "API Keys",
    description: "Generate and manage keys for secure API access.",
    href: "/api-keys",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: BookOpen,
    title: "API Reference",
    description: "Complete documentation with code examples.",
    href: "/docs",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

export function Quickstart() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium text-foreground">Quickstart</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Explore what you can build with the Perso API
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={item.title} href={item.href}>
            <Card className="border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-3 flex items-start gap-3">
                <div className={`rounded-lg p-2 shrink-0 ${item.bg}`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
