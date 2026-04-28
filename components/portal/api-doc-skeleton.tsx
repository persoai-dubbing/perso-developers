import { Skeleton } from "@/components/ui/skeleton";

export function ApiDocSkeleton() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="border-b border-border px-6 py-4">
              <Skeleton className="h-6 w-56 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-4 w-full mt-3" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
              <div className="p-6 space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="p-6 space-y-4 bg-secondary/20">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
