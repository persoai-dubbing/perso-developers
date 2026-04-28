import type { MetadataRoute } from "next";

const BASE_URL = "https://developers.perso.ai";

const DOCS_PATHS = [
  "/docs",
  "/docs/authentication",
  "/docs/space",
  "/docs/file",
  "/docs/dubbing",
  "/docs/editing",
  "/docs/usage",
  "/docs/lip-sync",
  "/docs/stt",
  "/docs/audio-separation",
  "/docs/language",
  "/docs/feedback",
  "/docs/community-spotlight",
  "/docs/help",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const llm = [
    {
      url: `${BASE_URL}/llms.txt`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
  ];

  const pages = [
    {
      url: `${BASE_URL}/overview`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    ...DOCS_PATHS.map((p) => ({
      url: `${BASE_URL}${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  return [...llm, ...pages];
}
