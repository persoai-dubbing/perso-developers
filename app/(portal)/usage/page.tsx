"use client";

import { useState, useEffect, useMemo } from "react";
import { StatsCards } from "@/components/portal/stats-cards";
import { UsageCharts } from "@/components/portal/usage-charts";
import { RequestLogs } from "@/components/portal/request-logs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, RefreshCw } from "lucide-react";
import { apiKeyApi } from "@/lib/api";
import type { ApiKey } from "@/lib/api";
import type { TimeRange, Timezone } from "@/lib/analytics-types";
import { Button } from "@/components/ui/button";
import {
  useAnalyticsStats,
  useAnalyticsCharts,
  useAnalyticsLogs,
} from "@/hooks/use-analytics";

export default function UsagePage() {
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
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [selectedApiKey, setSelectedApiKey] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  useEffect(() => {
    apiKeyApi
      .getActiveList()
      .then((res) => setApiKeys(res.result))
      .catch(() => {});
  }, []);

  const apiKeyFilter = useMemo(() => {
    if (selectedApiKey === "all") {
      return apiKeys.length > 0
        ? apiKeys.map((k) => k.apiKey)
        : undefined;
    }
    return [selectedApiKey];
  }, [selectedApiKey, apiKeys]);

  const handleTimeRangeChange = (v: string) => {
    setTimeRange(v as TimeRange);
    setPage(1);
  };

  const handleApiKeyChange = (key: string) => {
    setSelectedApiKey(key);
    setSearchQuery("");
    setStatusFilter("all");
    setMethodFilter("all");
    setPage(1);
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setPage(1);
  };

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setPage(1);
  };

  const handleMethodFilterChange = (filter: string) => {
    setMethodFilter(filter);
    setPage(1);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = useAnalyticsStats(timeRange, apiKeyFilter);
  const charts = useAnalyticsCharts(timeRange, apiKeyFilter, timezone);
  const logs = useAnalyticsLogs(timeRange, {
    apiKeys: apiKeyFilter,
    page,
    pageSize: 20,
    search: searchQuery || undefined,
    statusFilter,
    methodFilter,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([stats.refetch(), charts.refetch(), logs.refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border border-border text-sm overflow-hidden">
              {(["UTC", "KST"] as Timezone[]).map((tz) => (
                <button
                  key={tz}
                  onClick={() => setTimezone(tz)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
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
              onValueChange={handleTimeRangeChange}
            >
              <SelectTrigger className="w-44 bg-secondary text-left">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last 1 hour</SelectItem>
                <SelectItem value="6h">Last 6 hours</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedApiKey}
              onValueChange={handleApiKeyChange}
            >
              <SelectTrigger className="w-48 bg-secondary">
                <SelectValue placeholder="API Key" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All API Keys</SelectItem>
                {apiKeys.map((key) => (
                  <SelectItem key={key.seq} value={key.apiKey}>
                    {(key.apiKeyName || key.apiKey).length > 16
                      ? (key.apiKeyName || key.apiKey).slice(0, 16) + "..."
                      : (key.apiKeyName || key.apiKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-secondary"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <StatsCards data={stats.data} isLoading={stats.isLoading} />

        <UsageCharts data={charts.data} isLoading={charts.isLoading} />

        <RequestLogs
          data={logs.data}
          isLoading={logs.isLoading}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          methodFilter={methodFilter}
          timezone={timezone}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          onMethodFilterChange={handleMethodFilterChange}
          onPageChange={setPage}
        />
      </div>
  );
}
