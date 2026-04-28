import { NextRequest, NextResponse } from "next/server";
import { fetchChartsData, resolveUserContext } from "@/lib/analytics-queries";
import type { TimeRange, ChartsData } from "@/lib/analytics-types";

const EMPTY_CHARTS: ChartsData = {
  requestsOverTime: [],
  statusDistribution: [],
  latencyPercentiles: [],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = (searchParams.get("timeRange") as TimeRange) || "24h";
    const apiKeysParam = searchParams.get("apiKeys");
    const selectedKeys = apiKeysParam ? apiKeysParam.split(",") : undefined;
    const { apiKeys, userSeq } = await resolveUserContext(request, selectedKeys);
    const tzOffset = parseInt(searchParams.get("tzOffset") || "0", 10);

    const data = await fetchChartsData({ timeRange, apiKeys, userSeq, tzOffset });
    return NextResponse.json({ result: data });
  } catch (error) {
    console.error("[Analytics Charts Error]:", (error as Error).message);
    return NextResponse.json({ result: EMPTY_CHARTS });
  }
}
