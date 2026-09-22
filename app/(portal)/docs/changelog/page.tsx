"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { changelog, type ChangelogKind } from "@/lib/changelog-data";

const kindColors: Record<ChangelogKind, string> = {
  Added: "border-emerald-300 text-emerald-700 dark:text-emerald-400",
  Changed: "border-blue-300 text-blue-700 dark:text-blue-400",
  Deprecated: "border-amber-300 text-amber-700 dark:text-amber-400",
  Removed: "border-red-300 text-red-700 dark:text-red-400",
};

export default function ChangelogPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Changelog</h1>
        <p className="text-muted-foreground text-lg">
          API additions, deprecations and removals, newest first.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {changelog.map((entry, i) => (
          <div key={i} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:gap-6">
            <div className="flex items-center gap-2 sm:w-40 sm:shrink-0 sm:flex-col sm:items-start">
              <code className="text-sm text-foreground">{entry.date}</code>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0 h-4", kindColors[entry.kind])}
                >
                  {entry.kind}
                </Badge>
                <span className="text-xs text-muted-foreground">{entry.area}</span>
              </div>
              <p className="text-sm text-foreground">{entry.summary}</p>
              {entry.migration && (
                <p className="text-sm text-muted-foreground">{entry.migration}</p>
              )}
              {entry.href && (
                <Link
                  href={entry.href}
                  className="text-xs text-primary hover:underline"
                >
                  View reference
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
