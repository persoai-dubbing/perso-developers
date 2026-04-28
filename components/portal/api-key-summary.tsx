"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiKeyApi, type ApiKey } from "@/lib/api";

const MAX_DISPLAY = 3;

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function StatusBadge({ status }: { status: ApiKey["status"] }) {
  const variants: Record<string, string> = {
    active: "bg-primary/10 text-primary border-primary/20",
    expired: "bg-warning/10 text-warning border-warning/20",
    revoked: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const labels: Record<string, string> = {
    active: "Active",
    expired: "Expired",
    revoked: "Revoked",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", variants[status])}>
      {labels[status]}
    </Badge>
  );
}

export function ApiKeySummary() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiKeyApi
      .getList()
      .then((res) => setApiKeys(res.result))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="px-4 py-2 pb-1">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="px-4 pb-2">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const displayKeys = apiKeys.slice(0, MAX_DISPLAY);

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="px-4 py-2 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            API Keys
          </CardTitle>
          <Link
            href="/api-keys"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Manage
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        {apiKeys.length === 0 ? (
          <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
            No API Keys
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs h-7">Name</TableHead>
                  <TableHead className="text-muted-foreground text-xs h-7">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs h-7">Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayKeys.map((key) => (
                  <TableRow key={key.seq} className="border-border">
                    <TableCell className="font-medium text-foreground text-xs py-1.5">
                      {key.apiKeyName || "-"}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <StatusBadge status={key.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-1.5">
                      {formatDate(key.expireDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {apiKeys.length > MAX_DISPLAY && (
              <p className="mt-1 text-center text-xs text-muted-foreground">
                +{apiKeys.length - MAX_DISPLAY} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
