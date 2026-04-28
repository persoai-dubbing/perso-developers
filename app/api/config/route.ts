import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    apiBaseUrl: process.env.BACKEND_API_URL ?? "",
    profile: process.env.PROFILE ?? "",
    accessTokenCookieName: process.env.ACCESS_TOKEN_COOKIE_NAME ?? "",
    refreshTokenCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME ?? "",
    clientId: process.env.CLIENT_ID ?? "",
    loginLink: process.env.PERSO_SERVICE_URL ?? "",
  });
}
