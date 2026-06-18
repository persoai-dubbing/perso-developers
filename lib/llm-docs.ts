import {
  apiDocsCategories,
  apiDocsConfig,
  type ApiCategory,
  type ApiGuide,
} from "@/lib/api-docs-data";
import type { ApiEndpointProps } from "@/components/portal/api-endpoint";

function renderGuide(guide: ApiGuide): string {
  const lines: string[] = [];
  lines.push(`### ${guide.title}`);
  lines.push("");
  lines.push(guide.description);
  lines.push("");

  for (const step of guide.steps) {
    const badges: string[] = [];
    if (step.method) badges.push(`[${step.method}]`);
    if (step.auth) badges.push(`Auth: ${step.auth}`);
    const badgeStr = badges.length > 0 ? ` ${badges.join(" ")}` : "";

    lines.push(`**Step ${step.step}: ${step.title}**${badgeStr}`);
    if (step.path) lines.push(`\`${step.path}\``);
    lines.push(step.description);

    if (step.headers) {
      lines.push("Required headers:");
      for (const [k, v] of Object.entries(step.headers)) {
        lines.push(`  ${k}: ${v}`);
      }
    }

    if (step.codeExample) {
      lines.push("```");
      lines.push(step.codeExample);
      lines.push("```");
    }

    if (step.note) lines.push(`> ${step.note}`);
    lines.push("");
  }

  return lines.join("\n");
}

