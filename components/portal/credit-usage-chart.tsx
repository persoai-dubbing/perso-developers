"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  creditApi,
  spaceApi,
  type CreditHistoryItem,
} from "@/lib/api";

interface DailyCredit {
  date: string;
  used: number;
  earned: number;
}

function aggregateByDate(items: CreditHistoryItem[]): DailyCredit[] {
  const map = new Map<string, { used: number; earned: number }>();

  for (const item of items) {
    const date = new Date(item.createDate).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
    });

    const entry = map.get(date) ?? { used: 0, earned: 0 };
    if (item.actionType === "redeem") {
      entry.used += Math.abs(item.credit);
    } else if (item.actionType === "earn") {
      entry.earned += item.credit;
    }
    map.set(date, entry);
  }

  return Array.from(map.entries())
    .map(([date, vals]) => ({ date, ...vals }))
    .reverse();
}

export function CreditUsageChart() {
  const [items, setItems] = useState<CreditHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const spacesRes = await spaceApi.getList();
        const spaces = spacesRes.result;
        if (spaces.length === 0) {
          setIsLoading(false);
          return;
        }
        const spaceSeq = spaces[0].spaceSeq;
        const historyRes = await creditApi.getHistory(spaceSeq, "studio");
        setItems(historyRes.result.content);
      } catch {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const chartData = useMemo(() => aggregateByDate(items), [items]);

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="px-4 py-3 pb-1">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <Skeleton className="h-[180px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="px-4 py-3 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            Credit Usage
          </CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-chart-1" />
              <span className="text-muted-foreground">Earned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-chart-5" />
              <span className="text-muted-foreground">Used</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {chartData.length === 0 ? (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            No Data
          </div>
        ) : (
          <div className="notranslate">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="date"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="earned"
                fill="var(--chart-1)"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="used"
                fill="var(--chart-5)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
