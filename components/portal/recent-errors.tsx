"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestLogEntry, Timezone } from "@/lib/analytics-types";

const getStatusColor = (status: number) => {
  if (status >= 400 && status < 500)
    return "bg-warning/10 text-warning border-warning/20";
  if (status >= 500)
    return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted text-muted-foreground";
};

const getMethodColor = (method: string) => {
  const colors: Record<string, string> = {
    GET: "text-blue-700",
    POST: "text-green-700",
    PUT: "text-amber-700",
    DELETE: "text-red-700",
    PATCH: "text-purple-700",
  };
  return colors[method] || "text-muted-foreground";
};

interface RecentErrorsProps {
  data?: RequestLogEntry[] | null;
  isLoading?: boolean;
  timezone?: Timezone;
}

export function RecentErrors({ data, isLoading, timezone = "UTC" }: RecentErrorsProps) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="px-4 py-3 pb-1">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const errors = (data ?? []).slice(0, 5);

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="px-4 py-3 pb-1 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-foreground">
          Recent Errors
        </CardTitle>
        <Link
          href="/usage"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center">
            No recent errors.
          </p>
        ) : (
          <div className="space-y-2">
            {errors.map((err) => (
              <div
                key={err.id}
                className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="outline"
                    className={cn("font-mono text-xs shrink-0", getStatusColor(err.statusCode))}
                  >
                    {err.statusCode}
                  </Badge>
                  <span
                    className={cn(
                      "text-xs font-semibold shrink-0",
                      getMethodColor(err.method)
                    )}
                  >
                    {err.method}
                  </span>
                  <span className="text-xs font-mono text-foreground truncate">
                    {err.endpoint}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground shrink-0 ml-2">
                  {new Date(err.timestamp).toLocaleTimeString("en-US", {
                    timeZone: timezone === "KST" ? "Asia/Seoul" : "UTC",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