function renderEndpoint(ep: ApiEndpointProps): string {
  const lines: string[] = [];
  lines.push(`### ${ep.method} ${ep.path}`);
  lines.push(`**${ep.title}**`);
  lines.push(ep.description);
  lines.push("");

  if (ep.pathParams?.length) {
    lines.push("Path parameters:");
    for (const p of ep.pathParams) {
      lines.push(
        `  - ${p.name} (${p.type}, ${p.required ? "required" : "optional"}): ${p.description}`,
      );
    }
    lines.push("");
  }

  if (ep.queryParams?.length) {
    lines.push("Query parameters:");
    for (const p of ep.queryParams) {
      let desc = `  - ${p.name} (${p.type}, ${p.required ? "required" : "optional"}): ${p.description}`;
      if (p.default) desc += ` (default: ${p.default})`;
      if (p.enum) desc += ` [${p.enum.join(", ")}]`;
      lines.push(desc);
    }
    lines.push("");
  }

  if (ep.requestBody) {
    lines.push("Request body:");
    for (const f of ep.requestBody.fields) {
      let desc = `  - ${f.name} (${f.type}, ${f.required ? "required" : "optional"}): ${f.description}`;
      if (f.default) desc += ` (default: ${f.default})`;
      if (f.enum) desc += ` [${f.enum.join(", ")}]`;
      lines.push(desc);
    }
    lines.push("");
    lines.push("Request example:");
    lines.push("```json");
    lines.push(ep.requestBody.example);
    lines.push("```");
    lines.push("");
  }

  if (ep.response) {
    lines.push(`Response (${ep.response.statusCode}):`);
    lines.push("```json");
    lines.push(ep.response.example);
    lines.push("```");
    lines.push("");
  }

  if (ep.errors?.length) {
    lines.push("Errors:");
    for (const e of ep.errors) {
      lines.push(`  - ${e.status} ${e.code}: ${e.description}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function renderCategory(cat: ApiCategory): string {
  const lines: string[] = [];
  lines.push(`## ${cat.title}`);
  lines.push(cat.description);
  lines.push("");

  if (cat.guides?.length) {
    for (const guide of cat.guides) {
      lines.push(renderGuide(guide));
    }
  }

  for (const ep of cat.endpoints) {
    lines.push(renderEndpoint(ep));
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

const CRITICAL_RULES = `## CRITICAL RULES (read before writing any code)

These are the most common failure points. Apply them by default.

1. **Authentication header is \`XP-API-KEY\`, not \`Authorization: Bearer\`.**
   - Every request to ${apiDocsConfig.apiBaseUrl} must include \`XP-API-KEY: <your-key>\`.
   - Bearer JWT is never used for this API.

2. **Multi-tenancy via \`spaceSeq\`.**
   - Most domain endpoints require a \`spaceSeq\` (Space ID) in the request body or query.
   - Missing \`spaceSeq\` is the #1 cause of empty lists or 404s — when in doubt, pass it explicitly.

3. **File upload is a 3-step flow, not a single call.**
   Do NOT try to attach binary files to Dubbing/STT/Lip-Sync requests directly. First produce a \`mediaSeq\`:
   \`\`\`
   Step 1:  GET  /file/api/upload/sas-token?fileName=<URL-encoded name>
                -> { blobSasUrl }          (valid 30 minutes)
   Step 2:  PUT  {blobSasUrl}              (direct to Azure Blob, NOT ${apiDocsConfig.apiBaseUrl})
                Headers: x-ms-blob-type: BlockBlob
                Body: raw file bytes
                DO NOT send XP-API-KEY on this request.
                201 on success. 403 = SAS expired, go back to Step 1.
   Step 3:  PUT /file/api/upload/video   (or /audio)
                Body: { "fileUrl": "<blobSasUrl with the '?...' query string stripped>", ... }
                -> { "seq": <number> }    // use this as mediaSeq in downstream APIs
   \`\`\`
   For YouTube/TikTok/Drive URLs, use the External flow instead: \`external/metadata\` → \`media/validate\` → \`upload/video/external\`.

4. **Long-running jobs return an ID — poll it.**
   - Dubbing, STT, Lip-Sync, TTS create a project and return immediately with a \`projectId\` (status \`PENDING\`).
   - Poll \`GET /.../projects/{projectId}\` every 2–5 seconds (exponential backoff recommended) until status is \`COMPLETED\` or \`FAILED\`.
   - Never block an HTTP handler on the polling loop — use a background worker/queue.

5. **Response file paths resolve against \`${apiDocsConfig.storageBaseUrl}\`, not the API base.**
   - Fields like \`videoFilePath\`, \`audioFilePath\`, \`thumbnailFilePath\` contain relative paths under \`/perso-storage/...\`.
   - Prepend \`${apiDocsConfig.storageBaseUrl}\` (not \`${apiDocsConfig.apiBaseUrl}\`) to download the file.

6. **HTTP error codes follow a predictable map.**
   - 401 = \`XP-API-KEY\` header missing, misspelled, or key is Expired/Revoked.
   - 403 = key is valid but lacks permission on this Space.
   - 404 = usually \`spaceSeq\` or resource ID wrong. Verify the IDs before assuming the endpoint is broken.
   - 429 = rate limited. Back off exponentially.
   - 5xx = retry with backoff; include the Request ID from Usage logs when escalating.

7. **\`fileName\` for SAS token must be URL-encoded.** Spaces, Korean/Japanese characters, parentheses all need encoding.

---

`;

export function generateLlmDocs(): string {
  const lines: string[] = [];

  lines.push("# Perso AI API Documentation");
  lines.push("");
  lines.push(`API Base URL: ${apiDocsConfig.apiBaseUrl}`);
  lines.push(`Service/File URL: ${apiDocsConfig.storageBaseUrl}`);
  lines.push(
    `Authentication: Include \`${apiDocsConfig.authHeader}\` header in every request.`,
  );
  lines.push(`API Key format: ${apiDocsConfig.keyFormat}`);
  lines.push("");
  lines.push("Example:");
  lines.push("```");
  lines.push(
    `curl -X GET ${apiDocsConfig.apiBaseUrl}/video-translator/api/v1/languages \\`,
  );
  lines.push(`  -H "XP-API-KEY: pk_live_xxxxxxxxxxxxxxxxxxxx"`);
  lines.push("```");
  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push(CRITICAL_RULES);

  const categoryOrder = [
    "space",
    "file",
    "dubbing",
    "editing",
    "usage",
    "lip-sync",
    "stt",
    "audio-separation",
    "language",
    "feedback",
    "community-spotlight",
  ];

  for (const slug of categoryOrder) {
    const cat = apiDocsCategories[slug];
    if (cat) {
      lines.push(renderCategory(cat));
    }
  }

  return lines.join("\n");
}
