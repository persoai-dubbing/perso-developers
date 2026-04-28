"use client";

import { useState, useEffect, useMemo } from "react";
import { Quickstart } from "@/components/portal/quickstart";
import { ApiKeySummary } from "@/components/portal/api-key-summary";
import { TopEndpoints } from "@/components/portal/top-endpoints";
import { RecentErrors } from "@/components/portal/recent-errors";
import { AiAgentBanner } from "@/components/portal/ai-agent-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { apiKeyApi } from "@/lib/api";
import type { ApiKey } from "@/lib/api";
import type { TimeRange, Timezone } from "@/lib/analytics-types";
import { useAnalyticsOverview } from "@/hooks/use-analytics";

export default function OverviewPage() {
  const [timezone, setTimezone] = useState<Timezone>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("usage-timezone");
      if (saved === "UTC" || saved === "KST") return saved;
    }
    return "UTC";
  });

  useEffect(() => {
    localStorage.setItem("usage-timezone", timezone);
  }, [timezone]);
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  useEffect(() => {
    apiKeyApi
      .getActiveList()
      .then((res) => setApiKeys(res.result))
      .catch(() => {});
  }, []);

  const apiKeyFilter = useMemo(() => {
    return apiKeys.length > 0
      ? apiKeys.map((k) => k.apiKey)
      : undefined;
  }, [apiKeys]);

  const { data, isLoading } = useAnalyticsOverview(timeRange, apiKeyFilter, timezone);

  return (
      <div className="space-y-6">
        <AiAgentBanner />

        <Quickstart />

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Overview</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border text-xs overflow-hidden">
              {(["UTC", "KST"] as Timezone[]).map((tz) => (
                <button
                  key={tz}
                  onClick={() => setTimezone(tz)}
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    timezone === tz
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tz}
                </button>
              ))}
            </div>
            <Select
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as TimeRange)}
            >
              <SelectTrigger className="w-44 bg-secondary h-8 text-sm text-left">
                <Calendar className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="1h">Last 1 hour</SelectItem>
                <SelectItem value="6h">Last 6 hours</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <TopEndpoints data={data?.topEndpoints} isLoading={isLoading} />
          <RecentErrors data={data?.recentErrors} isLoading={isLoading} timezone={timezone} />
          <div className="w-72 h-full">
            <ApiKeySummary />
          </div>
        </div>
      </div>
  );
}
