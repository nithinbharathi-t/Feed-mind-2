"use client";

import { useState, useEffect, Suspense } from "react";
import { AiPromptPanel } from "@/components/forms/ai-prompt-panel";
import { FormBuilder } from "@/components/forms/form-builder";
import { useFormBuilder } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save, Globe, Loader2, ArrowLeft, Sparkles, Send } from "lucide-react";
import { createForm, publishForm } from "@/server/actions/forms";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/use-toast";
import { cn } from "@/lib/utils";

export default function NewFormPage() {
  return (
    <Suspense>
      <NewFormPageInner />
    </Suspense>
  );
}

function NewFormPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { reset, title, description, setTitle, setDescription, questions, addQuestion, setQuestions } = useFormBuilder();
  const [allowMultiple, setAllowMultiple] = useState(true);
  const [emailCollection, setEmailCollection] = useState<"NONE" | "VERIFIED" | "INPUT">("NONE");
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [botDetection, setBotDetection] = useState(true);
  const [duplicateFilter, setDuplicateFilter] = useState(true);
  const [emailOnSubmission, setEmailOnSubmission] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState("Thank you for your feedback! We really appreciate it.");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [formAccent, setFormAccent] = useState("#00ffe4");
  const [formSettingsOpen, setFormSettingsOpen] = useState(false);
  const [aiSuggestionOpen, setAiSuggestionOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState<"gemini" | "grok" | "claude">("gemini");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [savedFormId, setSavedFormId] = useState("");
  const [showBackDialog, setShowBackDialog] = useState(false);

  useEffect(() => {
    if (searchParams.get("mode") === "ai") {
      router.replace("/forms/new/ai");
    }
  }, [router, searchParams]);

  useEffect(() => { reset(); setTitle("Untitled form"); }, [reset]);

  const themePayload = {
    formAccent,
    showProgressBar,
    shuffleQuestions,
    botDetection,
    duplicateFilter,
    emailOnSubmission,
    slackWebhook,
    thankYouMessage,
    redirectUrl,
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Form title is required", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const form = await createForm({
        title,
        description,
        questions: questions.map((q, i) => ({
          type: q.type,
          label: q.label,
          placeholder: q.placeholder,
          required: q.required,
          options: q.options,
          order: i,
          aiGenerated: q.aiGenerated,
        })),
        isAnonymous: false,
        allowMultiple,
        emailCollection,
        theme: themePayload,
      });
      setSavedFormId(form.id);
      toast({ title: "Saved", description: "Form saved successfully" });
      router.push(`/forms/${form.id}/edit`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!savedFormId) { await handleSave(); return; }
    setIsPublishing(true);
    try {
      await publishForm(savedFormId, true);
      toast({ title: "Published!", description: "Your form is now live" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await createForm({
        title: title.trim() || "Untitled form",
        description,
        questions: questions.map((q, i) => ({
          type: q.type,
          label: q.label,
          placeholder: q.placeholder,
          required: q.required,
          options: q.options,
          order: i,
          aiGenerated: q.aiGenerated,
        })),
        isAnonymous: false,
        allowMultiple,
        emailCollection,
        theme: themePayload,
      });
      toast({ title: "Draft saved" });
      router.push("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen -mx-9 -mt-6">

      {/* ═══════════════════════════════════════════ TOP BAR ══════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 flex items-center h-14 px-5 bg-background border-b border-border/50 gap-0 shrink-0">

        {/* ── Left: back + divider + editable title ── */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
          <button
            onClick={() => setShowBackDialog(true)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="w-px h-5 bg-border/60 shrink-0" />

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled form"
            className="min-w-0 max-w-56 font-bold text-sm bg-transparent outline-none truncate placeholder:text-muted-foreground focus:ring-0"
          />
        </div>

        {/* ── Right: controls ── */}
        <div className="flex items-center gap-5 shrink-0">
          <div className="w-px h-5 bg-border/60 shrink-0" />

          {/* Save button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5 font-semibold"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>

          {/* Publish button */}
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
            className="gap-1.5 font-semibold bg-[#6467f2] hover:bg-[#6467f2]/90 text-white"
          >
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Publish
          </Button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════ CONTENT ══════════════════════════════════════════ */}
      <div className="flex-1 px-9 pt-6 pb-10 mr-80">

        {/* Description field */}
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)…"
          className="w-full mb-6 bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/60 border-b border-transparent focus:border-border/50 transition-colors pb-1"
        />

        <FormBuilder hideControls />
      </div>

      {/* ═══════════════════════════════ FIXED SIDEBAR (right, toggle system) ═══════════════════════════ */}
      <aside className="fixed right-0 top-14 h-[calc(100vh-56px)] w-80 flex flex-col bg-background border-l border-border/50 z-30 overflow-hidden">
        <div className="overflow-y-auto">
          <button
            onClick={() => setFormSettingsOpen((v) => !v)}
            className="w-full flex items-center gap-3 p-4 border-b border-border/50 text-left hover:bg-muted/20 transition-colors"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            <span className="inline-flex flex-col text-[16px] leading-[0.95] font-semibold text-primary">Form Settings</span>
          </button>

          {formSettingsOpen && (
            <div className="p-4 border-b border-border/50 space-y-6">
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Respondents</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Multiple responses</span>
                    <button
                      className={cn("rounded-full px-3 py-1 text-xs font-semibold", allowMultiple ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}
                      onClick={() => setAllowMultiple((v) => !v)}
                    >
                      {allowMultiple ? "On" : "Off"}
                    </button>
                  </div>
                  <div>
                    <label className="mb-1 block text-muted-foreground text-xs">Collect email</label>
                    <select
                      className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                      value={emailCollection}
                      onChange={(e) => setEmailCollection(e.target.value as "NONE" | "VERIFIED" | "INPUT")}
                    >
                      <option value="NONE">Do not collect</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="INPUT">Ask input</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Show progress bar</span>
                    <button
                      className={cn("rounded-full px-3 py-1 text-xs font-semibold", showProgressBar ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}
                      onClick={() => setShowProgressBar((v) => !v)}
                    >
                      {showProgressBar ? "On" : "Off"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Shuffle questions</span>
                    <button
                      className={cn("rounded-full px-3 py-1 text-xs font-semibold", shuffleQuestions ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}
                      onClick={() => setShuffleQuestions((v) => !v)}
                    >
                      {shuffleQuestions ? "On" : "Off"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Integrity and Spam</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bot detection</span>
                    <button
                      className={cn("rounded-full px-3 py-1 text-xs font-semibold", botDetection ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}
                      onClick={() => setBotDetection((v) => !v)}
                    >
                      {botDetection ? "On" : "Off"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duplicate filter</span>
                    <button
                      className={cn("rounded-full px-3 py-1 text-xs font-semibold", duplicateFilter ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}
                      onClick={() => setDuplicateFilter((v) => !v)}
                    >
                      {duplicateFilter ? "On" : "Off"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Notifications</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email on submission</span>
                    <button
                      className={cn("rounded-full px-3 py-1 text-xs font-semibold", emailOnSubmission ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}
                      onClick={() => setEmailOnSubmission((v) => !v)}
                    >
                      {emailOnSubmission ? "On" : "Off"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Slack webhook</span>
                    <button
                      className={cn("rounded-full px-3 py-1 text-xs font-semibold", slackWebhook ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}
                      onClick={() => setSlackWebhook((v) => !v)}
                    >
                      {slackWebhook ? "On" : "Off"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Appearance</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="mb-1 block text-muted-foreground text-xs">Thank you message</label>
                    <textarea
                      className="min-h-16 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={thankYouMessage}
                      onChange={(e) => setThankYouMessage(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-muted-foreground text-xs">Redirect URL</label>
                    <Input
                      className="h-9 text-sm"
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                      placeholder="https://yoursite.com/thanks"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-muted-foreground text-xs">Form accent</label>
                    <div className="flex gap-2">
                      {[
                        "#00ffe4",
                        "#8b72ff",
                        "#ff4f6e",
                        "#ffb020",
                        "#10e8a2",
                      ].map((color) => (
                        <button
                          key={color}
                          className={cn("h-5 w-5 rounded-full border", formAccent === color ? "border-foreground" : "border-transparent")}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormAccent(color)}
                          aria-label={`Set accent ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setAiSuggestionOpen((v) => !v)}
            className="w-full flex items-center gap-3 p-4 border-b border-border/50 text-left hover:bg-muted/20 transition-colors"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <span className="inline-flex flex-col text-[16px] leading-[0.95] font-semibold text-primary">AI Suggestion</span>
          </button>

          {aiSuggestionOpen && (
            <div className="p-4 space-y-4">
              <div className="rounded-lg bg-muted/40 px-3 py-3 text-sm text-muted-foreground leading-snug">
                Hi! I can help you generate questions. What is your survey about?
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Provider</p>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as "gemini" | "grok" | "claude")}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="gemini">Gemini</option>
                  <option value="grok">Grok</option>
                  <option value="claude">Claude</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quick prompts</p>
                <div className="flex flex-wrap gap-2">
                  {["Add NPS question", "Ask about wait time", "Add email follow-up", "Generate 5 more questions"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setAiPrompt(item)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:border-primary/50 hover:bg-primary/5"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Add a question about pricing..."
                  className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary"
                />
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90"
                  type="button"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ═════════════════════════════════════ LEAVE DIALOG ══════════════════════════════════════════ */}
      <Dialog open={showBackDialog} onOpenChange={setShowBackDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Leave this page?</DialogTitle>
            <DialogDescription>
              Your form has unsaved changes. Would you like to save a draft before leaving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="w-full bg-[#6467f2] hover:bg-[#6467f2]/90 text-white"
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
            <Button
              variant="ghost"
              className="w-full text-red-500 hover:text-red-500 hover:bg-red-500/10"
              onClick={() => router.push("/dashboard")}
            >
              Discard & Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
