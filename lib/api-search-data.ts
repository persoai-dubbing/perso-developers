import { apiDocsCategories } from "./api-docs-data";

export interface ApiSearchItem {
  category: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  title: string;
  path: string;
  href: string;
}

const categoryDisplayNames: Record<string, string> = {
  space: "Space",
  file: "Media",
  dubbing: "Dubbing",
  editing: "Editing",
  usage: "Usage",
  "lip-sync": "Lip Sync",
  stt: "STT",
  "audio-separation": "Audio Separation",
  language: "Language",
  feedback: "Feedback",
  "community-spotlight": "Community Spotlight",
};

export const apiSearchData: ApiSearchItem[] = Object.entries(
  apiDocsCategories
).flatMap(([slug, category]) =>
  category.endpoints.map((ep) => ({
    category: categoryDisplayNames[slug] ?? slug,
    method: ep.method,
    title: ep.title,
    path: ep.path,
    href: `/docs/${slug}#${ep.id}`,
  }))
);
