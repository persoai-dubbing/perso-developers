export type ChangelogKind = "Added" | "Changed" | "Deprecated" | "Removed";

export interface ChangelogEntry {
  /** Effective date (YYYY-MM-DD). Add entries when the change ships, not in advance. */
  date: string;
  kind: ChangelogKind;
  /** API area, e.g. "Dubbing API". */
  area: string;
  /** Short description of the change. */
  summary: string;
  /** What to do instead, if applicable. */
  migration?: string;
  /** Link to the affected reference section. */
  href?: string;
}

/** Newest first. Keep one entry per change; UI and llms.txt derive from this list. */
export const changelog: ChangelogEntry[] = [
  {
    date: "2026-07-23",
    kind: "Added",
    area: "Editing API",
    summary: "Add Speaker from Sentence endpoint.",
    href: "/docs/editing#add-speaker-from-sentence",
  },
  {
    date: "2026-05-14",
    kind: "Deprecated",
    area: "Dubbing API",
    summary: "Translate request fields targetLanguageCodes and top-level ttsModel.",
    migration: "Use targetLanguages with a per-language ttsModel.",
    href: "/docs/dubbing#translate",
  },
  {
    date: "2026-04-28",
    kind: "Added",
    area: "General",
    summary: "Initial public release of the Perso AI API documentation.",
    href: "/docs",
  },
];
