import { NextRequest, NextResponse } from "next/server";
import { fetchOverviewData, resolveUserContext } from "@/lib/analytics-queries";
import type { TimeRange, OverviewData } from "@/lib/analytics-types";

const EMPTY_OVERVIEW: OverviewData = {
  stats: {
    totalRequests: 0,
    successRate: 0,
    avgLatency: 0,
    errorRate: 0,
    totalRequestsChange: 0,
    successRateChange: 0,
    avgLatencyChange: 0,
    errorRateChange: 0,
  },
  requestsOverTime: [],
  topEndpoints: [],
  recentErrors: [],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = (searchParams.get("timeRange") as TimeRange) || "24h";
    const apiKeysParam = searchParams.get("apiKeys");
    const selectedKeys = apiKeysParam ? apiKeysParam.split(",") : undefined;
    const { apiKeys, userSeq } = await resolveUserContext(request, selectedKeys);
    const tzOffset = parseInt(searchParams.get("tzOffset") || "0", 10);

    const data = await fetchOverviewData({ timeRange, apiKeys, userSeq, tzOffset });
    return NextResponse.json({ result: data });
  } catch (error) {
    console.error("[Analytics Overview Error]:", (error as Error).message);
    return NextResponse.json({ result: EMPTY_OVERVIEW });
  }
}
