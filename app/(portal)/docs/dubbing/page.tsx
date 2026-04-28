"use client";

import { useApiDocs } from "@/hooks/use-api-docs";
import { ApiEndpoint, ApiToc } from "@/components/portal/api-endpoint";
import { deriveTocItems } from "@/lib/api-docs-data";
import { ApiDocSkeleton } from "@/components/portal/api-doc-skeleton";

export default function DubbingPage() {
  const { data, isLoading } = useApiDocs("dubbing");
  if (isLoading || !data) return <ApiDocSkeleton />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {data.title}
        </h1>
        <p className="text-muted-foreground text-lg">{data.description}</p>
      </div>

      <ApiToc items={deriveTocItems(data.endpoints)} />

      <div className="space-y-6">
        {data.endpoints.map((ep) => (
          <ApiEndpoint key={ep.id} {...ep} />
        ))}
      </div>
    </div>
  );
}
