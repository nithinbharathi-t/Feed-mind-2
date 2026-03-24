"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/lib/use-toast";

interface AIProviderSettingsProps {
  currentProvider: string;
  isEnabled: boolean;
}

type AIProvider = "gemini" | "grok" | "claude";

const providers: Record<AIProvider, { name: string; description: string; color: string }> = {
  gemini: {
    name: "Google Gemini",
    description: "Fast, accurate question generation with excellent understanding",
    color: "from-blue-600 to-cyan-600",
  },
  grok: {
    name: "Xai Grok",
    description: "Powerful model with real-time information processing",
    color: "from-purple-600 to-pink-600",
  },
  claude: {
    name: "Anthropic Claude",
    description: "Advanced reasoning and detailed analysis capabilities",
    color: "from-orange-600 to-red-600",
  },
};

export function AIProviderSettings({ currentProvider, isEnabled }: AIProviderSettingsProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
    (currentProvider as AIProvider) || "gemini"
  );
  const [enableAI, setEnableAI] = useState(isEnabled);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/ai-provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          enabled: enableAI,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save AI provider");
      }

      toast({
        title: "Success",
        description: `AI provider set to ${providers[selectedProvider].name}${enableAI ? " and enabled" : " and disabled"}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <div className="flex-1">
              <CardTitle>AI Model Selection</CardTitle>
              <CardDescription>Choose which AI provider to use for question generation</CardDescription>
            </div>
            {enableAI && (
              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select AI Provider:</p>
            <div className="grid gap-3">
              {(Object.entries(providers) as [AIProvider, typeof providers.gemini][]).map(
                ([provider, config]) => (
                  <button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedProvider === provider
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{config.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{config.description}</p>
                      </div>
                      {selectedProvider === provider && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          <Separator />

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">AI Question Generation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {enableAI
                  ? "AI-powered question suggestions are currently enabled"
                  : "AI-powered question suggestions are currently disabled"}
              </p>
            </div>
            <button
              onClick={() => setEnableAI(!enableAI)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                enableAI ? "bg-green-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  enableAI ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <p className="font-semibold">How it works:</p>
              <p className="mt-1">
                The selected AI provider will be used to generate intelligent question suggestions when building forms.
                Gemini is recommended for the best balance of speed and quality.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save AI Provider Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
