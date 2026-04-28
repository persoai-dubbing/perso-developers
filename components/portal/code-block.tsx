"use client";

import { useState } from "react";
import { CheckCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CodeBlock({
  code,
  language,
  id,
}: {
  code: string;
  language: string;
  id: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0 bg-secondary hover:bg-muted"
        >
          {copied ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <pre className="bg-secondary rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-foreground">{code}</code>
      </pre>
      <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
        {language}
      </span>
    </div>
  );
}
