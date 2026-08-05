// Amplitude beacon for the /connect page only — the plugin onboarding funnel.
// Identity: the plugin opens this page with its Amplitude device_id as ?did=…; events sent with
// that device_id merge into the plugin's user natively. Direct visits (no ?did=) are tracked
// under a browser-local anonymous id and carry did:"none" as the only marker.
// Fire-and-forget: failures never surface in the UI.

const ENDPOINT = process.env.NEXT_PUBLIC_AMPLITUDE_URL || "https://api2.amplitude.com/2/httpapi";
// Write-only ingestion key of the plugin's Amplitude project (public by design — it can only
// send events, never read data; same key the plugin ships with).
const API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_KEY || "d795c0c0328160be4d7df3365eb0c05e";

const LOGIN_START_KEY = "pd_connect_login_started_at";

const FALLBACK_ID_KEY = "pd_connect_device_id";

let pluginDid: string | null = null;

// Stable anonymous id for direct visits (no ?did=) — persisted so repeat visits stay one user.
function fallbackDeviceId(): string {
  try {
    const stored = localStorage.getItem(FALLBACK_ID_KEY);
    if (stored) return stored;
    const fresh = crypto.randomUUID();
    localStorage.setItem(FALLBACK_ID_KEY, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

export function initConnectAnalytics(did: string | null) {
  pluginDid = did && /^[\w-]{8,64}$/.test(did) ? did : null;
}

export function trackConnect(eventType: string, props: Record<string, unknown> = {}) {
  try {
    const body = JSON.stringify({
      api_key: API_KEY,
      events: [
        {
          device_id: pluginDid ?? fallbackDeviceId(),
          insert_id: crypto.randomUUID(),
          event_type: eventType,
          time: Date.now(),
          platform: "developers",
          // The plugin's did already rides as device_id — only direct visits get marked.
          event_properties: { ...(pluginDid ? {} : { did: "none" }), ...props },
        },
      ],
    });
    // keepalive: the login-start event must survive the immediate navigation to the sign-in page.
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Stamp the moment the user leaves for sign-in — the returning page view compares the account's
 *  createDate against it to classify signup vs login. */
export function markLoginStart() {
  try {
    sessionStorage.setItem(LOGIN_START_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** "signup" | "login" | null (no sign-in round trip from this page → indeterminable).
 *  Consumes the stamp so a later reload is not re-classified. The 30-minute window absorbs
 *  client/server clock skew: an account created during the sign-in excursion is brand new,
 *  anything older is an existing account logging in. */
export function classifyAuthKind(createDate?: string): "signup" | "login" | null {
  try {
    const startedAt = Number(sessionStorage.getItem(LOGIN_START_KEY));
    if (!startedAt) return null;
    sessionStorage.removeItem(LOGIN_START_KEY);
    if (!createDate) return null;
    return Date.now() - new Date(createDate).getTime() < 30 * 60_000 ? "signup" : "login";
  } catch {
    return null;
  }
}
