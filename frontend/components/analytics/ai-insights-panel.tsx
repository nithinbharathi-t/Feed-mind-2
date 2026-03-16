"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { analyzeFormResponses } from "@/server/actions/ai";
import { toast } from "@/lib/use-toast";

interface AiInsightsPanelProps {
  formId: string;
  hasResponses: boolean;
}

interface Insights {
  keyThemes: string[];
  commonComplaints: string[];
  actionableSuggestions: string[];
  sentimentSummary: string;
  overallSentiment: string;
}

export function AiInsightsPanel({ formId, hasResponses }: AiInsightsPanelProps) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await analyzeFormResponses(formId);
      setInsights(result);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!insights) return;
    const text = `Key Themes:\n${insights.keyThemes.map((t) => `- ${t}`).join("\n")}\n\nCommon Complaints:\n${insights.commonComplaints.map((c) => `- ${c}`).join("\n")}\n\nSuggestions:\n${insights.actionableSuggestions.map((s) => `- ${s}`).join("\n")}\n\nSentiment: ${insights.sentimentSummary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sentimentColor = {
    positive: "text-emerald-500",
    neutral: "text-amber-500",
    negative: "text-red-500",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Insights
        </CardTitle>
        {insights && (
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!insights ? (
          <div className="text-center space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {hasResponses
                ? "Generate AI-powered insights from your form responses"
                : "Need responses before generating insights"}
            </p>
            <Button onClick={handleGenerate} disabled={isLoading || !hasResponses}>
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate Insights</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Overall Sentiment</h4>
              <Badge className={sentimentColor[insights.overallSentiment as keyof typeof sentimentColor] || ""}>
                {insights.overallSentiment}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">{insights.sentimentSummary}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Key Themes</h4>
              <div className="flex flex-wrap gap-2">
                {insights.keyThemes.map((theme, i) => (
                  <Badge key={i} variant="secondary">{theme}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Common Concerns</h4>
              <ul className="space-y-1">
                {insights.commonComplaints.map((c, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">&#x2022;</span> {c}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Actionable Suggestions</h4>
              <ul className="space-y-1">
                {insights.actionableSuggestions.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">&#x2022;</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Regenerate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
