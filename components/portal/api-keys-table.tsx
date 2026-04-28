"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Eye, EyeOff, MoreHorizontal, Plus, Trash2, Ban, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiKeyApi, ApiKey, ApiKeyExpirePeriod, ApiError, getConfig } from "@/lib/api";
import { usePortal } from "@/lib/portal-context";
import type { Timezone } from "@/lib/analytics-types";

function formatDateTime(dateString: string | null, timezone: Timezone) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone === "KST" ? "Asia/Seoul" : "UTC",
  });
}

// Mask API key (show first 12 + *** + last 4)
function maskApiKey(apiKey: string) {
  if (apiKey.length <= 16) return apiKey;
  return apiKey.slice(0, 12) + "***" + apiKey.slice(-4);
}

export function ApiKeysTable() {
  const { authFailed } = usePortal();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState<ApiKeyExpirePeriod>("days_30");
  const [copiedSeq, setCopiedSeq] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<Timezone>("UTC");

  useEffect(() => {
    const saved = localStorage.getItem("usage-timezone");
    if (saved === "UTC" || saved === "KST") setTimezone(saved);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "usage-timezone" && (e.newValue === "UTC" || e.newValue === "KST")) {
        setTimezone(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Fetch API key list
  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      const response = await apiKeyApi.getList();
      setApiKeys(response.result);
    } catch {
      setApiKeys([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const toggleKeyVisibility = (seq: number) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(seq)) {
      newVisible.delete(seq);
    } else {
      newVisible.add(seq);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = async (key: string, seq: number) => {
    await navigator.clipboard.writeText(key);
    setCopiedSeq(seq);
    setTimeout(() => setCopiedSeq(null), 2000);
  };

  // Create API key
  const createNewKey = async () => {
    setIsCreating(true);
    try {
      const response = await apiKeyApi.create({
        apiKeyName: newKeyName || undefined,
        expirePeriod: newKeyExpiry,
      });
      
      // Display newly created key (shown only once)
      setNewlyCreatedKey(response.result.apiKey);
      
      // Refresh list
      await fetchApiKeys();
      
      setNewKeyName("");
      setNewKeyExpiry("days_30");
    } catch (err) {
      if (err instanceof ApiError && (err.statusCode === 401 || err.statusCode === 403)) {
        const config = await getConfig();
        if (config.loginLink) {
          window.location.href = `${config.loginLink}/en/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
          return;
        }
      }
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Failed to create API key.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Revoke API key
  const revokeKey = async (apiKey: string) => {
    if (!confirm("Are you sure you want to revoke this API key? Revoked keys can no longer be used.")) {
      return;
    }
    
    try {
      await apiKeyApi.revoke(apiKey);
      await fetchApiKeys();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Failed to revoke API key.");
      }
    }
  };

  // Delete API key
  const deleteKey = async (apiKey: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiKeyApi.delete(apiKey);
      await fetchApiKeys();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert("Failed to delete API key.");
      }
    }
  };

  const getStatusBadge = (status: ApiKey["status"]) => {
    const variants = {
      active: "bg-primary/10 text-primary border-primary/20",
      expired: "bg-warning/10 text-warning border-warning/20",
      revoked: "bg-destructive/10 text-destructive border-destructive/20",
    };
    const labels = {
      active: "Active",
      expired: "Expired",
      revoked: "Revoked",
    };
    return (
      <Badge variant="outline" className={cn("font-medium", variants[status])}>
        {labels[status]}
      </Badge>
    );
  };

  const getExpiryLabel = (period: ApiKeyExpirePeriod) => {
    const labels = {
      days_30: "30 days",
      days_90: "90 days",
      year_1: "1 year",
      year_2: "2 years",
    };
    return labels[period];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage your API keys for accessing the Perso API
        </p>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setNewlyCreatedKey(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={async (e) => {
              if (authFailed) {
                e.preventDefault();
                const config = await getConfig();
                if (config.loginLink) {
                  window.location.href = `${config.loginLink}/en/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
                }
              }
            }}>
              <Plus className="h-4 w-4" />
              Generate New Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {newlyCreatedKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Copy the key below and store it in a safe place. You will not be able to view this key again.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="rounded-lg bg-secondary p-4">
                    <code className="text-sm font-mono break-all">{newlyCreatedKey}</code>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-3 w-full gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(newlyCreatedKey);
                      alert("Copied!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => {
                    setIsCreateOpen(false);
                    setNewlyCreatedKey(null);
                  }}>
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Generate New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key. Please store the generated key securely.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Key Name (Optional)</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Production API"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      maxLength={16}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {newKeyName.length}/16
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expiry">Expiration Period</Label>
                    <Select value={newKeyExpiry} onValueChange={(v) => setNewKeyExpiry(v as ApiKeyExpirePeriod)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiration period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days_30">30 days</SelectItem>
                        <SelectItem value="days_90">90 days</SelectItem>
                        <SelectItem value="year_1">1 year</SelectItem>
                        <SelectItem value="year_2">2 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewKey} disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Key
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">API Key</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Created</TableHead>
              <TableHead className="text-muted-foreground">Expires</TableHead>
              <TableHead className="text-muted-foreground">Last Used</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No data
                </TableCell>
              </TableRow>
            ) : (
              apiKeys.map((apiKey) => (
                <TableRow key={apiKey.seq} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    {apiKey.apiKeyName || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted-foreground font-mono">
                        {maskApiKey(apiKey.apiKey)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(apiKey.apiKey, apiKey.seq)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {copiedSeq === apiKey.seq && (
                        <span className="text-xs text-primary">Copied!</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(apiKey.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(apiKey.createDate, timezone)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(apiKey.expireDate, timezone)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(apiKey.lastUsedDate, timezone)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => copyToClipboard(apiKey.apiKey, apiKey.seq)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Key
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => revokeKey(apiKey.apiKey)}
                          disabled={apiKey.status !== "active"}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Revoke
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteKey(apiKey.apiKey)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
