// ===== 조회 파라미터 =====
export type TimeRange = "today" | "1h" | "6h" | "24h" | "7d" | "30d";
export type Timezone = "UTC" | "KST";

export interface AnalyticsQueryParams {
  timeRange: TimeRange;
  apiKeys?: string[];
  userSeq?: number;
  endpoint?: string;
  statusFilter?: string;
  tzOffset?: number;
}

// ===== Stats (4개 카드) =====
export interface StatsData {
  totalRequests: number;
  successRate: number;
  avgLatency: number;
  errorRate: number;
  totalRequestsChange: number;
  successRateChange: number;
  avgLatencyChange: number;
  errorRateChange: number;
}

// ===== 차트 데이터 =====
export interface TimeSeriesPoint {
  time: string;
  requests: number;
  errors: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface LatencyPoint {
  time: string;
  p50: number;
  p95: number;
  p99: number;
}

export interface ChartsData {
  requestsOverTime: TimeSeriesPoint[];
  statusDistribution: StatusDistribution[];
  latencyPercentiles: LatencyPoint[];
}

// ===== 로그 엔트리 =====
export interface RequestLogEntry {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  latency: number;
  apiKey: string;
  clientIp: string;
  errorMessage: string;
  errorCode: string;
  requestPayload: string;
}

export interface RequestLogsResponse {
  logs: RequestLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

// ===== Overview 전용 =====
export interface TopEndpoint {
  endpoint: string;
  count: number;
  avgLatency: number;
  errorRate: number;
}

export interface OverviewData {
  stats: StatsData;
  requestsOverTime: TimeSeriesPoint[];
  topEndpoints: TopEndpoint[];
  recentErrors: RequestLogEntry[];
}
