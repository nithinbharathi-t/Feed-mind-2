"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Send, Loader2, CheckCircle2, Star, Mail, LogIn } from "lucide-react";

interface Question {
  id: string;
  type: string;
  label: string;
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
}

interface PublicFormClientProps {
  form: {
    id: string;
    title: string;
    description: string | null;
    isAnonymous: boolean;
    emailCollection: "NONE" | "VERIFIED" | "INPUT";
    theme: any;
    questions: Question[];
  };
}

export function PublicFormClient({ form }: PublicFormClientProps) {
  const { data: session, status } = useSession();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checkboxAnswers, setCheckboxAnswers] = useState<Record<string, string[]>>({});
  const [otherInputs, setOtherInputs] = useState<Record<string, string>>({});
  const [inputEmail, setInputEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [startTime] = useState(Date.now());

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleCheckbox = (questionId: string, option: string) => {
    setCheckboxAnswers((prev) => {
      const current = prev[questionId] || [];
      if (current.includes(option)) {
        return { ...prev, [questionId]: current.filter((o) => o !== option) };
      }
      return { ...prev, [questionId]: [...current, option] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Validate email for INPUT mode
    if (form.emailCollection === "INPUT") {
      if (!inputEmail.trim()) {
        setError("Email address is required");
        setIsSubmitting(false);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail.trim())) {
        setError("Please enter a valid email address");
        setIsSubmitting(false);
        return;
      }
    }

    const allAnswers = form.questions.map((q) => {
      let value = "";
      if (q.type === "CHECKBOX") {
        const selections = (checkboxAnswers[q.id] || []).map((o) =>
          o === "__other__" ? `Other: ${otherInputs[q.id] || ""}` : o
        );
        value = selections.join(", ");
      } else if (answers[q.id] === "__other__") {
        value = `Other: ${otherInputs[q.id] || ""}`;
      } else {
        value = answers[q.id] || "";
      }
      return { questionId: q.id, value };
    });

    // Check required
    for (const q of form.questions) {
      if (q.required) {
        const ans = allAnswers.find((a) => a.questionId === q.id);
        if (!ans || !ans.value.trim()) {
          setError(`"${q.label}" is required`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    // Resolve the respondent email
    let respondentEmail: string | undefined;
    if (form.emailCollection === "VERIFIED") {
      respondentEmail = session?.user?.email ?? undefined;
    } else if (form.emailCollection === "INPUT") {
      respondentEmail = inputEmail.trim();
    }

    try {
      const res = await fetch(`/api/submit/${form.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: allAnswers,
          respondentEmail,
          metadata: {
            timeOnForm: Math.round((Date.now() - startTime) / 1000),
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground">Your response has been submitted successfully.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // VERIFIED: gate the form behind sign-in
  if (form.emailCollection === "VERIFIED" && status !== "loading" && !session) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-2xl">{form.title}</CardTitle>
              {form.description && (
                <CardDescription>{form.description}</CardDescription>
              )}
            </CardHeader>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-6 space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Sign in to continue</p>
                <p className="text-sm text-muted-foreground">
                  This form requires you to sign in so your email address can be verified before submitting.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => signIn("google", { callbackUrl: window.location.href })}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderQuestion = (q: Question) => {
    const key = q.id;
    switch (q.type) {
      case "SHORT_TEXT":
        return (
          <Input
            placeholder={q.placeholder || "Your answer..."}
            value={answers[key] || ""}
            onChange={(e) => setAnswer(key, e.target.value)}
          />
        );
      case "LONG_TEXT":
        return (
          <Textarea
            placeholder={q.placeholder || "Your answer..."}
            value={answers[key] || ""}
            onChange={(e) => setAnswer(key, e.target.value)}
            className="min-h-[100px]"
          />
        );
      case "MULTIPLE_CHOICE": {
        const opts = (q.options || []);
        const hasOther = opts.includes("__other__");
        return (
          <div className="space-y-2">
            <RadioGroup value={answers[key] || ""} onValueChange={(v) => setAnswer(key, v)}>
              {opts.filter((o) => o !== "__other__").map((opt) => (
                <div key={opt} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt} id={`${key}-${opt}`} />
                  <Label htmlFor={`${key}-${opt}`}>{opt}</Label>
                </div>
              ))}
              {hasOther && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="__other__" id={`${key}-other`} />
                  <Label htmlFor={`${key}-other`}>Other…</Label>
                </div>
              )}
            </RadioGroup>
            {hasOther && answers[key] === "__other__" && (
              <Input
                autoFocus
                placeholder="Please specify…"
                value={otherInputs[key] || ""}
                onChange={(e) => setOtherInputs((p) => ({ ...p, [key]: e.target.value }))}
              />
            )}
          </div>
        );
      }
      case "CHECKBOX": {
        const opts = (q.options || []);
        const hasOther = opts.includes("__other__");
        const otherChecked = (checkboxAnswers[key] || []).includes("__other__");
        return (
          <div className="space-y-2">
            {opts.filter((o) => o !== "__other__").map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox
                  id={`${key}-${opt}`}
                  checked={(checkboxAnswers[key] || []).includes(opt)}
                  onCheckedChange={() => toggleCheckbox(key, opt)}
                />
                <Label htmlFor={`${key}-${opt}`}>{opt}</Label>
              </div>
            ))}
            {hasOther && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${key}-other`}
                  checked={otherChecked}
                  onCheckedChange={() => toggleCheckbox(key, "__other__")}
                />
                <Label htmlFor={`${key}-other`}>Other…</Label>
              </div>
            )}
            {hasOther && otherChecked && (
              <Input
                autoFocus
                placeholder="Please specify…"
                value={otherInputs[key] || ""}
                onChange={(e) => setOtherInputs((p) => ({ ...p, [key]: e.target.value }))}
              />
            )}
          </div>
        );
      }
      case "DROPDOWN": {
        const opts = (q.options || []);
        const hasOther = opts.includes("__other__");
        return (
          <div className="space-y-2">
            <Select value={answers[key] || ""} onValueChange={(v) => setAnswer(key, v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option...">
                  {answers[key] === "__other__" ? "Other…" : answers[key]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {opts.filter((o) => o !== "__other__").map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
                {hasOther && (
                  <SelectItem value="__other__">Other…</SelectItem>
                )}
              </SelectContent>
            </Select>
            {hasOther && answers[key] === "__other__" && (
              <Input
                autoFocus
                placeholder="Please specify…"
                value={otherInputs[key] || ""}
                onChange={(e) => setOtherInputs((p) => ({ ...p, [key]: e.target.value }))}
              />
            )}
          </div>
        );
      }
      case "RATING":
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                type="button"
                variant={answers[key] === String(n) ? "default" : "outline"}
                size="icon"
                onClick={() => setAnswer(key, String(n))}
              >
                <Star className={`h-4 w-4 ${answers[key] === String(n) ? "fill-current" : ""}`} />
              </Button>
            ))}
          </div>
        );
      case "NPS":
        return (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 11 }, (_, i) => (
              <Button
                key={i}
                type="button"
                variant={answers[key] === String(i) ? "default" : "outline"}
                size="sm"
                className="w-10"
                onClick={() => setAnswer(key, String(i))}
              >
                {i}
              </Button>
            ))}
            <div className="w-full flex justify-between text-xs text-muted-foreground mt-1">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>
          </div>
        );
      case "YES_NO":
        return (
          <div className="flex gap-3">
            <Button
              type="button"
              variant={answers[key] === "Yes" ? "default" : "outline"}
              onClick={() => setAnswer(key, "Yes")}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={answers[key] === "No" ? "default" : "outline"}
              onClick={() => setAnswer(key, "No")}
            >
              No
            </Button>
          </div>
        );
      case "DATE":
        return (
          <Input
            type="date"
            value={answers[key] || ""}
            onChange={(e) => setAnswer(key, e.target.value)}
          />
        );
      case "LINEAR_SCALE":
        return (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <Button
                key={i + 1}
                type="button"
                variant={answers[key] === String(i + 1) ? "default" : "outline"}
                size="sm"
                className="w-10"
                onClick={() => setAnswer(key, String(i + 1))}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        );
      case "FILE_UPLOAD":
        return (
          <Input
            type="file"
            onChange={(e) => setAnswer(key, e.target.files?.[0]?.name || "")}
          />
        );
      default:
        return (
          <Input
            placeholder="Your answer..."
            value={answers[key] || ""}
            onChange={(e) => setAnswer(key, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <CardDescription>{form.description}</CardDescription>
            )}
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* VERIFIED: show signed-in email read-only above all questions */}
          {form.emailCollection === "VERIFIED" && session?.user?.email && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input value={session.user.email} readOnly className="bg-muted cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Verified via your signed-in account.</p>
              </CardContent>
            </Card>
          )}

          {/* INPUT: show email input above all questions */}
          {form.emailCollection === "INPUT" && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="Enter your email address..."
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                />
              </CardContent>
            </Card>
          )}

          {form.questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="pt-6 space-y-3">
                <Label className="text-base font-medium">
                  {q.label}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderQuestion(q)}
              </CardContent>
            </Card>
          ))}

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> Submit Response</>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Powered by FeedMind
        </p>
      </div>
    </div>
  );
}
