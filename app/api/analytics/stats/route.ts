import { NextRequest, NextResponse } from "next/server";
import { fetchStats, resolveUserContext } from "@/lib/analytics-queries";
import type { TimeRange, StatsData } from "@/lib/analytics-types";

const EMPTY_STATS: StatsData = {
  totalRequests: 0,
  successRate: 0,
  avgLatency: 0,
  errorRate: 0,
  totalRequestsChange: 0,
  successRateChange: 0,
  avgLatencyChange: 0,
  errorRateChange: 0,
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = (searchParams.get("timeRange") as TimeRange) || "24h";
    const apiKeysParam = searchParams.get("apiKeys");
    const selectedKeys = apiKeysParam ? apiKeysParam.split(",") : undefined;
    const { apiKeys, userSeq } = await resolveUserContext(request, selectedKeys);

    const data = await fetchStats({ timeRange, apiKeys, userSeq });
    return NextResponse.json({ result: data });
  } catch (error) {
    console.error("[Analytics Stats Error]:", (error as Error).message);
    return NextResponse.json({ result: EMPTY_STATS });
  }
}
