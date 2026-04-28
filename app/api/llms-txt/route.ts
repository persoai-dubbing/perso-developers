import { NextResponse } from "next/server";
import { generateLlmDocs } from "@/lib/llm-docs";

export async function GET() {
  return new NextResponse(generateLlmDocs(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
