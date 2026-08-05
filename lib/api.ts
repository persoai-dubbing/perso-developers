// 쿠키에서 값 읽기
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"
    )
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// 저장된 액세스 토큰 가져오기 (쿠키 우선, force 시 localStorage 우선)
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const force = getCookie("access_token_force") === "true";
  if (force) {
    return localStorage.getItem("access_token");
  }

  // 쿠키에서 먼저 시도
  const cookieName = configCache?.accessTokenCookieName;
  if (cookieName) {
    const cookieToken = getCookie(cookieName);
    if (cookieToken) return cookieToken;
  }

  // 쿠키에 없으면 localStorage fallback
  return localStorage.getItem("access_token");
}

// API 요청 헤더 생성
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// API 응답 타입
export interface ApiResponse<T> {
  result: T;
}

// API Key 타입
export interface ApiKey {
  seq: number;
  apiKey: string;
  apiKeyName: string | null;
  status: "active" | "expired" | "revoked";
  expireDate: string;
  lastUsedDate: string | null;
  createDate: string;
}

// 만료 기간 타입
export type ApiKeyExpirePeriod = "days_30" | "days_90" | "year_1" | "year_2";

// API Key 생성 요청
export interface CreateApiKeyRequest {
  apiKeyName?: string;
  expirePeriod: ApiKeyExpirePeriod;
}

// API Key 수정 요청
export interface UpdateApiKeyRequest {
  apiKeyName?: string;
  expireDate?: string;
}

// API 에러 타입
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Config 캐싱 (localStorage + 인메모리)
const CONFIG_CACHE_KEY = "app_config";

interface AppConfig {
  apiBaseUrl: string;
  profile: string;
  accessTokenCookieName: string;
  refreshTokenCookieName: string;
  clientId: string;
  loginLink: string;
}

let configCache: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (configCache) return configCache;

  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(CONFIG_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.loginLink !== undefined) {
        configCache = parsed;
        return configCache!;
      }
      localStorage.removeItem(CONFIG_CACHE_KEY);
    }
  }

  const res = await fetch("/api/config");
  const data = await res.json();
  configCache = {
    apiBaseUrl: data.apiBaseUrl || "",
    profile: data.profile || "",
    accessTokenCookieName: data.accessTokenCookieName || "",
    refreshTokenCookieName: data.refreshTokenCookieName || "",
    clientId: data.clientId || "",
    loginLink: data.loginLink || "",
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(configCache));
  }

  return configCache!;
}

// 토큰 갱신
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    return res.ok;
  } catch {
    return false;
  } finally {
    refreshPromise = null;
  }
}

// 공통 API 요청 함수
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `/proxy${endpoint}`;
  const reqOptions = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  const response = await fetch(url, reqOptions);

  if (response.status === 401) {
    // 동시 요청 시 refresh 한 번만 실행
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }
    const refreshed = await refreshPromise;

    if (refreshed) {
      const retryResponse = await fetch(url, {
        ...reqOptions,
        headers: {
          ...getHeaders(),
          ...options.headers,
        },
      });

      if (retryResponse.ok) {
        return retryResponse.json();
      }

      const retryError = await retryResponse.json().catch(() => ({}));
      throw new ApiError(
        retryResponse.status,
        retryError.code || "UNKNOWN",
        retryError.message || "API request failed after token refresh."
      );
    }

    // Refresh failed — notify UI to show login button
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-expired"));
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.code || "UNKNOWN",
      errorData.message || "API request failed."
    );
  }

  return response.json();
}

// 유저 프로필 타입 — the API returns more fields; provider/createDate are read by the /connect
// onboarding analytics (signup vs login classification).
export interface UserProfile {
  userSeq: number;
  userName?: string;
  email?: string;
  /** "email" | "google" | "ms" — how the account was created */
  provider?: string;
  /** account creation date-time */
  createDate?: string;
}

// 스페이스 정보 타입
export interface SpaceInfo {
  spaceSeq: number;
  spaceName: string;
  planName: string;
  tier: string;
  logo: string;
  memberCount: number;
  seat: number;
  isDefaultSpaceOwned: boolean;
  memberRole: string;
  useVideoTranslatorEdit: boolean;
}

// 크레딧 잔액 타입
export interface CreditBalance {
  lookupType: string;
  credit: number;
}

// 크레딧 이력 타입
export type CreditActionType = "all" | "earn" | "redeem" | "cancel" | "expire";
export type CreditSourceType =
  | "none"
  | "join"
  | "event"
  | "reward"
  | "charge"
  | "refund"
  | "cancel"
  | "coupon"
  | "feature"
  | "enterprise"
  | "expired";

export interface CreditHistoryItem {
  seq: number;
  actionType: CreditActionType;
  sourceType: CreditSourceType;
  isCancel: boolean;
  createDate: string;
  credit: number;
  description: string;
  serviceType: string;
}

export interface CreditHistoryPage {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: CreditHistoryItem[];
  number: number;
  numberOfElements: number;
}

// 유저 API
export const userApi = {
  // 내 프로필 조회
  getProfile: () =>
    apiRequest<ApiResponse<UserProfile>>("/user/api/v1/users/profile"),
};

// 스페이스 API
export const spaceApi = {
  // 스페이스 목록 조회
  getList: () =>
    apiRequest<ApiResponse<SpaceInfo[]>>("/portal/api/v1/spaces"),
};

// 크레딧 API
export const creditApi = {
  // 스페이스별 크레딧 잔액 조회
  getBalance: (spaceSeq: number, serviceType: string) =>
    apiRequest<ApiResponse<CreditBalance>>(
      `/quota/api/v1/credit/spaces/${spaceSeq}/${serviceType}?lookupType=current_available`
    ),

  // 스페이스별 크레딧 사용 이력 조회
  getHistory: (spaceSeq: number, serviceType: string, page = 0, size = 100) =>
    apiRequest<ApiResponse<CreditHistoryPage>>(
      `/quota/api/v1/credit/spaces/${spaceSeq}/${serviceType}/histories?page=${page}&size=${size}`
    ),
};

// API Key 관리 API
export const apiKeyApi = {
  // 목록 조회
  getList: () =>
    apiRequest<ApiResponse<ApiKey[]>>("/auth/api/v1/api-keys"),

  // 활성 목록 조회
  getActiveList: () =>
    apiRequest<ApiResponse<ApiKey[]>>("/auth/api/v1/api-keys/active"),

  // 단건 조회
  getOne: (apiKey: string) =>
    apiRequest<ApiResponse<ApiKey>>(`/auth/api/v1/api-keys/${apiKey}`),

  // 생성
  create: (data: CreateApiKeyRequest) =>
    apiRequest<ApiResponse<ApiKey>>("/auth/api/v1/api-keys", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // 수정
  update: (apiKey: string, data: UpdateApiKeyRequest) =>
    apiRequest<ApiResponse<ApiKey>>(`/auth/api/v1/api-keys/${apiKey}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // 폐기
  revoke: (apiKey: string) =>
    apiRequest<ApiResponse<null>>(`/auth/api/v1/api-keys/${apiKey}/revoke`, {
      method: "PATCH",
    }),

  // 삭제
  delete: (apiKey: string) =>
    apiRequest<ApiResponse<null>>(`/auth/api/v1/api-keys/${apiKey}`, {
      method: "DELETE",
    }),
};
