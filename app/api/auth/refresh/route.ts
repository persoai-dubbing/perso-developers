import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const backendUrl = process.env.BACKEND_API_URL;
  const clientId = process.env.CLIENT_ID;
  const accessTokenCookieName = process.env.ACCESS_TOKEN_COOKIE_NAME;
  const refreshTokenCookieName = process.env.REFRESH_TOKEN_COOKIE_NAME;

  if (!backendUrl || !clientId || !refreshTokenCookieName) {
    return NextResponse.json(
      { code: "CONFIG_ERROR", message: "Missing refresh configuration" },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(refreshTokenCookieName)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { code: "NO_REFRESH_TOKEN", message: "Refresh token not found" },
      { status: 401 }
    );
  }

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

    if (!res.ok) {
      console.error(`[Auth Refresh] Token refresh failed: ${res.status}`);
      return NextResponse.json(
        { code: "REFRESH_FAILED", message: "Token refresh failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const result = data.result ?? data;

    const response = NextResponse.json({ result: { success: true } });

    if (accessTokenCookieName && result.accessToken) {
      response.cookies.set(accessTokenCookieName, result.accessToken, {
        path: "/",
        httpOnly: true,
        secure: process.env.PROFILE !== "dev",
        sameSite: "lax",
      });
    }

    if (result.refreshToken) {
      response.cookies.set(refreshTokenCookieName, result.refreshToken, {
        path: "/",
        httpOnly: true,
        secure: process.env.PROFILE !== "dev",
        sameSite: "lax",
      });
    }

    console.log("[Auth Refresh] Token refreshed successfully");
    return response;
  } catch (e) {
    console.error("[Auth Refresh] Error:", e);
    return NextResponse.json(
      { code: "REFRESH_ERROR", message: "Token refresh error" },
      { status: 500 }
    );
  }
}
