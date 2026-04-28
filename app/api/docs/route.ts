import { NextRequest, NextResponse } from "next/server";
import { apiDocsCategories } from "@/lib/api-docs-data";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  if (category) {
    const data = apiDocsCategories[category];
    if (!data) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ result: data });
  }

  return NextResponse.json({ result: apiDocsCategories });
}
