# Perso AI API

Integrate **Perso AI** — video translation, AI dubbing, lip-sync, audio separation, STT, and more — into your own applications with a single API key.

This README is the fastest path from **zero → working API call**. For endpoint-level schemas, see the full reference in the Developer Portal under **Docs**.

---

## Quick Start

### 1. Get an API key

1. Sign in to the **Perso Developer Portal**.
2. Open **API Keys → Create API Key**.
3. Copy the key (`pk_live_...`) — it is shown **only once**. Store it somewhere safe (secret manager, `.env`, etc.).

### 2. Make your first request

All APIs share one base URL and are authenticated with the `XP-API-KEY` header.

**Base URL:** `https://api.perso.ai`

```bash
curl -X GET https://api.perso.ai/video-translator/api/v1/languages \
  -H "XP-API-KEY: pk_live_xxxxxxxxxxxxxxxxxxxx"
```

<details>
<summary>Node.js</summary>

```javascript
const res = await fetch(
  "https://api.perso.ai/video-translator/api/v1/languages",
  { headers: { "XP-API-KEY": process.env.PERSO_API_KEY } }
);
const data = await res.json();
```
</details>

<details>
<summary>Python</summary>

```python
import os, requests

res = requests.get(
    "https://api.perso.ai/video-translator/api/v1/languages",
    headers={"XP-API-KEY": os.environ["PERSO_API_KEY"]},
)
print(res.json())
```
</details>

> **Note:** Any `perso-storage://` paths returned by the API resolve under `https://portal-media.perso.ai`.

---

## Authentication

Perso APIs use **API key authentication only** — there is no OAuth flow or Bearer token. Send your key on every request:

```
XP-API-KEY: pk_live_xxxxxxxxxxxxxxxxxxxx
```

**Best practices**

- Keep keys **server-side**. Never ship them in mobile apps, browser bundles, or public repos.
- Load from environment variables or a secret manager.
- If a key leaks, **rotate it immediately** from the portal.
- Missing or invalid keys return `401 Unauthorized`.

---

## What You Can Build

| Domain | What it does |
|---|---|
| **Video Translator** | Translate and dub videos across languages |
| **Dubbing** | AI voice dubbing with voice cloning |
| **Lip Sync** | Sync speech to on-screen lip movement |
| **Audio Separation** | Split vocals, background music, and effects |
| **STT** | Speech-to-text transcription |
| **Editing** | Programmatic post-production edits |
| **File / Upload** | Upload source media and manage assets |
| **Space** | Multi-tenant workspace management |
| **Language** | Supported language metadata |

Full request/response schemas and live examples are in the portal's **Docs** section.

### LLM-friendly docs

Building with an AI coding agent (Cursor, Claude Code, etc.)? Point it at:

- `GET /llms.txt` — index of available docs
- `GET /api/docs/llm` — full docs bundle in a single response

---

## Monitoring Your Integration

The portal's **Usage** page shows, scoped to your own API keys:

- Request volume, error rate, and latency over time
- Per-endpoint breakdowns
- A searchable request log — useful for debugging failing calls in your app

If a call is failing in production, check the request log before digging into your own code.

---

## Support

- **Feedback & questions:** `/docs/feedback` in the portal
- **Community:** `/docs/community-spotlight`
- **Bug report:** open a GitHub issue on this repo
