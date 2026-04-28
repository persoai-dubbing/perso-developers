import { useState, useEffect, useCallback } from "react";
import { analyticsApi } from "@/lib/analytics-api";
import type {
  TimeRange,
  Timezone,
  StatsData,
  ChartsData,
  RequestLogsResponse,
  OverviewData,
} from "@/lib/analytics-types";

export function useAnalyticsStats(timeRange: TimeRange, apiKeys?: string[]) {
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getStats(timeRange, apiKeys);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, apiKeys]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useAnalyticsCharts(timeRange: TimeRange, apiKeys?: string[], timezone?: Timezone) {
  const [data, setData] = useState<ChartsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getCharts(timeRange, apiKeys, timezone);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load charts");
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, apiKeys, timezone]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useAnalyticsLogs(
  timeRange: TimeRange,
  options?: {
    apiKeys?: string[];
    page?: number;
    pageSize?: number;
    search?: string;
    statusFilter?: string;
    methodFilter?: string;
  }
) {
  const [data, setData] = useState<RequestLogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await analyticsApi.getLogs(timeRange, options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setIsLoading(false);
    }
  }, [
    timeRange,
    options?.apiKeys,
    options?.page,
    options?.pageSize,
    options?.search,
    options?.statusFilter,
    options?.methodFilter,
  ]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

export function useAnalyticsOverview(
  timeRange: TimeRange,
  apiKeys?: string[],
  timezone?: Timezone
) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getOverview(timeRange, apiKeys, timezone);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load overview"
      );
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, apiKeys, timezone]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
