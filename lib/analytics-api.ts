import type {
  TimeRange,
  Timezone,
  StatsData,
  ChartsData,
  RequestLogsResponse,
  OverviewData,
} from "./analytics-types";

const TZ_OFFSET: Record<Timezone, number> = { UTC: 0, KST: 9 };

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function analyticsRequest<T>(
  endpoint: string,
  params: Record<string, string | undefined>
): Promise<T> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") filtered[k] = v;
  }
  const query = new URLSearchParams(filtered).toString();
  const headers: HeadersInit = {};
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`/api/analytics/${endpoint}?${query}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Analytics request failed");
  }

  const data = await response.json();
  return data.result;
}

export const analyticsApi = {
  getStats: (timeRange: TimeRange, apiKeys?: string[]) =>
    analyticsRequest<StatsData>("stats", {
      timeRange,
      apiKeys: apiKeys?.join(","),
    }),

  getCharts: (timeRange: TimeRange, apiKeys?: string[], timezone?: Timezone) =>
    analyticsRequest<ChartsData>("charts", {
      timeRange,
      apiKeys: apiKeys?.join(","),
      tzOffset: String(TZ_OFFSET[timezone ?? "UTC"]),
    }),

  getLogs: (
    timeRange: TimeRange,
    options?: {
      apiKeys?: string[];
      page?: number;
      pageSize?: number;
      search?: string;
      statusFilter?: string;
      methodFilter?: string;
    }
  ) =>
    analyticsRequest<RequestLogsResponse>("logs", {
      timeRange,
      apiKeys: options?.apiKeys?.join(","),
      page: options?.page?.toString(),
      pageSize: options?.pageSize?.toString(),
      search: options?.search,
      statusFilter: options?.statusFilter,
      methodFilter: options?.methodFilter,
    }),

  getOverview: (timeRange: TimeRange, apiKeys?: string[], timezone?: Timezone) =>
    analyticsRequest<OverviewData>("overview", {
      timeRange,
      apiKeys: apiKeys?.join(","),
      tzOffset: String(TZ_OFFSET[timezone ?? "UTC"]),
    }),
};
