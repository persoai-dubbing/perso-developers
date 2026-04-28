import type { NextRequest } from "next/server";
import { getEsClient, getIndexPattern } from "./elasticsearch";
import type {
  TimeRange,
  AnalyticsQueryParams,
  StatsData,
  ChartsData,
  TimeSeriesPoint,
  StatusDistribution,
  LatencyPoint,
  RequestLogEntry,
  RequestLogsResponse,
  TopEndpoint,
  OverviewData,
} from "./analytics-types";

// ===== 헬퍼 =====

/** 실제 API Key를 ES에 저장된 마스킹 포맷으로 변환 (앞 12자 + *** + 뒤 4자) */
function maskApiKey(key: string): string {
  if (key.length <= 16) return key;
  return key.slice(0, 12) + "***" + key.slice(-4);
}

/** 서버 사이드에서 토큰 갱신 후 새 액세스 토큰 반환 */
async function refreshAndGetNewToken(
  request: NextRequest
): Promise<string | null> {
  const backendUrl = process.env.BACKEND_API_URL;
  const clientId = process.env.CLIENT_ID;
  const refreshTokenCookieName = process.env.REFRESH_TOKEN_COOKIE_NAME;
  if (!backendUrl || !clientId || !refreshTokenCookieName) return null;

  const refreshToken = request.cookies.get(refreshTokenCookieName)?.value;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${backendUrl}/auth/api/v1/auth/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        grantType: "refresh_token",
        tokenReissueRequest: { refreshToken },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.result ?? data;
    return result.accessToken ?? null;
  } catch {
    return null;
  }
}

/** 서버 사이드에서 현재 사용자의 userSeq를 조회 */
async function getUserSeq(request: NextRequest): Promise<number | null> {
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) return null;

  const cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
  let token = cookieName
    ? request.cookies.get(cookieName)?.value
    : undefined;
  if (!token) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }
  if (!token) return null;

  try {
    const res = await fetch(`${backendUrl}/user/api/v1/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401) {
      const newToken = await refreshAndGetNewToken(request);
      if (newToken) {
        const retryRes = await fetch(
          `${backendUrl}/user/api/v1/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${newToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const result = retryData.result ?? retryData;
          return result.userSeq ?? null;
        }
      }
      return null;
    }

    if (!res.ok) return null;

    const data = await res.json();
    const result = data.result ?? data;
    return result.userSeq ?? null;
  } catch {
    return null;
  }
}

