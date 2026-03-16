"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, getIntegrityColor, getIntegrityLabel, getSentimentEmoji } from "@/lib/utils";
import { MoreHorizontal, Flag, Trash2, AlertTriangle, Download, ChevronDown, ChevronUp, Search } from "lucide-react";
import { markResponseAsSpam, flagResponse, deleteResponse } from "@/server/actions/responses";
import { toast } from "@/lib/use-toast";

interface ResponseAnswer {
  questionId: string;
  questionLabel: string;
  value: string;
}

interface ResponseData {
  id: string;
  submittedAt: string;
  integrityScore: number | null;
  sentimentScore: number | null;
  isSpam: boolean;
  isFlagged: boolean;
  answers: ResponseAnswer[];
}

interface ResponsesClientProps {
  formId: string;
  questions: any[];
  responses: ResponseData[];
}

export function ResponsesClient({ formId, questions, responses: initialResponses }: ResponsesClientProps) {
  const [responses, setResponses] = useState(initialResponses);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "flagged" | "spam">("all");

  const filtered = responses.filter((r) => {
    if (filter === "flagged" && !r.isFlagged) return false;
    if (filter === "spam" && !r.isSpam) return false;
    if (searchTerm) {
      return r.answers.some((a) =>
        a.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  const handleMarkSpam = async (id: string) => {
    try {
      await markResponseAsSpam(id);
      setResponses((prev) => prev.map((r) => (r.id === id ? { ...r, isSpam: true } : r)));
      toast({ title: "Marked as spam" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleFlag = async (id: string, flagged: boolean) => {
    try {
      await flagResponse(id, flagged);
      setResponses((prev) => prev.map((r) => (r.id === id ? { ...r, isFlagged: flagged } : r)));
      toast({ title: flagged ? "Flagged for review" : "Unflagged" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResponse(id);
      setResponses((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Response deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const headers = ["Submitted", "Integrity Score", "Sentiment", ...questions.map((q) => q.label)];
    const rows = responses.map((r) => [
      formatDate(r.submittedAt),
      r.integrityScore?.toString() || "N/A",
      r.sentimentScore?.toString() || "N/A",
      ...questions.map((q) => {
        const ans = r.answers.find((a) => a.questionId === q.id);
        return `"${(ans?.value || "").replace(/"/g, '""')}"`;
      }),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `responses-${formId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search responses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "flagged", "spam"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No responses found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className={r.isSpam ? "border-red-500/30" : r.isFlagged ? "border-amber-500/30" : ""}>
              <CardContent className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <span className="font-medium">{formatDate(r.submittedAt)}</span>
                    </div>
                    {r.integrityScore !== null && (
                      <Badge variant="outline" className={getIntegrityColor(r.integrityScore)}>
                        {getIntegrityLabel(r.integrityScore)} ({Math.round(r.integrityScore)})
                      </Badge>
                    )}
                    <span className="text-lg">{getSentimentEmoji(r.sentimentScore)}</span>
                    {r.isSpam && <Badge variant="destructive">Spam</Badge>}
                    {r.isFlagged && !r.isSpam && <Badge variant="warning">Flagged</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleFlag(r.id, !r.isFlagged)}>
                          <Flag className="h-4 w-4 mr-2" /> {r.isFlagged ? "Unflag" : "Flag for Review"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkSpam(r.id)}>
                          <AlertTriangle className="h-4 w-4 mr-2" /> Mark as Spam
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {expandedId === r.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {expandedId === r.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {r.answers.map((a, i) => (
                      <div key={i} className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{a.questionLabel}</p>
                        <p className="text-sm">{a.value || <span className="italic text-muted-foreground">No answer</span>}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
