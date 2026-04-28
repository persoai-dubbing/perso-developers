"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  ChevronDown,
  Search,

  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestLogEntry, RequestLogsResponse, Timezone } from "@/lib/analytics-types";

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300)
    return "bg-primary/10 text-primary border-primary/20";
  if (status >= 400 && status < 500)
    return "bg-warning/10 text-warning border-warning/20";
  if (status >= 500)
    return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted text-muted-foreground";
};

const getMethodColor = (method: string) => {
  const colors: Record<string, string> = {
    GET: "text-blue-700",
    POST: "text-green-700",
    PUT: "text-amber-700",
    DELETE: "text-red-700",
    PATCH: "text-purple-700",
  };
  return colors[method] || "text-muted-foreground";
};

function tryParseJson(str: string): string {
  if (!str || str === "-") return str;
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

interface RequestLogsProps {
  data?: RequestLogsResponse | null;
  isLoading?: boolean;
  searchQuery?: string;
  statusFilter?: string;
  methodFilter?: string;
  timezone?: Timezone;
  onSearchChange?: (search: string) => void;
  onStatusFilterChange?: (filter: string) => void;
  onMethodFilterChange?: (filter: string) => void;
  onPageChange?: (page: number) => void;
}

export function RequestLogs({
  data,
  isLoading,
  searchQuery = "",
  statusFilter = "all",
  methodFilter = "all",
  timezone = "UTC",
  onSearchChange,
  onStatusFilterChange,
  onMethodFilterChange,
  onPageChange,
}: RequestLogsProps) {
  const [selectedLog, setSelectedLog] = useState<RequestLogEntry | null>(null);

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const pageSize = data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Request Logs
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor your API requests and responses in real-time
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-secondary gap-1.5">
                {methodFilter === "all"
                  ? "Method"
                  : methodFilter.split(",").join(", ")}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {["GET", "POST", "PUT", "DELETE", "PATCH"].map((method) => {
                const allMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
                const current = methodFilter === "all" ? [] : methodFilter.split(",");
                const checked = current.includes(method);

                return (
                  <DropdownMenuCheckboxItem
                    key={method}
                    checked={checked}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() => {
                      const next = checked
                        ? current.filter((v) => v !== method)
                        : [...current, method];
                      onMethodFilterChange?.(next.length === 0 || next.length === allMethods.length ? "all" : next.join(","));
                    }}
                  >
                    <span className={cn("font-medium", getMethodColor(method))}>{method}</span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full sm:w-64 bg-secondary pl-9"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-secondary p-1">
            {[
              { value: "all", label: "All" },
              { value: "2xx", label: "2XX" },
              { value: "4xx", label: "4XX" },
              { value: "5xx", label: "5XX" },
            ].map((item) => {
              const selected = statusFilter === "all"
                ? item.value === "all"
                : item.value === "all"
                  ? false
                  : statusFilter.split(",").includes(item.value);

              const handleClick = () => {
                if (item.value === "all") {
                  onStatusFilterChange?.("all");
                  return;
                }
                const current = statusFilter === "all" ? [] : statusFilter.split(",");
                const next = current.includes(item.value)
                  ? current.filter((v) => v !== item.value)
                  : [...current, item.value];
                onStatusFilterChange?.(next.length === 0 || next.length === 3 ? "all" : next.join(","));
              };

              return (
                <button
                  key={item.value}
                  onClick={handleClick}
                  className={cn(
                    "rounded px-3 py-1 text-sm font-medium transition-colors",
                    selected
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Timestamp</TableHead>
              <TableHead className="text-muted-foreground">Method</TableHead>
              <TableHead className="text-muted-foreground">Endpoint</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Latency</TableHead>
              <TableHead className="text-muted-foreground">API Key</TableHead>
              <TableHead className="text-right text-muted-foreground">
                Details
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              : logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-border cursor-pointer hover:bg-secondary/50"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {new Date(log.timestamp).toLocaleString("en-US", { timeZone: timezone === "KST" ? "Asia/Seoul" : "UTC" })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          getMethodColor(log.method)
                        )}
                      >
                        {log.method}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground max-w-[240px] truncate">
                      {log.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono",
                          getStatusColor(log.statusCode)
                        )}
                      >
                        {log.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.latency}ms
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {log.apiKey}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && logs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No request logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => onPageChange?.(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(totalPages)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-3 pr-8">
              <span
                className={cn(
                  "font-semibold",
                  getMethodColor(selectedLog?.method || "")
                )}
              >
                {selectedLog?.method}
              </span>
              <span className="font-mono text-sm text-muted-foreground truncate">
                {selectedLog?.endpoint}
              </span>
              {selectedLog && (
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-auto shrink-0 font-mono",
                    getStatusColor(selectedLog.statusCode)
                  )}
                >
                  {selectedLog.statusCode}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</p>
                <p className="text-sm text-foreground font-mono">
                  {selectedLog &&
                    new Date(selectedLog.timestamp).toLocaleString("en-US", { timeZone: timezone === "KST" ? "Asia/Seoul" : "UTC" })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Latency</p>
                <p className="text-sm text-foreground font-mono">
                  {selectedLog?.latency}ms
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">API Key</p>
                <p className="text-sm text-foreground font-mono truncate">
                  {selectedLog?.apiKey}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Client IP</p>
                <p className="text-sm text-foreground font-mono">
                  {selectedLog?.clientIp}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Request ID</p>
                <p className="text-sm text-foreground font-mono truncate">
                  {selectedLog?.id}
                </p>
              </div>
            </div>

            {/* Request Payload */}
            {selectedLog?.requestPayload && selectedLog.requestPayload !== "-" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Request Payload</p>
                <pre className="overflow-auto rounded-lg bg-secondary p-4 text-sm text-foreground font-mono max-h-[200px]">
                  {tryParseJson(selectedLog.requestPayload)}
                </pre>
              </div>
            )}

            {/* Error Info - only shown for error responses */}
            {selectedLog && selectedLog.statusCode >= 400 && (
              <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wider">Error Information</p>
                <div className="grid grid-cols-1 gap-3">
                  {selectedLog.errorCode && selectedLog.errorCode !== "-" && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Error Code</p>
                      <p className="text-sm text-foreground font-mono">{selectedLog.errorCode}</p>
                    </div>
                  )}
                  {selectedLog.errorMessage && selectedLog.errorMessage !== "-" && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Error Message</p>
                      <p className="text-sm text-foreground">{selectedLog.errorMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
