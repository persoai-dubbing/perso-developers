"use client";

import React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatsData } from "@/lib/analytics-types";

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, change, changeLabel, icon }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  isPositive ? "text-primary" : "text-destructive"
                )}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              <span className="text-xs text-muted-foreground">
                {changeLabel}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-secondary p-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  data?: StatsData | null;
  isLoading?: boolean;
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const changeLabel = "vs prev period";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Requests"
        value={data ? data.totalRequests.toLocaleString() : "0"}
        change={data?.totalRequestsChange ?? 0}
        changeLabel={changeLabel}
        icon={<Activity className="h-4 w-4 text-primary" />}
      />
      <StatCard
        title="Success Rate"
        value={data ? `${data.successRate}%` : "0%"}
        change={data?.successRateChange ?? 0}
        changeLabel={changeLabel}
        icon={<Zap className="h-4 w-4 text-primary" />}
      />
      <StatCard
        title="Avg. Latency"
        value={data ? `${data.avgLatency}ms` : "0ms"}
        change={data?.avgLatencyChange ?? 0}
        changeLabel={changeLabel}
        icon={<Clock className="h-4 w-4 text-chart-2" />}
      />
      <StatCard
        title="Error Rate"
        value={data ? `${data.errorRate}%` : "0%"}
        change={data?.errorRateChange ?? 0}
        changeLabel={changeLabel}
        icon={<AlertTriangle className="h-4 w-4 text-warning" />}
      />
    </div>
  );
}
