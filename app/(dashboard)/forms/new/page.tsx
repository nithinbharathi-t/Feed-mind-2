"use client";

import { useState, useEffect, Suspense } from "react";
import { AiPromptPanel } from "@/components/forms/ai-prompt-panel";
import { FormBuilder } from "@/components/forms/form-builder";
import { useFormBuilder } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save, Globe, Loader2, ArrowLeft } from "lucide-react";
import { createForm, publishForm } from "@/server/actions/forms";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/use-toast";

const EMAIL_API_MAP = { none: "NONE", verified: "VERIFIED", input: "INPUT" } as const;

export default function NewFormPage() {
  return (
    <Suspense>
      <NewFormPageInner />
    </Suspense>
  );
}

function NewFormPageInner() {
  const router = useRouter();
  const { reset, title, description, setTitle, setDescription, questions, addQuestion, setQuestions } = useFormBuilder();
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [emailCollection, setEmailCollection] = useState<"none" | "verified" | "input">("none");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [savedFormId, setSavedFormId] = useState("");
  const [showBackDialog, setShowBackDialog] = useState(false);

  useEffect(() => { reset(); setTitle("Untitled form"); }, [reset]);

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
        emailCollection: EMAIL_API_MAP[emailCollection],
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
        emailCollection: EMAIL_API_MAP[emailCollection],
      });
      toast({ title: "Draft saved" });
      router.push("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptAll = (data: { title: string; description: string; questions: any[] }) => {
    setTitle(data.title);
    setDescription(data.description);
    setQuestions(
      data.questions.map((q, i) => ({
        id: `ai-${Date.now()}-${i}`,
        type: q.type,
        label: q.label,
        placeholder: q.placeholder || "",
        required: q.required,
        options: q.options || [],
        order: i,
        aiGenerated: true,
      }))
    );
  };

  const handleAcceptQuestion = (question: any): string => {
    const id = `ai-${Date.now()}`;
    addQuestion({
      id,
      type: question.type,
      label: question.label,
      placeholder: question.placeholder || "",
      required: question.required,
      options: question.options || [],
      order: Date.now(),
      aiGenerated: true,
    });
    return id;
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

          {/* Multiple Responses toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap hidden lg:inline">Multiple Responses</span>
            <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
          </div>

          <div className="w-px h-5 bg-border/60 shrink-0" />

          {/* Email segmented control */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">Email:</span>
            <div className="flex items-center rounded-md border border-border/60 overflow-hidden text-[12px]">
              {(["none", "verified", "input"] as const).map((opt, idx) => (
                <button
                  key={opt}
                  onClick={() => setEmailCollection(opt)}
                  className={`px-3 py-1.5 font-medium transition-all whitespace-nowrap
                    ${idx !== 0 ? "border-l border-border/60" : ""}
                    ${emailCollection === opt
                      ? "bg-[#6467f2]/10 text-[#6467f2] font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                >
                  {opt === "none" ? "Don't collect" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>

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

      {/* ═══════════════════════════════ FIXED AI PANEL (right, full-height like sidebar) ═══════════════════════════ */}
      <aside className="fixed right-0 top-0 h-screen w-80 flex flex-col bg-background border-l border-border/50 z-30 overflow-hidden">
        <AiPromptPanel
          onAcceptAll={handleAcceptAll}
          onAcceptQuestion={handleAcceptQuestion}
          activeQuestionIds={questions.map((q) => q.id)}
        />
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
