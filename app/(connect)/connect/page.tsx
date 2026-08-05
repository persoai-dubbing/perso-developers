"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Info,
  KeyRound,
  Loader2,
  LogIn,
  MonitorSmartphone,
  XCircle,
} from "lucide-react";
import { apiKeyApi, ApiError, getConfig } from "@/lib/api";
import type { ApiKey, ApiKeyExpirePeriod } from "@/lib/api";
import { usePortal } from "@/lib/portal-context";
import {
  classifyAuthKind,
  initConnectAnalytics,
  markLoginStart,
  trackConnect,
} from "@/lib/connect-analytics";

// The plugin opens this page as:
//   /connect?port=<local listener port>&name=<suggested key name>&state=<opaque echo token>
// After the key is created it is POSTed to http://127.0.0.1:{port}/key as a text/plain
// JSON body (text/plain keeps the request preflight-free; the listener must respond with
// Access-Control-Allow-Origin: * so the result is readable here). Without a port param
// the page falls back to showing the key once for manual copy.

type Step = "form" | "authorizing" | "done" | "manual" | "error";

const EXPIRY_LABELS: Record<ApiKeyExpirePeriod, string> = {
  days_30: "30 days",
  days_90: "90 days",
  year_1: "1 year",
  year_2: "2 years",
};

const DELIVERY_TIMEOUT_MS = 4000;

// Returns false when the sign-in page could not be opened (missing loginLink or
// config fetch failure) so callers can surface an error instead of hanging.
async function redirectToLogin(): Promise<boolean> {
  try {
    const config = await getConfig();
    if (config.loginLink) {
      window.location.href = `${config.loginLink}/en/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return true;
    }
  } catch {}
  return false;
}

type SocialProvider = "google" | "azure";

// Pre-fetch the SSO login URL, then hand the browser to the OAuth authorization endpoint
// with this page as the callback. redirect_uri is passed as-is (already encoded by the
// backend); callbackUrl is encoded here.
async function startSocialSignIn(provider: SocialProvider) {
  try {
    const config = await getConfig();
    const res = await fetch(`/proxy/auth/api/v1/auth/sign-in/social?provider=${provider}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`sign-in/social ${res.status}`);
    const data = await res.json();
    const loginUrl = data?.result?.loginUrl;
    if (!loginUrl || !config.apiBaseUrl) throw new Error("Missing loginUrl or apiBaseUrl");
    window.location.href =
      `${config.apiBaseUrl}/auth/oauth2/authorization/${provider}` +
      `?redirect_uri=${loginUrl}&callbackUrl=${encodeURIComponent(window.location.href)}`;
  } catch {
    await redirectToLogin();
  }
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  );
}

function deliveryPayload(key: ApiKey, stateToken?: string) {
  return JSON.stringify({
    apiKey: key.apiKey,
    apiKeyName: key.apiKeyName,
    expireDate: key.expireDate,
    ...(stateToken ? { state: stateToken } : {}),
  });
}

