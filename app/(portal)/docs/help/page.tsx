"use client";

import { useEffect, useState } from "react";
import {
  ApiFlowGuide,
  GuideToc,
  type GuideTocItem,
} from "@/components/portal/api-flow-guide";
import type { ApiCategory, ApiGuide } from "@/lib/api-docs-data";

export default function HelpPage() {
  const [guides, setGuides] = useState<
    { categoryTitle: string; guides: ApiGuide[] }[]
  >([]);
  const [tocItems, setTocItems] = useState<GuideTocItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGuides() {
      try {
        const res = await fetch("/api/docs");
        if (!res.ok) return;
        const json = await res.json();
        const categories: Record<string, ApiCategory> = json.result;

        const result: { categoryTitle: string; guides: ApiGuide[] }[] = [];
        const toc: GuideTocItem[] = [];
        for (const cat of Object.values(categories)) {
          if (cat.guides && cat.guides.length > 0) {
            result.push({ categoryTitle: cat.title, guides: cat.guides });
            for (const g of cat.guides) {
              toc.push({
                id: g.id,
                title: g.title,
                categoryTitle: cat.title,
              });
            }
          }
        }
        setGuides(result);
        setTocItems(toc);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGuides();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-4" />
        <div className="h-4 w-96 bg-muted rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 bg-muted rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Workflow Guide
        </h1>
        <p className="text-muted-foreground text-lg">
          Step-by-step guides for common API workflows. Follow these to
          integrate file uploads, dubbing, and other features.
        </p>
      </div>

      {tocItems.length > 0 && <GuideToc items={tocItems} />}

      <div className="space-y-10">
        {guides.map(({ categoryTitle, guides: catGuides }) => (
          <div key={categoryTitle}>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {categoryTitle}
            </h2>
            <div className="space-y-4">
              {catGuides.map((guide) => (
                <ApiFlowGuide key={guide.id} guide={guide} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
