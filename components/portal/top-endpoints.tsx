"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TopEndpoint } from "@/lib/analytics-types";

interface TopEndpointsProps {
  data?: TopEndpoint[] | null;
  isLoading?: boolean;
}

export function TopEndpoints({ data, isLoading }: TopEndpointsProps) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="px-4 py-3 pb-1">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const endpoints = (data ?? []).slice(0, 5);

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="px-4 py-3 pb-1">
        <CardTitle className="text-sm font-medium text-foreground">
          Top Endpoints
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs h-8">Endpoint</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right h-8">
                Requests
              </TableHead>
              <TableHead className="text-muted-foreground text-xs text-right h-8">
                Avg Latency
              </TableHead>
              <TableHead className="text-muted-foreground text-xs text-right h-8">
                Error Rate
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-12 text-center text-sm text-muted-foreground"
                >
                  No data available.
                </TableCell>
              </TableRow>
            ) : (
              endpoints.map((ep) => (
                <TableRow key={ep.endpoint} className="border-border">
                  <TableCell className="font-mono text-xs text-foreground py-2">
                    {ep.endpoint}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground text-right py-2">
                    {ep.count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground text-right py-2">
                    {ep.avgLatency}ms
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <Badge
                      variant="outline"
                      className={
                        ep.errorRate > 5
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : ep.errorRate > 1
                            ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-primary/10 text-primary border-primary/20"
                      }
                    >
                      {ep.errorRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
