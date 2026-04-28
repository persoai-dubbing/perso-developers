import { useState, useEffect } from "react";
import type { ApiCategory } from "@/lib/api-docs-data";

const cache = new Map<string, ApiCategory>();

export function useApiDocs(category: string) {
  const [data, setData] = useState<ApiCategory | null>(
    () => cache.get(category) ?? null
  );
  const [isLoading, setIsLoading] = useState(!cache.has(category));

  useEffect(() => {
    if (cache.has(category)) {
      setData(cache.get(category)!);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchDocs() {
      try {
        const res = await fetch(`/api/docs?category=${category}`);
        if (!res.ok) throw new Error("Failed to fetch docs");
        const json = await res.json();
        cache.set(category, json.result);
        if (!cancelled) {
          setData(json.result);
        }
      } catch {
        if (!cancelled) {
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchDocs();
    return () => {
      cancelled = true;
    };
  }, [category]);

  return { data, isLoading };
}
