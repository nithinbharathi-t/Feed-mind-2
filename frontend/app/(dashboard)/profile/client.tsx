"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Key, Shield, Save, Loader2, Trash2, Info, Plug } from "lucide-react";
import { toast } from "@/lib/use-toast";
import { AIProviderSettings } from "@/components/profile/ai-provider-settings";

interface ProfileClientProps {
  user: {
    name: string;
    email: string;
    image: string;
    hasApiKey: boolean;
    hasSlackWebhook: boolean;
    aiProvider: string;
    aiProviderEnabled: boolean;
    firstName?: string;
    lastName?: string;
    locale?: string;
    provider?: string;
  };
}

export function ProfileClient({ user }: ProfileClientProps) {
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(user.hasApiKey);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [hasSlackWebhook, setHasSlackWebhook] = useState(user.hasSlackWebhook);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSlack, setIsSavingSlack] = useState(false);

  const saveApiKey = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/apikey", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setHasKey(!!apiKey);
      setApiKey("");
      toast({ title: "API key saved", description: apiKey ? "Using your private key" : "Cleared to default" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const clearApiKey = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/apikey", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: null }),
      });
      if (!res.ok) throw new Error("Failed to clear");
      setHasKey(false);
      toast({ title: "API key cleared", description: "Using default shared key" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const saveSlackWebhook = async () => {
    setIsSavingSlack(true);
    try {
      const res = await fetch("/api/user/slack", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: slackWebhook || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save webhook");
      }

      setHasSlackWebhook(!!slackWebhook.trim());
      setSlackWebhook("");
      toast({
        title: "Slack updated",
        description: slackWebhook.trim()
          ? "Slack notifications are now enabled"
          : "Slack notifications disconnected",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingSlack(false);
    }
  };

  const clearSlackWebhook = async () => {
    setIsSavingSlack(true);
    try {
      const res = await fetch("/api/user/slack", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to disconnect webhook");
      }

      setSlackWebhook("");
      setHasSlackWebhook(false);
      toast({ title: "Slack disconnected", description: "No notifications will be sent to Slack" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingSlack(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image} />
              <AvatarFallback className="text-lg">{user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-lg">{user.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Profile Data</CardTitle>
          <CardDescription>
            Extracted from your Google sign-in and used across your workspace profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">First name</p>
            <p className="text-sm font-medium">{user.firstName || "Not available"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last name</p>
            <p className="text-sm font-medium">{user.lastName || "Not available"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Locale</p>
            <p className="text-sm font-medium">{user.locale || "Not available"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sign-in provider</p>
            <p className="text-sm font-medium">{user.provider || "credentials"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" /> Slack Notifications
          </CardTitle>
          <CardDescription>
            Connect a Slack incoming webhook to receive a message for every new form response.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Status:</span>
            <Badge variant={hasSlackWebhook ? "success" : "secondary"}>
              {hasSlackWebhook ? "Connected" : "Not Connected"}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slackWebhook">Slack Incoming Webhook URL</Label>
            <Input
              id="slackWebhook"
              type="password"
              placeholder="https://hooks.slack.com/services/..."
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              In Slack, create an Incoming Webhook URL and paste it here. FeedMind sends a notification whenever someone submits a response.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveSlackWebhook} disabled={isSavingSlack}>
              {isSavingSlack ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Webhook
            </Button>
            {hasSlackWebhook && (
              <Button variant="outline" onClick={clearSlackWebhook} disabled={isSavingSlack}>
                <Trash2 className="mr-2 h-4 w-4" /> Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AIProviderSettings 
        currentProvider={user.aiProvider} 
        isEnabled={user.aiProviderEnabled}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> API Key Management
          </CardTitle>
          <CardDescription>
            Configure your Groq API key for AI features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Current mode:</span>
            <Badge variant={hasKey ? "success" : "secondary"}>
              {hasKey ? "Using Your Private Key" : "Using Default Shared Key"}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="apiKey">Groq API Key (optional)</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="gsk_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Your private key ensures your data is processed only through your Groq account. Keys are encrypted before storage and never exposed to the frontend.</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveApiKey} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Key
            </Button>
            {hasKey && (
              <Button variant="outline" onClick={clearApiKey} disabled={isSaving}>
                <Trash2 className="h-4 w-4 mr-2" /> Clear Key
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-500">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. All forms and data will be permanently deleted.
          </p>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
