import { NextRequest, NextResponse } from "next/server";
import { fetchRequestLogs, resolveUserContext } from "@/lib/analytics-queries";
import type { TimeRange, RequestLogsResponse } from "@/lib/analytics-types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = (searchParams.get("timeRange") as TimeRange) || "24h";
    const apiKeysParam = searchParams.get("apiKeys");
    const selectedKeys = apiKeysParam ? apiKeysParam.split(",") : undefined;
    const { apiKeys, userSeq } = await resolveUserContext(request, selectedKeys);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const statusFilter = searchParams.get("statusFilter") || undefined;
    const methodFilter = searchParams.get("methodFilter") || undefined;

    const data = await fetchRequestLogs({
      timeRange,
      apiKeys,
      userSeq,
      page,
      pageSize,
      search,
      statusFilter,
      methodFilter,
    });
    return NextResponse.json({ result: data });
  } catch (error) {
    console.error("[Analytics Logs Error]:", (error as Error).message);
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") || "20", 10);
    const empty: RequestLogsResponse = { logs: [], total: 0, page, pageSize };
    return NextResponse.json({ result: empty });
  }
}
