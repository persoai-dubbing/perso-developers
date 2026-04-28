"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/portal/code-block";
import { ApiTryIt } from "@/components/portal/api-try-it";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  title: string;
  path: string;
}

export function ApiToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const ids = items.map((item) => item.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (!mounted) return null;

  return createPortal(
    <div className="hidden xl:block fixed right-16 top-1/2 -translate-y-1/2 z-[9999] group/toc">
      {/* Collapsed: indicator bars */}
      <div className="group-hover/toc:hidden flex flex-col items-center gap-1.5 py-4 w-10">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "h-1 rounded-full transition-all duration-200",
              activeId === item.id
                ? cn("w-7 opacity-100", tocBarColors[item.method])
                : cn("w-5 opacity-40", tocBarColors[item.method])
            )}
          />
        ))}
      </div>

      {/* Expanded: full TOC on hover */}
      <div className="hidden group-hover/toc:block">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xl">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Endpoints
          </h3>
          <div className="space-y-0.5">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary/60 group",
                  activeId === item.id && "bg-secondary/80"
                )}
              >
                <Badge
                  className={cn(
                    "font-mono text-[10px] px-1 w-12 justify-center shrink-0",
                    methodColors[item.method]
                  )}
                >
                  {item.method}
                </Badge>
                <span
                  className={cn(
                    "font-medium text-xs group-hover:text-primary whitespace-nowrap",
                    activeId === item.id
                      ? "text-primary font-semibold"
                      : "text-foreground"
                  )}
                >
                  {item.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const tocBarColors: Record<string, string> = {
  GET: "bg-blue-400",
  POST: "bg-green-400",
  PUT: "bg-amber-400",
  PATCH: "bg-purple-400",
  DELETE: "bg-red-400",
};

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  POST: "bg-green-100 text-green-700 hover:bg-green-100",
  PUT: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  PATCH: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  DELETE: "bg-red-100 text-red-700 hover:bg-red-100",
};

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
  enum?: string[];
}

export interface ErrorResponse {
  code: string;
  status: number;
  description: string;
}

export interface ApiEndpointProps {
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  title: string;
  description: string;
  pathParams?: Parameter[];
  queryParams?: Parameter[];
  requestBody?: {
    fields: Parameter[];
    example: string;
  };
  response?: {
    statusCode: number;
    example: string;
  };
  errors?: ErrorResponse[];
}

function ParameterRow({ param }: { param: Parameter }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-2">
        <code className="text-sm font-semibold text-foreground">
          {param.name}
        </code>
        <span className="text-xs text-muted-foreground">{param.type}</span>
        {param.required ? (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 border-red-300 text-red-600"
          >
            required
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 border-border text-muted-foreground"
          >
            optional
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{param.description}</p>
      {param.default && (
        <p className="text-xs text-muted-foreground">
          Default:{" "}
          <code className="rounded bg-secondary px-1 py-0.5 text-foreground">
            {param.default}
          </code>
        </p>
      )}
      {param.enum && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-muted-foreground">Values:</span>
          {param.enum.map((v) => (
            <code
              key={v}
              className="rounded bg-secondary px-1 py-0.5 text-[10px] text-foreground"
            >
              {v}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}

function ParameterSection({
  title,
  params,
}: {
  title: string;
  params: Parameter[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="rounded-lg border border-border bg-secondary/30 px-4">
        {params.map((param) => (
          <ParameterRow key={param.name} param={param} />
        ))}
      </div>
    </div>
  );
}

export function ApiEndpoint({
  id,
  method,
  path,
  title,
  description,
  pathParams,
  queryParams,
  requestBody,
  response,
  errors,
}: ApiEndpointProps) {
  const [tryItOpen, setTryItOpen] = useState(false);

  return (
    <div
      id={id}
      className="rounded-xl border border-border bg-card overflow-hidden scroll-mt-20"
    >
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTryItOpen(true)}
            className="text-xs shrink-0"
          >
            Try it
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("font-mono text-xs", methodColors[method])}>
            {method}
          </Badge>
          <code className="text-sm text-muted-foreground break-all">
            {path}
          </code>
        </div>
        <p className="text-sm text-muted-foreground mt-3">{description}</p>
      </div>

      <ApiTryIt
        open={tryItOpen}
        onOpenChange={setTryItOpen}
        id={id}
        method={method}
        path={path}
        title={title}
        description={description}
        pathParams={pathParams}
        queryParams={queryParams}
        requestBody={requestBody}
        response={response}
        errors={errors}
      />

      {/* Body - two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left: Parameters */}
        <div className="p-6 space-y-5">
          {pathParams && pathParams.length > 0 && (
            <ParameterSection title="Path Parameters" params={pathParams} />
          )}
          {queryParams && queryParams.length > 0 && (
            <ParameterSection title="Query Parameters" params={queryParams} />
          )}
          {requestBody && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Request Body
              </h4>
              <div className="rounded-lg border border-border bg-secondary/30 px-4">
                {requestBody.fields.map((field) => (
                  <ParameterRow key={field.name} param={field} />
                ))}
              </div>
            </div>
          )}
          {errors && errors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Error Responses
              </h4>
              <div className="rounded-lg border border-border bg-secondary/30 px-4">
                {errors.map((err) => (
                  <div
                    key={err.code}
                    className="flex items-center gap-2 py-3 border-b border-border last:border-b-0"
                  >
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 font-mono text-[10px] px-1.5">
                      {err.status}
                    </Badge>
                    <code className="text-xs text-foreground">{err.code}</code>
                    <span className="text-xs text-muted-foreground">
                      {err.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!pathParams?.length &&
            !queryParams?.length &&
            !requestBody &&
            !errors?.length && (
              <p className="text-sm text-muted-foreground italic">
                No parameters required.
              </p>
            )}
        </div>

        {/* Right: Code examples */}
        <div className="p-6 space-y-4 bg-secondary/20">
          {requestBody && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Request Example
              </h4>
              <CodeBlock
                id={`${id}-request`}
                language="json"
                code={requestBody.example}
              />
            </div>
          )}
          {response && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Response{" "}
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 ml-1"
                >
                  {response.statusCode}
                </Badge>
              </h4>
              <CodeBlock
                id={`${id}-response`}
                language="json"
                code={response.example}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
