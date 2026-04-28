"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { apiSearchData } from "@/lib/api-search-data";

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-green-100 text-green-700",
  PUT: "bg-amber-100 text-amber-700",
  PATCH: "bg-purple-100 text-purple-700",
  DELETE: "bg-red-100 text-red-700",
};

const categories = [...new Set(apiSearchData.map((item) => item.category))];

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

export function ApiSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setSearch("");
    router.push(href);
  };

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <div
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors w-56"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search APIs...</span>
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-80 z-50 rounded-lg border border-border bg-popover shadow-lg">
          <Command
            filter={(value, search) => {
              if (!search) return 1;
              return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput
              placeholder="Search API endpoints..."
              autoFocus
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-72">
              <CommandEmpty>No results found.</CommandEmpty>
              {categories.map((category) => {
                const items = apiSearchData.filter((item) => item.category === category);
                return (
                  <CommandGroup key={category} heading={category}>
                    {items.map((item) => (
                      <CommandItem
                        key={item.href}
                        value={`${item.title} ${item.method} ${item.path}`}
                        onSelect={() => handleSelect(item.href)}
                        className="cursor-pointer"
                      >
                        <Badge
                          className={cn(
                            "font-mono text-[10px] px-1 w-12 justify-center shrink-0",
                            methodColors[item.method]
                          )}
                        >
                          {item.method}
                        </Badge>
                        <span className="text-sm truncate">
                          <HighlightText text={item.title} query={search} />
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
