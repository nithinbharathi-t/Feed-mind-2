"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateForm, publishForm, deleteForm } from "@/server/actions/forms";
import { toast } from "@/lib/use-toast";
import { useRouter } from "next/navigation";
import { Copy, Check, Globe, Trash2, Loader2, ExternalLink, Mail } from "lucide-react";

interface SettingsClientProps {
  form: {
    id: string;
    title: string;
    description: string;
    isPublished: boolean;
    isAnonymous: boolean;
    allowMultiple: boolean;
    emailCollection: "NONE" | "VERIFIED" | "INPUT";
    expiresAt: string | null;
  };
}

export function SettingsClient({ form }: SettingsClientProps) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(form.isPublished);
  const [isAnonymous, setIsAnonymous] = useState(form.isAnonymous);
  const [allowMultiple, setAllowMultiple] = useState(form.allowMultiple);
  const [emailCollection, setEmailCollection] = useState<"NONE" | "VERIFIED" | "INPUT">(form.emailCollection);
  const [expiresAt, setExpiresAt] = useState(form.expiresAt?.split("T")[0] || "");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/f/${form.id}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateForm(form.id, { isAnonymous, allowMultiple, emailCollection, expiresAt: expiresAt || null });
      toast({ title: "Settings saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      await publishForm(form.id, !isPublished);
      setIsPublished(!isPublished);
      toast({ title: !isPublished ? "Form published!" : "Form unpublished" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this form? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await deleteForm(form.id);
      toast({ title: "Form deleted" });
      router.push("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Sharing</CardTitle>
          <CardDescription>Share your form with respondents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={isPublished ? "success" : "secondary"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
            <Button variant="outline" size="sm" onClick={handlePublish}>
              <Globe className="h-4 w-4 mr-2" /> {isPublished ? "Unpublish" : "Publish"}
            </Button>
          </div>
          {isPublished && (
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="text-sm" />
              <Button variant="outline" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" asChild>
                <a href={`/f/${form.id}`} target="_blank"><ExternalLink className="h-4 w-4" /></a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Anonymous Responses</Label>
              <p className="text-sm text-muted-foreground">Hide respondent information</p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Multiple Responses</Label>
              <p className="text-sm text-muted-foreground">Allow same person to submit multiple times</p>
            </div>
            <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Collect Email Address</Label>
            <Select value={emailCollection} onValueChange={(v) => setEmailCollection(v as "NONE" | "VERIFIED" | "INPUT")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Do not collect</SelectItem>
                <SelectItem value="VERIFIED">Verified (require sign-in)</SelectItem>
                <SelectItem value="INPUT">Input (ask respondent)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {emailCollection === "NONE" && "Email addresses will not be collected."}
              {emailCollection === "VERIFIED" && "Respondents must sign in with Google before filling the form."}
              {emailCollection === "INPUT" && "An email field will appear at the top of the form."}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Expiry Date (Optional)</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-500">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Delete Form
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
