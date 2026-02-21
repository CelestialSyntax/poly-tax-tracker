"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Settings,
  Wallet,
  Key,
  Trash2,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ApiKeyInfo {
  id: string;
  keyPrefix: string;
  label: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface WalletInfo {
  id: string;
  address: string;
  label: string | null;
  isProxy: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

interface UserSettings {
  defaultTaxTreatment: string;
  defaultCostBasis: string;
  taxYear: number;
}

function shortenAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    defaultTaxTreatment: "capital_gains",
    defaultCostBasis: "fifo",
    taxYear: new Date().getFullYear(),
  });
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Wallet dialog
  const [addWalletOpen, setAddWalletOpen] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newWalletLabel, setNewWalletLabel] = useState("");

  // API Key dialog
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "wallet" | "api_key";
    id: string;
    label: string;
  } | null>(null);

  // Danger zone
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setApiKeys(data.apiKeys);
        setWallets(data.wallets);
      }
    } catch {
      // Will use defaults
    }
  }

  async function saveSettings() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Settings saved");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  async function createApiKey() {
    if (!newKeyLabel.trim()) return;
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_api_key", label: newKeyLabel }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedKey(data.key);
        setNewKeyLabel("");
        toast.success("API key created");
        fetchSettings();
      }
    } catch {
      toast.error("Failed to create API key");
    }
  }

  async function addWallet() {
    if (!newWalletAddress.trim()) return;
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_wallet",
          address: newWalletAddress,
          label: newWalletLabel || null,
        }),
      });
      if (res.ok) {
        toast.success("Wallet added");
        setNewWalletAddress("");
        setNewWalletLabel("");
        setAddWalletOpen(false);
        fetchSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add wallet");
      }
    } catch {
      toast.error("Failed to add wallet");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch("/api/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: `delete_${deleteTarget.type}`,
          id: deleteTarget.id,
        }),
      });
      if (res.ok) {
        toast.success(
          deleteTarget.type === "wallet" ? "Wallet removed" : "API key revoked"
        );
        fetchSettings();
      }
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteTarget(null);
  }

  async function copyKey() {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account preferences and integrations
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="tax">
            <Settings className="size-4" />
            Tax Preferences
          </TabsTrigger>
          <TabsTrigger value="wallets">
            <Wallet className="size-4" />
            Wallets
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="size-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      defaultValue="Alex Trader"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="alex@example.com"
                      readOnly
                      className="opacity-60"
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="current-password">Change Password</Label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Current password"
                    />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="New password"
                    />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-3" />
                    ) : (
                      <Eye className="size-3" />
                    )}
                    {showPassword ? "Hide" : "Show"} passwords
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Profile updated")}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="size-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Once you delete your account, all data including transactions,
                  tax reports, and settings will be permanently removed. This
                  action cannot be undone.
                </p>
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label
                      htmlFor="delete-confirm"
                      className="text-destructive"
                    >
                      Type &quot;DELETE&quot; to confirm
                    </Label>
                    <Input
                      id="delete-confirm"
                      value={deleteAccountConfirm}
                      onChange={(e) => setDeleteAccountConfirm(e.target.value)}
                      placeholder='Type "DELETE"'
                      className="border-destructive/30"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    disabled={deleteAccountConfirm !== "DELETE"}
                    onClick={() =>
                      toast.error(
                        "Account deletion is not available in demo mode"
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Tax Preferences Tab */}
        <TabsContent value="tax">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle>Tax Preferences</CardTitle>
                <CardDescription>
                  Set your default tax calculation preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Default Tax Treatment</Label>
                    <Select
                      value={settings.defaultTaxTreatment}
                      onValueChange={(v) =>
                        setSettings({ ...settings, defaultTaxTreatment: v })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="capital_gains">
                          Capital Gains
                        </SelectItem>
                        <SelectItem value="gambling">
                          Gambling Income
                        </SelectItem>
                        <SelectItem value="business">
                          Business Income
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Cost Basis Method</Label>
                    <Select
                      value={settings.defaultCostBasis}
                      onValueChange={(v) =>
                        setSettings({ ...settings, defaultCostBasis: v })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fifo">FIFO</SelectItem>
                        <SelectItem value="lifo">LIFO</SelectItem>
                        <SelectItem value="specific_id">Specific ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Current Tax Year</Label>
                    <Select
                      value={settings.taxYear.toString()}
                      onValueChange={(v) =>
                        setSettings({ ...settings, taxYear: parseInt(v) })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2026, 2025, 2024].map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Connected Wallets</CardTitle>
                  <CardDescription>
                    Manage your connected Polymarket wallets
                  </CardDescription>
                </div>
                <Dialog open={addWalletOpen} onOpenChange={setAddWalletOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="size-4" />
                      Add Wallet
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Wallet</DialogTitle>
                      <DialogDescription>
                        Connect a new Polymarket wallet address
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="wallet-address">Wallet Address</Label>
                        <Input
                          id="wallet-address"
                          value={newWalletAddress}
                          onChange={(e) => setNewWalletAddress(e.target.value)}
                          placeholder="0x..."
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wallet-label">Label (optional)</Label>
                        <Input
                          id="wallet-label"
                          value={newWalletLabel}
                          onChange={(e) => setNewWalletLabel(e.target.value)}
                          placeholder="e.g., Main Trading"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setAddWalletOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={addWallet}
                        disabled={!newWalletAddress.trim()}
                      >
                        Add Wallet
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3">
                {wallets.length === 0 && (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No wallets connected yet. Add your first wallet to start
                    tracking.
                  </p>
                )}
                {wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">
                          {shortenAddress(wallet.address)}
                        </code>
                        {wallet.label && (
                          <Badge variant="secondary">{wallet.label}</Badge>
                        )}
                        {wallet.isProxy && (
                          <Badge
                            variant="outline"
                            className="border-cyan-500/30 text-cyan-400"
                          >
                            Proxy
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {wallet.createdAt &&
                          `Added ${formatDistanceToNow(new Date(wallet.createdAt))} ago`}
                        {wallet.lastSyncAt && (
                          <>
                            {" "}
                            &middot; Last synced{" "}
                            {formatDistanceToNow(new Date(wallet.lastSyncAt))}{" "}
                            ago
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setDeleteTarget({
                          type: "wallet",
                          id: wallet.id,
                          label:
                            wallet.label ?? shortenAddress(wallet.address),
                        })
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage API keys for bot integration and programmatic access
                  </CardDescription>
                </div>
                <Dialog
                  open={keyDialogOpen}
                  onOpenChange={(open) => {
                    setKeyDialogOpen(open);
                    if (!open) {
                      setGeneratedKey(null);
                      setKeyCopied(false);
                      setNewKeyLabel("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="size-4" />
                      Generate Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {generatedKey
                          ? "API Key Generated"
                          : "Generate API Key"}
                      </DialogTitle>
                      <DialogDescription>
                        {generatedKey
                          ? "Copy your API key now. You won't be able to see it again."
                          : "Create a new API key for bot integration"}
                      </DialogDescription>
                    </DialogHeader>
                    {generatedKey ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
                          <code className="flex-1 text-sm font-mono text-green-400 break-all">
                            {generatedKey}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={copyKey}
                          >
                            {keyCopied ? (
                              <Check className="size-4 text-green-400" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-amber-400">
                          This key will only be shown once. Store it securely.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="key-label">Key Label</Label>
                        <Input
                          id="key-label"
                          value={newKeyLabel}
                          onChange={(e) => setNewKeyLabel(e.target.value)}
                          placeholder="e.g., Production Bot"
                        />
                      </div>
                    )}
                    <DialogFooter>
                      {generatedKey ? (
                        <Button onClick={() => setKeyDialogOpen(false)}>
                          Done
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setKeyDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={createApiKey}
                            disabled={!newKeyLabel.trim()}
                          >
                            Generate
                          </Button>
                        </>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3">
                {apiKeys.length === 0 && (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No API keys generated yet. Create one to connect your bot.
                  </p>
                )}
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">
                          {key.keyPrefix}****
                        </code>
                        <Badge variant="outline">{key.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created{" "}
                        {formatDistanceToNow(new Date(key.createdAt))} ago
                        {key.lastUsedAt && (
                          <>
                            {" "}
                            &middot; Last used{" "}
                            {formatDistanceToNow(new Date(key.lastUsedAt))}{" "}
                            ago
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setDeleteTarget({
                          type: "api_key",
                          id: key.id,
                          label: key.label,
                        })
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {deleteTarget?.type === "wallet" ? "remove" : "revoke"}{" "}
              &quot;{deleteTarget?.label}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {deleteTarget?.type === "wallet"
                ? "Remove Wallet"
                : "Revoke Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
