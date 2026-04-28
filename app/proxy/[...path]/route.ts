import { NextRequest, NextResponse } from "next/server";

async function refreshAccessToken(
  backendUrl: string,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  const clientId = process.env.CLIENT_ID;
  if (!clientId) {
    console.error("[PROXY] CLIENT_ID is not configured");
    return null;
  }

  try {
    const res = await fetch(
      `${backendUrl}/auth/api/v1/auth/oauth2/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          grantType: "refresh_token",
          tokenReissueRequest: { refreshToken },
        }),
      }
    );

    if (!res.ok) {
      console.error(`[PROXY] Token refresh failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const result = data.result ?? data;
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  } catch (e) {
    console.error("[PROXY] Token refresh error:", e);
    return null;
  }
}

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { code: "CONFIG_ERROR", message: "BACKEND_API_URL is not configured" },
      { status: 500 }
    );
  }

  const { path } = await params;
  const targetPath = `/${path.join("/")}`;
  const queryString = request.nextUrl.search;
  const url = `${backendUrl}${targetPath}${queryString}`;
  console.log(`[PROXY] ${request.method} ${url}`);

  const accessTokenCookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
  const refreshTokenCookieName = process.env.REFRESH_TOKEN_COOKIE_NAME;

  const cookieToken = accessTokenCookieName
    ? request.cookies.get(accessTokenCookieName)?.value
    : undefined;
  const authorization = cookieToken
    ? `Bearer ${cookieToken}`
    : request.headers.get("Authorization");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (authorization) {
    headers["Authorization"] = authorization;
  }

  const apiKey = request.headers.get("XP-API-KEY");
  if (apiKey) {
    headers["XP-API-KEY"] = apiKey;
  }

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const text = await request.text();
    if (text) body = text;
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
    ...(body ? { body } : {}),
  };

  const response = await fetch(url, fetchOptions);

  if (response.status === 401 && refreshTokenCookieName) {
    const refreshToken = request.cookies.get(refreshTokenCookieName)?.value;
    if (refreshToken) {
      console.log("[PROXY] Access token expired, attempting refresh...");
      const tokens = await refreshAccessToken(backendUrl, refreshToken);

      if (tokens?.accessToken) {
        console.log("[PROXY] Token refreshed successfully, retrying request");
        const retryHeaders: HeadersInit = {
          ...headers,
          Authorization: `Bearer ${tokens.accessToken}`,
        };

        const retryResponse = await fetch(url, {
          method: request.method,
          headers: retryHeaders,
          ...(body ? { body } : {}),
        });

        const retryData = await retryResponse.json().catch(() => ({}));
        const res = NextResponse.json(retryData, {
          status: retryResponse.status,
        });

        if (accessTokenCookieName) {
          res.cookies.set(accessTokenCookieName, tokens.accessToken, {
            path: "/",
            httpOnly: true,
            secure: process.env.PROFILE !== "dev",
            sameSite: "lax",
          });
        }
        if (tokens.refreshToken && refreshTokenCookieName) {
          res.cookies.set(refreshTokenCookieName, tokens.refreshToken, {
            path: "/",
            httpOnly: true,
            secure: process.env.PROFILE !== "dev",
            sameSite: "lax",
          });
        }

        return res;
      }
    }
  }

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const PUT = proxyRequest;
