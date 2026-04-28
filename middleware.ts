import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const parts = accept.split(",").map((s) => {
    const [type, ...params] = s.trim().split(";").map((p) => p.trim());
    const qParam = params.find((p) => p.startsWith("q="));
    const q = qParam ? parseFloat(qParam.slice(2)) : 1;
    return { type, q: isNaN(q) ? 1 : q };
  });
  let mdQ = 0;
  let htmlQ = 0;
  for (const { type, q } of parts) {
    if (type === "text/markdown" || type === "text/plain") mdQ = Math.max(mdQ, q);
    if (type === "text/html") htmlQ = Math.max(htmlQ, q);
  }
  return mdQ > 0 && mdQ >= htmlQ;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/" || pathname.startsWith("/overview") || pathname.startsWith("/docs")) {
    const accept = req.headers.get("accept");
    if (prefersMarkdown(accept)) {
      const url = req.nextUrl.clone();
      url.pathname = "/llms.txt";
      url.search = "";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/overview/:path*", "/docs/:path*"],
};
