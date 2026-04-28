import type { MetadataRoute } from "next";

const BASE_URL = "https://developers.perso.ai";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/api/docs/llm"],
        disallow: ["/proxy/", "/api/auth/", "/api/analytics/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
