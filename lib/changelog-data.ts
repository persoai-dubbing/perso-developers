export type ChangelogKind = "Added" | "Changed" | "Deprecated" | "Removed";

export interface ChangelogEntry {
  /** Release date (YYYY-MM-DD). Add entries when the change ships, not in advance. */
  date: string;
  /** Release version the change shipped in, e.g. "1.0.15". */
  version?: string;
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

/**
 * Newest first. Only changes that affect API integrations belong here (contract changes,
 * new endpoints, corrected reference behavior). Portal-only UI changes are left out.
 * The UI and llms.txt derive from this list.
 */
export const changelog: ChangelogEntry[] = [
  {
    date: "2026-09-29",
    kind: "Changed",
    area: "Dubbing API",
    summary: "TTS models renamed: AUDIO_ENGINE_V3 → ORIOLE, ELEVEN_V2 → WREN, ELEVEN_V3 → DODO. Responses (supportedTtsModels, project ttsModel) return the new names; requests still accept the old names.",
    migration: "Compare against the new names when reading responses. Send the new names in requests.",
    href: "/docs/dubbing#translate",
  },
  {
    date: "2026-09-29",
    kind: "Added",
    area: "Dubbing API",
    summary: "NIGHTINGALE TTS model (end-to-end dubbing with cloned voices, 6 credits per second) with targetLanguages[].cloningStrength. Estimate Quota Usage gains translateType, ttsModelCounts, projectSeq and exportCount.",
    href: "/docs/dubbing#translate",
  },
  {
    date: "2026-09-16",
    version: "1.0.15",
    kind: "Added",
    area: "Editing API",
    summary: "Bulk Change Speakers endpoint (POST .../speakers/bulk-change) moves every script of one speaker to another in a single call.",
    href: "/docs/editing#bulk-change-speakers",
  },
  {
    date: "2026-09-16",
    version: "1.0.15",
    kind: "Changed",
    area: "Dubbing API",
    summary: "Request examples now use AUDIO_ENGINE_V3 as the recommended ttsModel (Expressive, supported by all languages). ttsModel and supportedTtsModels now show a description per value.",
    href: "/docs/dubbing#translate",
  },
  {
    date: "2026-08-10",
    version: "1.0.14",
    kind: "Changed",
    area: "File API",
    summary: "Validate Media minimum media duration corrected from 5 seconds to 1 second (error F4009).",
    href: "/docs/file#validate-media",
  },
  {
    date: "2026-07-23",
    version: "1.0.13",
    kind: "Added",
    area: "Editing API",
    summary: "Add Speaker from Sentence endpoint (POST .../speakers/from-sentence) clones a voice from a reference sentence and adds it as a new speaker.",
    href: "/docs/editing#add-speaker-from-sentence",
  },
  {
    date: "2026-07-21",
    version: "1.0.12",
    kind: "Changed",
    area: "Dubbing API",
    summary: "ttsModel must be one of the target language's supportedTtsModels, otherwise 400 VT4009. AUDIO_ENGINE_V3 added to the ttsModel values; supportedTtsModels and languageTag documented on the Language API.",
    href: "/docs/language#get-languages",
  },
  {
    date: "2026-07-21",
    version: "1.0.12",
    kind: "Changed",
    area: "General",
    summary: "Error formats documented as actually returned: gateway G0001/A0010, domain code/detailCode, and RFC 7807 parameter errors. 14 response specs aligned with production (creation status 200, projectSpeakerSeq, relative /perso-storage/... paths).",
    href: "/docs/authentication",
  },
  {
    date: "2026-07-21",
    version: "1.0.12",
    kind: "Added",
    area: "General",
    summary: "/connect page lets the perso-dubbing plugin obtain an API key in one click.",
    href: "/docs/authentication",
  },
  {
    date: "2026-06-18",
    version: "1.0.9",
    kind: "Changed",
    area: "General",
    summary: "Response examples no longer show a result wrapper; they match the top-level shape the API returns.",
    href: "/docs",
  },
  {
    date: "2026-06-18",
    version: "1.0.9",
    kind: "Changed",
    area: "File API",
    summary: "Download target values realigned: video, originalSubtitle, translatedSubtitle removed; audioScript, scriptTimestamps, originalSubBackground added. media_type values are lowercase (video, audio). File register step is PUT.",
    href: "/docs/file#download",
  },
  {
    date: "2026-05-20",
    version: "1.0.8",
    kind: "Deprecated",
    area: "Dubbing API",
    summary: "Translate request fields targetLanguageCodes and top-level ttsModel (deprecated since 2026-05-14).",
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