async function deliverKey(port: number, body: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
  try {
    const res = await fetch(`http://127.0.0.1:${port}/key`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function IconBadge({
  tone,
  children,
}: {
  tone: "primary" | "success" | "warning" | "destructive";
  children: React.ReactNode;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${tones[tone]}`}>
      {children}
    </div>
  );
}

function ConnectContent() {
  const { userProfile, authFailed } = usePortal();
  const searchParams = useSearchParams();

  const portParam = Number(searchParams.get("port"));
  const port =
    Number.isInteger(portParam) && portParam > 0 && portParam < 65536 ? portParam : null;
  const stateToken = searchParams.get("state") || undefined;
  initConnectAnalytics(searchParams.get("did")); // identity contract: see lib/connect-analytics.ts

  const [step, setStep] = useState<Step>("form");
  const pageViewSent = useRef(false);
  useEffect(() => {
    if (pageViewSent.current || (!userProfile && !authFailed)) return; // wait for the auth check
    pageViewSent.current = true;
    if (userProfile) {
      const authKind = classifyAuthKind(userProfile.createDate); // signup|login, only after a sign-in round trip
      trackConnect("connect_page_view", {
        logged_in: true,
        ...(authKind ? { auth_kind: authKind } : {}),
        ...(userProfile.provider ? { auth_method: userProfile.provider } : {}),
      });
    } else {
      trackConnect("connect_page_view", { logged_in: false });
    }
  }, [userProfile, authFailed]);
  const [keyName, setKeyName] = useState(
    () => (searchParams.get("name") || "perso-dubbing").slice(0, 16)
  );
  const [expiry, setExpiry] = useState<ApiKeyExpirePeriod>("year_1");
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const authorize = async () => {
    setStep("authorizing");
    trackConnect("connect_authorize_click", { expire_period: expiry });
    try {
      const response = await apiKeyApi.create({
        apiKeyName: keyName || undefined,
        expirePeriod: expiry,
      });
      const created = response.result;
      setCreatedKey(created);
      trackConnect("connect_key_result", { result: "success", expire_period: expiry });

      if (port && (await deliverKey(port, deliveryPayload(created, stateToken)))) {
        trackConnect("connect_key_delivered", { retried: false });
        setStep("done");
      } else {
        if (port) trackConnect("connect_delivery_failed", {}); // portless mode is manual by design, not a failure
        setStep("manual");
      }
    } catch (err) {
      if (err instanceof ApiError && (err.statusCode === 401 || err.statusCode === 403)) {
        markLoginStart();
        if (await redirectToLogin()) return; // expired session auto-recovers via sign-in — not a failure
      }
      trackConnect("connect_key_result", {
        result: "fail",
        expire_period: expiry,
        error_code: err instanceof ApiError ? err.code || String(err.statusCode) : "unknown",
      });
      setErrorMessage(err instanceof ApiError ? err.message : "The authorization request failed.");
      setStep("error");
    }
  };

  const retryDelivery = async () => {
    if (!port || !createdKey) return;
    setIsRetrying(true);
    setRetryFailed(false);
    const delivered = await deliverKey(port, deliveryPayload(createdKey, stateToken));
    setIsRetrying(false);
    if (delivered) {
      trackConnect("connect_key_delivered", { retried: true });
      setStep("done");
    } else {
      setRetryFailed(true);
    }
  };

  const copyKey = async () => {
    if (!createdKey) return;
    trackConnect("connect_manual_copy", { retry_failed: retryFailed });
    await navigator.clipboard.writeText(createdKey.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requestedBy = port && (
    <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
      <MonitorSmartphone className="h-3.5 w-3.5" />
      Requested by: perso-dubbing plugin &middot;{" "}
      <code className="font-mono">127.0.0.1:{port}</code>
    </div>
  );

  if (!userProfile && !authFailed) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (authFailed) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <IconBadge tone="primary">
            <LogIn className="h-5 w-5" />
          </IconBadge>
          <h2 className="text-lg font-semibold text-foreground">
            Connect Perso Dubbing Plugin
          </h2>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            Sign in or create an account to authorize the plugin on this device.
          </p>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="w-full gap-2.5"
              onClick={() => {
                trackConnect("connect_login_start", { auth_method: "google" });
                markLoginStart();
                void startSocialSignIn("google");
              }}
            >
              <GoogleIcon />
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2.5"
              onClick={() => {
                trackConnect("connect_login_start", { auth_method: "ms" });
                markLoginStart();
                void startSocialSignIn("azure");
              }}
            >
              <MicrosoftIcon />
              Continue with Microsoft
            </Button>
            <Button
              variant="outline"
              className="w-full border-dashed text-muted-foreground"
              onClick={() => {
                trackConnect("connect_login_start", { auth_method: "email" });
                markLoginStart();
                void redirectToLogin();
              }}
            >
              Continue with email
            </Button>
          </div>
          {requestedBy}
        </CardContent>
      </Card>
    );
  }

  if (step === "form" || step === "authorizing") {
    const busy = step === "authorizing";
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <IconBadge tone="primary">
            <KeyRound className="h-5 w-5" />
          </IconBadge>
          <h2 className="text-lg font-semibold text-foreground">
            Connect Perso Dubbing Plugin
          </h2>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            Authorize the plugin to use your Perso account on this device.
          </p>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="keyName">API key name</Label>
              <Input
                id="keyName"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                maxLength={16}
                disabled={busy}
              />
              <p className="text-right text-xs text-muted-foreground">{keyName.length}/16</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiry">Expiration</Label>
              <Select
                value={expiry}
                onValueChange={(v) => setExpiry(v as ApiKeyExpirePeriod)}
                disabled={busy}
              >
                <SelectTrigger id="expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EXPIRY_LABELS) as ApiKeyExpirePeriod[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {EXPIRY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 mb-5 flex items-start gap-2 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              This key expires in <b className="text-foreground">{EXPIRY_LABELS[expiry]}</b>. When
              it expires, the plugin will open this page again.
            </span>
          </div>

          <Button className="w-full" onClick={authorize} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {busy ? "Authorizing…" : "Authorize plugin"}
          </Button>
          {requestedBy}
        </CardContent>
      </Card>
    );
  }

  if (step === "done" && createdKey) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <IconBadge tone="success">
            <CheckCircle2 className="h-5 w-5" />
          </IconBadge>
          <h2 className="text-lg font-semibold text-foreground">Connected</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Your API key has been securely delivered to the plugin.
          </p>

          <div className="mb-5 flex items-center gap-2.5 rounded-lg bg-success/10 p-3.5 text-base font-medium text-success">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            You can close this tab and return to your terminal.
          </div>

          <div className="divide-y divide-border rounded-lg border border-border text-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-muted-foreground">Key name</span>
              <span className="font-medium text-foreground">{createdKey.apiKeyName || "-"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-muted-foreground">Expires</span>
              <span className="font-medium text-foreground">
                {formatDate(createdKey.expireDate)}
              </span>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            The key value is not displayed for security. You can revoke it anytime on the API Keys
            page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === "manual" && createdKey) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <IconBadge tone="warning">
            <AlertTriangle className="h-5 w-5" />
          </IconBadge>
          <h2 className="text-lg font-semibold text-foreground">
            {port ? "Authorized, but key not delivered" : "API key created"}
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            {port
              ? "The plugin didn't respond. Copy the key below and paste it into the key file the plugin opened."
              : "Copy the key below and paste it into the key file the plugin opened."}
          </p>

          <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
            <code className="flex-1 break-all font-mono text-xs">{createdKey.apiKey}</code>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={copyKey}>
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {port && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={retryDelivery}
              disabled={isRetrying}
            >
              {isRetrying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRetrying ? "Retrying…" : "Retry delivery"}
            </Button>
          )}
          {retryFailed && (
            <p className="mt-2 text-center text-xs text-destructive">
              Still no response from the plugin.
            </p>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            This key is shown only once, on this screen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <IconBadge tone="destructive">
          <XCircle className="h-5 w-5" />
        </IconBadge>
        <h2 className="text-lg font-semibold text-foreground">Couldn't authorize the plugin</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Please try again in a moment. If the problem persists, you can create a key directly on
          the API Keys page.
        </p>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <Button className="w-full" onClick={() => setStep("form")}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ConnectPage() {
  return (
    <div className="mx-auto max-w-md pt-6 sm:pt-12">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ConnectContent />
      </Suspense>
    </div>
  );
}
