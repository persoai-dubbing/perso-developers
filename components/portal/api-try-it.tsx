"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/portal/code-block";
import { cn } from "@/lib/utils";
import { getConfig } from "@/lib/api";
import type { ApiEndpointProps } from "@/components/portal/api-endpoint";

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  POST: "bg-green-100 text-green-700 hover:bg-green-100",
  PUT: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  PATCH: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  DELETE: "bg-red-100 text-red-700 hover:bg-red-100",
};

interface ApiTryItProps extends ApiEndpointProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiTryIt({
  open,
  onOpenChange,
  method,
  path,
  title,
  pathParams,
  queryParams,
  requestBody,
}: ApiTryItProps) {
  const [apiKey, setApiKey] = useState("");
  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [bodyValue, setBodyValue] = useState(requestBody?.example ?? "");
  const [response, setResponse] = useState<{
    status: number;
    body: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState("");

  // Fetch backend base URL (캐싱된 config 사용)
  useEffect(() => {
    getConfig()
      .then((config) => setApiBaseUrl(config.apiBaseUrl))
      .catch(() => {});
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setResponse(null);
      setLoading(false);
    }
  }, [open]);

  const resolvedPath = useMemo(() => {
    let resolved = path;
    for (const [key, value] of Object.entries(pathValues)) {
      if (value) {
        resolved = resolved.replace(`{${key}}`, value);
      }
    }
    return resolved;
  }, [path, pathValues]);

  const resolvedUrl = useMemo(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryValues)) {
      if (value) params.append(key, value);
    }
    const qs = params.toString();
    return qs ? `${resolvedPath}?${qs}` : resolvedPath;
  }, [resolvedPath, queryValues]);

  const curlSnippet = useMemo(() => {
    const lines = [`curl -X ${method} "${apiBaseUrl}${resolvedUrl}"`];
    lines.push(`     -H "XP-API-KEY: ${apiKey || "<your-api-key>"}"`);
    if (
      bodyValue &&
      method !== "GET" &&
      method !== "HEAD" &&
      method !== "DELETE"
    ) {
      lines.push(`     -H "Content-Type: application/json"`);
      lines.push(`     -d '${bodyValue.replace(/\n/g, "").replace(/\s{2,}/g, " ")}'`);
    }
    return lines.join(" \\\n");
  }, [method, resolvedUrl, apiKey, bodyValue, apiBaseUrl]);


  const sendRequest = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    try {
      const headers: Record<string, string> = {};
      if (apiKey) headers["XP-API-KEY"] = apiKey;
      headers["Content-Type"] = "application/json";

      const fetchOptions: RequestInit = { method, headers };
      if (
        bodyValue &&
        method !== "GET" &&
        method !== "HEAD" &&
        method !== "DELETE"
      ) {
        fetchOptions.body = bodyValue;
      }

      const res = await fetch(`/proxy${resolvedUrl}`, fetchOptions);
      const text = await res.text();
      let formatted = text;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // keep raw text
      }
      setResponse({ status: res.status, body: formatted });
    } catch (err) {
      setResponse({
        status: 0,
        body: `Request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    } finally {
      setLoading(false);
    }
  }, [method, resolvedUrl, apiKey, bodyValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-3">
            <Badge className={cn("font-mono text-xs", methodColors[method])}>
              {method}
            </Badge>
            <span className="text-sm font-normal text-muted-foreground">
              {title}
            </span>
          </DialogTitle>
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
            <Badge
              className={cn(
                "font-mono text-[10px] px-1.5 shrink-0",
                methodColors[method]
              )}
            >
              {method}
            </Badge>
            <code className="text-sm text-foreground break-all">
              {resolvedUrl}
            </code>
          </div>
        </DialogHeader>

        {/* Body - two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border overflow-auto max-h-[calc(90vh-120px)]">
          {/* Left: Parameters form */}
          <div className="p-6 space-y-5 overflow-auto">
            {/* Headers */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Headers
              </h4>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-mono text-foreground shrink-0">
                    XP-API-KEY
                  </label>
                  <Input
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="h-8 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Path Parameters */}
            {pathParams && pathParams.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Path Parameters
                </h4>
                <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
                  {pathParams.map((param) => (
                    <div key={param.name} className="flex items-center gap-3">
                      <label className="text-sm font-mono text-foreground shrink-0 min-w-[100px]">
                        {param.name}
                        {param.required && (
                          <span className="text-red-400 ml-0.5">*</span>
                        )}
                      </label>
                      <Input
                        placeholder={param.description}
                        value={pathValues[param.name] ?? ""}
                        onChange={(e) =>
                          setPathValues((prev) => ({
                            ...prev,
                            [param.name]: e.target.value,
                          }))
                        }
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Query Parameters */}
            {queryParams && queryParams.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Query Parameters
                </h4>
                <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
                  {queryParams.map((param) => (
                    <div key={param.name} className="flex items-center gap-3">
                      <label className="text-sm font-mono text-foreground shrink-0 min-w-[100px]">
                        {param.name}
                        {param.required && (
                          <span className="text-red-400 ml-0.5">*</span>
                        )}
                      </label>
                      <Input
                        placeholder={
                          param.default
                            ? `Default: ${param.default}`
                            : param.description
                        }
                        value={queryValues[param.name] ?? ""}
                        onChange={(e) =>
                          setQueryValues((prev) => ({
                            ...prev,
                            [param.name]: e.target.value,
                          }))
                        }
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Body */}
            {requestBody && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Body Parameters
                </h4>
                <div className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
                  <textarea
                    value={bodyValue}
                    onChange={(e) => setBodyValue(e.target.value)}
                    className="w-full bg-transparent p-4 text-sm font-mono text-foreground outline-none resize-y min-h-[120px]"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Code preview + Response */}
          <div className="p-6 space-y-4 bg-secondary/20 overflow-auto">
            {/* Request code */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Request
              </h4>
              <CodeBlock
                id="try-it-curl"
                language="bash"
                code={curlSnippet}
              />
            </div>

            {/* Response */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Response
                {response && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-4 ml-2",
                      response.status >= 200 && response.status < 300
                        ? "border-green-300 text-green-700"
                        : "border-red-300 text-red-700"
                    )}
                  >
                    {response.status}
                  </Badge>
                )}
              </h4>
              {response ? (
                <CodeBlock
                  id="try-it-response"
                  language="json"
                  code={response.body}
                />
              ) : (
                <div className="rounded-lg bg-secondary p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Click &quot;Send request&quot; to see the response
                  </p>
                </div>
              )}
            </div>

            {/* Send button */}
            <Button
              onClick={sendRequest}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Send request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