/** 서버 사이드에서 현재 사용자의 active API Key 목록을 조회하여 마스킹된 키 배열로 반환 */
async function getUserMaskedApiKeys(request: NextRequest): Promise<string[]> {
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) throw new Error("BACKEND_API_URL is not configured");

  // 쿠키 → Authorization 헤더 순서로 토큰 확인
  const cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
  let token = cookieName
    ? request.cookies.get(cookieName)?.value
    : undefined;
  if (!token) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }
  if (!token) throw new Error("No authentication token");

  const res = await fetch(`${backendUrl}/auth/api/v1/api-keys/active`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {
    const newToken = await refreshAndGetNewToken(request);
    if (newToken) {
      const retryRes = await fetch(
        `${backendUrl}/auth/api/v1/api-keys/active`,
        {
          headers: {
            Authorization: `Bearer ${newToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        const keys: { apiKey: string }[] = retryData.result ?? [];
        return keys.map((k) => maskApiKey(k.apiKey));
      }
    }
    throw new Error("Token expired and refresh failed");
  }

  if (!res.ok) throw new Error(`Failed to fetch API keys: ${res.status}`);

  const data = await res.json();
  const keys: { apiKey: string }[] = data.result ?? [];
  return keys.map((k) => maskApiKey(k.apiKey));
}

/**
 * 현재 사용자의 API Key + userSeq로 필터 범위를 결정.
 * selectedKeys가 있으면 사용자 키와 교집합, 없으면 사용자의 전체 키 반환.
 */
export async function resolveUserContext(
  request: NextRequest,
  selectedKeys?: string[]
): Promise<{ apiKeys: string[]; userSeq?: number }> {
  const [userMaskedKeys, userSeq] = await Promise.all([
    getUserMaskedApiKeys(request),
    getUserSeq(request),
  ]);

  let apiKeys: string[];
  if (!selectedKeys || selectedKeys.length === 0) {
    apiKeys = userMaskedKeys;
  } else {
    const selectedMasked = selectedKeys.map(maskApiKey);
    const filtered = selectedMasked.filter((k) => userMaskedKeys.includes(k));
    apiKeys = filtered.length > 0 ? filtered : userMaskedKeys;
  }

  return { apiKeys, userSeq: userSeq ?? undefined };
}

// ===== ES 공통 =====

const AG = "api_gateway_analytics";

/**
 * http_status, duration_ms 필드 타입이 환경마다 다를 수 있음.
 * - 로컬: text (+.keyword 서브필드) → .keyword에서 파싱
 * - 개발서버: integer/long (숫자) → 직접 cast
 */
function buildRuntimeScript(fieldName: string): string {
  const kw = `api_gateway_analytics.${fieldName}.keyword`;
  const direct = `api_gateway_analytics.${fieldName}`;
  return [
    `if (doc.containsKey('${kw}') && doc['${kw}'].size() > 0) {`,
    `  try { emit(Long.parseLong(doc['${kw}'].value.toString())); } catch(Exception e) {}`,
    `} else if (doc.containsKey('${direct}') && doc['${direct}'].size() > 0) {`,
    `  try { emit((long) doc['${direct}'].value); } catch(Exception e) {}`,
    `}`,
  ].join(" ");
}

const RUNTIME_MAPPINGS = {
  http_status_int: {
    type: "long" as const,
    script: buildRuntimeScript("http_status"),
  },
  duration_ms_int: {
    type: "long" as const,
    script: buildRuntimeScript("duration_ms"),
  },
};

function getTimeRangeMs(timeRange: TimeRange): number {
  if (timeRange === "today") {
    const now = new Date();
    const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return now.getTime() - utcMidnight;
  }
  const map: Record<string, number> = {
    "1h": 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  return map[timeRange];
}

function getHistogramInterval(timeRange: TimeRange): string {
  const map: Record<string, string> = {
    today: "1h",
    "1h": "5m",
    "6h": "30m",
    "24h": "1h",
    "7d": "6h",
    "30d": "1d",
  };
  return map[timeRange];
}

function formatTime(ts: string | number, timeRange: TimeRange, tzOffset: number = 0): string {
  const d = new Date(new Date(ts).getTime() + tzOffset * 60 * 60 * 1000);
  if (timeRange === "7d" || timeRange === "30d") {
    return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
  }
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** 기본 bool filter 구성: 시간 범위 + user_seq + API Key 필터 */
function buildBaseFilter(params: AnalyticsQueryParams, rangeField: string = "@timestamp") {
  const now = Date.now();
  const rangeMs = getTimeRangeMs(params.timeRange);
  const from = new Date(now - rangeMs).toISOString();

  const filters: any[] = [{ range: { [rangeField]: { gte: from } } }];

  if (params.userSeq != null) {
    filters.push({ term: { [`${AG}.user_seq`]: params.userSeq } });
  }

  if (params.apiKeys && params.apiKeys.length > 0) {
    filters.push(buildApiKeyFilter(params.apiKeys));
  }

  return filters;
}

/** api_key가 text 타입이므로 match_phrase로 필터링 */
function buildApiKeyFilter(apiKeys: string[]) {
  if (apiKeys.length === 1) {
    return { match_phrase: { [`${AG}.api_key`]: apiKeys[0] } };
  }
  return {
    bool: {
      should: apiKeys.map((key) => ({
        match_phrase: { [`${AG}.api_key`]: key },
      })),
      minimum_should_match: 1,
    },
  };
}

/** 이전 기간 bool filter (비교용) */
function buildPrevFilter(params: AnalyticsQueryParams, rangeField: string = "@timestamp") {
  const now = Date.now();
  const rangeMs = getTimeRangeMs(params.timeRange);
  const from = new Date(now - rangeMs * 2).toISOString();
  const to = new Date(now - rangeMs).toISOString();

  const filters: any[] = [{ range: { [rangeField]: { gte: from, lt: to } } }];

  if (params.userSeq != null) {
    filters.push({ term: { [`${AG}.user_seq`]: params.userSeq } });
  }

  if (params.apiKeys && params.apiKeys.length > 0) {
    filters.push(buildApiKeyFilter(params.apiKeys));
  }

  return filters;
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// ===== Stats =====

async function fetchStatsForPeriod(filters: any[]) {
  const client = getEsClient();

  const result = await client.search({
    index: getIndexPattern(),
    size: 0,
    runtime_mappings: RUNTIME_MAPPINGS,
    query: { bool: { filter: filters } },
    aggs: {
      total: { value_count: { field: "http_status_int" } },
      success: {
        filter: { range: { http_status_int: { gte: 200, lt: 300 } } },
      },
      errors: {
        filter: { range: { http_status_int: { gte: 400 } } },
      },
      avg_latency: { avg: { field: "duration_ms_int" } },
    },
  });

  const aggs = result.aggregations as any;
  const total = aggs?.total?.value ?? 0;
  const success = aggs?.success?.doc_count ?? 0;
  const errors = aggs?.errors?.doc_count ?? 0;
  const avgLatency = aggs?.avg_latency?.value ?? 0;

  return { total, success, errors, avgLatency };
}

export async function fetchStats(
  params: AnalyticsQueryParams
): Promise<StatsData> {
  const [current, previous] = await Promise.all([
    fetchStatsForPeriod(buildBaseFilter(params)),
    fetchStatsForPeriod(buildPrevFilter(params)),
  ]);

  const successRate =
    current.total > 0
      ? Math.round((current.success / current.total) * 1000) / 10
      : 0;
  const errorRate =
    current.total > 0
      ? Math.round((current.errors / current.total) * 1000) / 10
      : 0;
  const prevSuccessRate =
    previous.total > 0
      ? Math.round((previous.success / previous.total) * 1000) / 10
      : 0;
  const prevErrorRate =
    previous.total > 0
      ? Math.round((previous.errors / previous.total) * 1000) / 10
      : 0;

  return {
    totalRequests: current.total,
    successRate,
    avgLatency: Math.round(current.avgLatency),
    errorRate,
    totalRequestsChange: calcChange(current.total, previous.total),
    successRateChange: Math.round((successRate - prevSuccessRate) * 10) / 10,
    avgLatencyChange: calcChange(current.avgLatency, previous.avgLatency),
    errorRateChange: Math.round((errorRate - prevErrorRate) * 10) / 10,
  };
}

// ===== Charts =====

export async function fetchChartsData(
  params: AnalyticsQueryParams
): Promise<ChartsData> {
  const client = getEsClient();
  const filters = buildBaseFilter(params);
  const interval = getHistogramInterval(params.timeRange);

  const result = await client.search({
    index: getIndexPattern(),
    size: 0,
    runtime_mappings: RUNTIME_MAPPINGS,
    query: { bool: { filter: filters } },
    aggs: {
      over_time: {
        date_histogram: {
          field: "@timestamp",
          fixed_interval: interval,
          min_doc_count: 0,
          extended_bounds: {
            min: new Date(Date.now() - getTimeRangeMs(params.timeRange)).toISOString(),
            max: new Date().toISOString(),
          },
        },
        aggs: {
          errors: {
            filter: { range: { http_status_int: { gte: 400 } } },
          },
          p50: { percentiles: { field: "duration_ms_int", percents: [50] } },
          p95: { percentiles: { field: "duration_ms_int", percents: [95] } },
          p99: { percentiles: { field: "duration_ms_int", percents: [99] } },
        },
      },
      status_distribution: {
        range: {
          field: "http_status_int",
          ranges: [
            { key: "2XX", from: 200, to: 300 },
            { key: "3XX", from: 300, to: 400 },
            { key: "4XX", from: 400, to: 500 },
            { key: "5XX", from: 500, to: 600 },
          ],
        },
      },
    },
  });

  const aggs = result.aggregations as any;

  // Requests Over Time + Latency Percentiles
  const timeBuckets = aggs?.over_time?.buckets ?? [];
  const requestsOverTime: TimeSeriesPoint[] = [];
  const latencyPercentiles: LatencyPoint[] = [];

  for (const bucket of timeBuckets) {
    const time = formatTime(bucket.key_as_string ?? bucket.key, params.timeRange, params.tzOffset);
    requestsOverTime.push({
      time,
      requests: bucket.doc_count,
      errors: bucket.errors?.doc_count ?? 0,
    });
    latencyPercentiles.push({
      time,
      p50: Math.round(bucket.p50?.values?.["50.0"] ?? 0),
      p95: Math.round(bucket.p95?.values?.["95.0"] ?? 0),
      p99: Math.round(bucket.p99?.values?.["99.0"] ?? 0),
    });
  }

  // Status Distribution
  const statusBuckets = aggs?.status_distribution?.buckets ?? [];
  const statusDistribution: StatusDistribution[] = statusBuckets
    .filter((b: any) => b.doc_count > 0)
    .map((b: any) => ({ status: b.key, count: b.doc_count }));

  return { requestsOverTime, statusDistribution, latencyPercentiles };
}

// ===== Request Logs =====

export async function fetchRequestLogs(
  params: AnalyticsQueryParams & {
    page?: number;
    pageSize?: number;
    search?: string;
    statusFilter?: string;
    methodFilter?: string;
  }
): Promise<RequestLogsResponse> {
  const client = getEsClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const filters = buildBaseFilter(params);

  if (params.search) {
    filters.push({
      wildcard: {
        [`${AG}.endpoint.keyword`]: { value: `*${params.search}*`, case_insensitive: true },
      },
    });
  }

  if (params.methodFilter && params.methodFilter !== "all") {
    const methods = params.methodFilter.split(",").map((m) => m.toUpperCase());
    if (methods.length === 1) {
      filters.push({
        match_phrase: { [`${AG}.method`]: methods[0] },
      });
    } else {
      filters.push({
        bool: {
          should: methods.map((m) => ({
            match_phrase: { [`${AG}.method`]: m },
          })),
          minimum_should_match: 1,
        },
      });
    }
  }

  if (params.statusFilter && params.statusFilter !== "all") {
    const statuses = params.statusFilter.split(",");
    if (statuses.length === 1) {
      const prefix = parseInt(statuses[0].charAt(0), 10);
      filters.push({
        range: {
          http_status_int: { gte: prefix * 100, lt: (prefix + 1) * 100 },
        },
      });
    } else {
      filters.push({
        bool: {
          should: statuses.map((s) => {
            const prefix = parseInt(s.charAt(0), 10);
            return {
              range: {
                http_status_int: { gte: prefix * 100, lt: (prefix + 1) * 100 },
              },
            };
          }),
          minimum_should_match: 1,
        },
      });
    }
  }

  const from = (page - 1) * pageSize;

  const searchResult = await client.search({
    index: getIndexPattern(),
    size: pageSize,
    from,
    track_total_hits: true,
    runtime_mappings: RUNTIME_MAPPINGS,
    query: { bool: { filter: filters } },
    sort: [{ "@timestamp": { order: "desc" } }],
    _source: [
      `${AG}.timestamp`,
      `${AG}.method`,
      `${AG}.endpoint`,
      `${AG}.http_status`,
      `${AG}.duration_ms`,
      `${AG}.api_key`,
      `${AG}.client_ip`,
      `${AG}.error_message`,
      `${AG}.error_code`,
      `${AG}.request_payload`,
      `${AG}.response_payload`,
      `${AG}.request_id`,
      "@timestamp",
    ],
  });

  const hitsTotal = searchResult.hits.total as { value: number } | undefined;
  const total = hitsTotal?.value ?? 0;

  const logs: RequestLogEntry[] = searchResult.hits.hits.map((hit: any) => {
    const ag = hit._source?.[AG] ?? hit._source?.api_gateway_analytics ?? {};
    return {
      id: ag.request_id || hit._id || "",
      timestamp: ag.timestamp ?? hit._source?.["@timestamp"] ?? "",
      method: ag.method ?? "",
      endpoint: ag.endpoint ?? "",
      statusCode: parseInt(ag.http_status, 10) || 0,
      latency: parseInt(ag.duration_ms, 10) || 0,
      apiKey: ag.api_key ?? "",
      clientIp: ag.client_ip ?? "",
      errorMessage: ag.error_message ?? "-",
      errorCode: ag.error_code ?? "-",
      requestPayload: ag.request_payload ?? "-",
    };
  });

  return { logs, total, page, pageSize };
}

// ===== Overview =====

export async function fetchOverviewData(
  params: AnalyticsQueryParams
): Promise<OverviewData> {
  const client = getEsClient();
  const filters = buildBaseFilter(params);
  const prevFilters = buildPrevFilter(params);
  const interval = getHistogramInterval(params.timeRange);

  // 현재 기간 통계 + 차트 + top endpoints + recent errors 를 한 번에
  const [currentAgg, prevStats, errorsResult] = await Promise.all([
    client.search({
      index: getIndexPattern(),
      size: 0,
      runtime_mappings: RUNTIME_MAPPINGS,
      query: { bool: { filter: filters } },
      aggs: {
        total: { value_count: { field: "http_status_int" } },
        success: {
          filter: { range: { http_status_int: { gte: 200, lt: 300 } } },
        },
        errors: {
          filter: { range: { http_status_int: { gte: 400 } } },
        },
        avg_latency: { avg: { field: "duration_ms_int" } },
        over_time: {
          date_histogram: {
            field: "@timestamp",
            fixed_interval: interval,
            min_doc_count: 0,
            extended_bounds: {
              min: new Date(Date.now() - getTimeRangeMs(params.timeRange)).toISOString(),
              max: new Date().toISOString(),
            },
          },
          aggs: {
            errors: {
              filter: { range: { http_status_int: { gte: 400 } } },
            },
          },
        },
        top_endpoints: {
          terms: { field: `${AG}.endpoint.keyword`, size: 10 },
          aggs: {
            avg_latency: { avg: { field: "duration_ms_int" } },
            errors: {
              filter: { range: { http_status_int: { gte: 400 } } },
            },
          },
        },
      },
    }),
    fetchStatsForPeriod(prevFilters),
    client.search({
      index: getIndexPattern(),
      size: 5,
      runtime_mappings: RUNTIME_MAPPINGS,
      query: {
        bool: {
          filter: [
            ...filters,
            { range: { http_status_int: { gte: 400 } } },
          ],
        },
      },
      sort: [{ "@timestamp": { order: "desc" } }],
      _source: [
        `${AG}.timestamp`,
        `${AG}.method`,
        `${AG}.endpoint`,
        `${AG}.http_status`,
        `${AG}.duration_ms`,
        `${AG}.api_key`,
        `${AG}.client_ip`,
        `${AG}.error_message`,
        `${AG}.error_code`,
        `${AG}.request_payload`,
        `${AG}.response_payload`,
        `${AG}.request_id`,
        "@timestamp",
      ],
    }),
  ]);

  const aggs = currentAgg.aggregations as any;
  const currentTotal = aggs?.total?.value ?? 0;
  const currentSuccess = aggs?.success?.doc_count ?? 0;
  const currentErrors = aggs?.errors?.doc_count ?? 0;
  const currentAvgLatency = aggs?.avg_latency?.value ?? 0;

  const successRate =
    currentTotal > 0
      ? Math.round((currentSuccess / currentTotal) * 1000) / 10
      : 0;
  const errorRate =
    currentTotal > 0
      ? Math.round((currentErrors / currentTotal) * 1000) / 10
      : 0;
  const prevSuccessRate =
    prevStats.total > 0
      ? Math.round((prevStats.success / prevStats.total) * 1000) / 10
      : 0;
  const prevErrorRate =
    prevStats.total > 0
      ? Math.round((prevStats.errors / prevStats.total) * 1000) / 10
      : 0;

  const stats: StatsData = {
    totalRequests: currentTotal,
    successRate,
    avgLatency: Math.round(currentAvgLatency),
    errorRate,
    totalRequestsChange: calcChange(currentTotal, prevStats.total),
    successRateChange: Math.round((successRate - prevSuccessRate) * 10) / 10,
    avgLatencyChange: calcChange(currentAvgLatency, prevStats.avgLatency),
    errorRateChange: Math.round((errorRate - prevErrorRate) * 10) / 10,
  };

  // Requests Over Time
  const timeBuckets = aggs?.over_time?.buckets ?? [];
  const requestsOverTime: TimeSeriesPoint[] = timeBuckets.map((bucket: any) => ({
    time: formatTime(bucket.key_as_string ?? bucket.key, params.timeRange, params.tzOffset),
    requests: bucket.doc_count,
    errors: bucket.errors?.doc_count ?? 0,
  }));

  // Top Endpoints
  const endpointBuckets = aggs?.top_endpoints?.buckets ?? [];
  const topEndpoints: TopEndpoint[] = endpointBuckets.map((bucket: any) => ({
    endpoint: bucket.key,
    count: bucket.doc_count,
    avgLatency: Math.round(bucket.avg_latency?.value ?? 0),
    errorRate:
      bucket.doc_count > 0
        ? Math.round(((bucket.errors?.doc_count ?? 0) / bucket.doc_count) * 1000) / 10
        : 0,
  }));

  // Recent Errors
  const recentErrors: RequestLogEntry[] = errorsResult.hits.hits.map(
    (hit: any) => {
      const ag = hit._source?.[AG] ?? hit._source?.api_gateway_analytics ?? {};
      return {
        id: ag.request_id || hit._id || "",
        timestamp: ag.timestamp ?? hit._source?.["@timestamp"] ?? "",
        method: ag.method ?? "",
        endpoint: ag.endpoint ?? "",
        statusCode: parseInt(ag.http_status, 10) || 0,
        latency: parseInt(ag.duration_ms, 10) || 0,
        apiKey: ag.api_key ?? "",
        clientIp: ag.client_ip ?? "",
        errorMessage: ag.error_message ?? "-",
        errorCode: ag.error_code ?? "-",
        requestPayload: ag.request_payload ?? "-",
      };
    }
  );

  return { stats, requestsOverTime, topEndpoints, recentErrors };
}
