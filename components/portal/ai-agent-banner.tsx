"use client";

import { useState } from "react";
import { Bot, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const LLM_URL = "https://developers.perso.ai/llms.txt";

export function AiAgentBanner() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(LLM_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-md bg-primary/10 p-1.5">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Using an AI coding agent (Cursor, Claude Code, Windsurf, etc.)?
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Point it at this URL — it contains the full API spec plus the gotchas that normal docs crawling misses.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded bg-background border border-border px-2 py-1 text-xs font-mono text-primary break-all">
              {LLM_URL}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy URL
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
