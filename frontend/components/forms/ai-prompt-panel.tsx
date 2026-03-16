"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, Loader2, Send } from "lucide-react";
import { generateForm, generateQuestionsFromTrainedModel } from "@/server/actions/ai";

interface GeneratedQuestion {
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface AiPromptPanelProps {
  onAcceptAll: (data: { title: string; description: string; questions: GeneratedQuestion[] }) => void;
  onAcceptQuestion: (question: GeneratedQuestion) => string;
  activeQuestionIds: string[];
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function AcceptedCheck() {
  return <Check className="h-3.5 w-3.5 text-emerald-500 mt-1 shrink-0" />;
}

// ── Tab: AI Generate (Gemini / Groq) ─────────────────────────────────────────

function AiGenerateTab({ onAcceptAll, onAcceptQuestion, activeQuestionIds }: AiPromptPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<{
    title: string;
    description: string;
    questions: GeneratedQuestion[];
  } | null>(null);
  const [acceptedMap, setAcceptedMap] = useState<Map<number, string>>(new Map());
  const [error, setError] = useState("");

  const quickPrompts = [
    "Add NPS question",
    "Ask about wait time",
    "Add email follow-up",
    "Generate 5 more questions"
  ];

  const handleQuickPrompt = (promptText: string) => {
    setPrompt(promptText);
  };

  const handleGenerate = async () => {
    if (prompt.trim().length < 5) return;
    setIsGenerating(true);
    setError("");
    try {
      // Try using trained model first (BERT + BART context-aware)
      const trainedResult = await generateQuestionsFromTrainedModel(prompt.trim(), 5);
      
      if (trainedResult && trainedResult.questions.length > 0) {
        // Convert questions to consistent format (text -> label for compatibility)
        const normalizedQuestions = trainedResult.questions.map((q: any) => ({
          ...q,
          label: q.label || q.text, // Ensure label exists
          type: q.type || 'text'
        }));
        
        // Use trained model results
        setGenerated({
          title: prompt.trim(),
          description: trainedResult.generated_from_context
            ? `Generated from ${trainedResult.num_documents_used} uploaded documents using BERT context analysis`
            : "Generated using AI templates",
          questions: normalizedQuestions
        });
      } else {
        // Fallback to original API
        const result = await generateForm(prompt);
        setGenerated(result);
      }
      
      setAcceptedMap(new Map());
      setPrompt("");
    } catch (err: any) {
      // If trained model fails, try original API as fallback
      try {
        const result = await generateForm(prompt);
        setGenerated(result);
        setAcceptedMap(new Map());
        setPrompt("");
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || "Failed to generate");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptQuestion = (index: number) => {
    if (!generated) return;
    const addedId = onAcceptQuestion(generated.questions[index]);
    setAcceptedMap((prev) => { const next = new Map(prev); next.set(index, addedId); return next; });
  };

  const isAccepted = (index: number) =>
    acceptedMap.has(index) && activeQuestionIds.includes(acceptedMap.get(index)!);

  return (
    <div className="flex flex-col flex-1 min-h-0 p-4 gap-3">
      <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground leading-snug shrink-0">
        {generated
          ? `Generated ${generated.questions.length} questions for "${generated.title}". Click a question to add it, or accept all.`
          : "Hi! I can help you generate questions. What is your survey about?"}
      </div>

      {generated && (
        <div className="flex flex-col flex-1 min-h-0 gap-2">
          <div className="overflow-y-auto flex-1 min-h-0 pr-0.5 space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {generated.questions.map((q, i) => (
              <div
                key={i}
                onClick={() => !isAccepted(i) && acceptQuestion(i)}
                className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                  isAccepted(i)
                    ? "border-emerald-500/30 bg-emerald-500/5 text-muted-foreground cursor-default"
                    : "border-border cursor-pointer hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="text-[10px] mb-1">
                    {q.type.replace(/_/g, " ")}
                  </Badge>
                  <p className="font-medium truncate">{q.label}</p>
                </div>
                {isAccepted(i) && <AcceptedCheck />}
              </div>
            ))}
          </div>
          <button
            onClick={() => onAcceptAll(generated)}
            className="w-full text-xs text-primary hover:underline text-center py-1 shrink-0"
          >
            + Accept all questions
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 shrink-0">{error}</p>}

      <div className="mt-auto shrink-0 space-y-3">
        {/* Quick Prompts Section */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">Quick Prompts</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((quickPrompt) => (
              <button
                key={quickPrompt}
                onClick={() => handleQuickPrompt(quickPrompt)}
                disabled={isGenerating}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 disabled:opacity-40 transition-colors"
              >
                {quickPrompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="flex items-center gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
            placeholder="e.g. Add a question about pricing..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary transition-colors"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || prompt.trim().length < 5}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Root panel ────────────────────────────────────────────────────────────────

export function AiPromptPanel({ onAcceptAll, onAcceptQuestion, activeQuestionIds }: AiPromptPanelProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold text-sm">AI Suggestion</span>
      </div>

      {/* Tab content */}
      <AiGenerateTab
        onAcceptAll={onAcceptAll}
        onAcceptQuestion={onAcceptQuestion}
        activeQuestionIds={activeQuestionIds}
      />
    </div>
  );
}