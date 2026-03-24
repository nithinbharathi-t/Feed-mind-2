"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Share2, BarChart2, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/use-toast";

const actions = [
  {
    id: "ai",
    icon: Bot,
    iconBg: "bg-gradient-to-br from-[#7C3AED] to-[#4F46E5]",
    iconShadow: "shadow-[0_4px_14px_rgba(124,58,237,0.5)]",
    hoverBorder: "hover:border-[rgba(124,58,237,0.5)] hover:shadow-[0_0_16px_rgba(124,58,237,0.08)]",
    label: "AI Form Builder",
    desc: "Describe & generate",
    href: "/forms/new/ai",
  },
  {
    id: "share",
    icon: Share2,
    iconBg: "bg-gradient-to-br from-[#0EA5E9] to-[#2563EB]",
    iconShadow: "shadow-[0_4px_14px_rgba(14,165,233,0.5)]",
    hoverBorder: "hover:border-[rgba(14,165,233,0.5)] hover:shadow-[0_0_16px_rgba(14,165,233,0.08)]",
    label: "Share a Form",
    desc: "Copy link or embed",
    href: "#",
  },
  {
    id: "export",
    icon: BarChart2,
    iconBg: "bg-gradient-to-br from-[#10B981] to-[#059669]",
    iconShadow: "shadow-[0_4px_14px_rgba(16,185,129,0.5)]",
    hoverBorder: "hover:border-[rgba(16,185,129,0.5)] hover:shadow-[0_0_16px_rgba(16,185,129,0.08)]",
    label: "Export Responses",
    desc: "CSV, JSON, PDF",
    href: "#",
  },
  {
    id: "slack",
    icon: Link2,
    iconBg: "bg-gradient-to-br from-[#F59E0B] to-[#D97706]",
    iconShadow: "shadow-[0_4px_14px_rgba(245,158,11,0.5)]",
    hoverBorder: "hover:border-[rgba(245,158,11,0.5)] hover:shadow-[0_0_16px_rgba(245,158,11,0.08)]",
    label: "Connect Slack",
    desc: "Real-time alerts",
    href: "/profile",
  },
];

type QuickActionForm = {
  id: string;
  title: string;
  isPublished: boolean;
  questionCount: number;
  responseCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function getStatus(form: QuickActionForm): "live" | "draft" {
  return form.isPublished ? "live" : "draft";
}

export function QuickActions({ forms }: { forms: QuickActionForm[] }) {
  const router = useRouter();
  const [popupMode, setPopupMode] = useState<"share" | "export" | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "draft" | "paused">("all");

  const filteredForms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return forms.filter((form) => {
      const status = getStatus(form);
      const statusMatch = statusFilter === "all" || statusFilter === status;
      const searchMatch = !q || form.title.toLowerCase().includes(q);
      return statusMatch && searchMatch;
    });
  }, [forms, search, statusFilter]);

  const copyShareLink = async (form: QuickActionForm) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://feedmind.app";
    const link = `${baseUrl}/f/${form.id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Link copied", description: `Copied link for ${form.title}` });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy link", variant: "destructive" });
    }
  };

  const exportFormCsv = async (form: QuickActionForm) => {
    try {
      const res = await fetch(`/api/forms/${form.id}/responses`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to fetch responses");
      }

      type ApiAnswer = { value: string; question?: { label?: string | null } | null };
      type ApiResponse = {
        id: string;
        submittedAt: string;
        isSpam: boolean;
        isFlagged: boolean;
        integrityScore: number | null;
        sentimentScore: number | null;
        answers?: ApiAnswer[];
      };

      const responses = (await res.json()) as ApiResponse[];

      const rows = responses.map((r) => ({
        id: r.id,
        submittedAt: r.submittedAt,
        form: form.title,
        spam: r.isSpam,
        flagged: r.isFlagged,
        integrityScore: r.integrityScore,
        sentimentScore: r.sentimentScore,
        answers: (r.answers ?? [])
          .map((a) => `${a.question?.label ?? "Question"}: ${a.value ?? ""}`)
          .join(" | "),
      }));

      const headers = Object.keys(rows[0] ?? {
        id: "",
        submittedAt: "",
        form: "",
        spam: "",
        flagged: "",
        integrityScore: "",
        sentimentScore: "",
        answers: "",
      });

      const escapeValue = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const csv = [
        headers.join(","),
        ...rows.map((row) => headers.map((h) => escapeValue(row[h as keyof typeof row])).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safeTitle = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "form";
      anchor.href = url;
      anchor.download = `${safeTitle}-responses-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);

      toast({ title: "CSV downloaded", description: `Exported ${form.title}` });
    } catch {
      toast({ title: "Export failed", description: "Could not download CSV", variant: "destructive" });
    }
  };

  const statusPill = (status: "live" | "draft") => {
    if (status === "live") {
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20";
    }
    return "bg-muted text-muted-foreground border border-border";
  };

  const createdLabel = (createdAt: string | Date) => {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                if (a.id === "share" || a.label === "Share a Form") {
                  setPopupMode("share");
                  return;
                }
                if (a.id === "export" || a.label === "Export Responses") {
                  setPopupMode("export");
                  return;
                }
                if ((a.id === "ai" || a.id === "slack") && a.href && a.href !== "#") {
                  router.push(a.href);
                }
              }}
              className={`group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${a.hoverBorder}`}
            >
              <div
                className={`h-9 w-9 shrink-0 rounded-xl ${a.iconBg} ${a.iconShadow} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
              >
                <Icon className="h-[18px] w-[18px] text-white" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{a.label}</p>
                <p className="truncate text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={popupMode !== null} onOpenChange={(open) => !open && setPopupMode(null)}>
        <DialogContent className="max-w-2xl border-border bg-background p-0">
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle className="text-base">{popupMode === "export" ? "Export responses" : "Share a form"}</DialogTitle>
            <DialogDescription>
              {popupMode === "export"
                ? "Click any form to instantly download its CSV"
                : "Click any form to instantly copy its share link"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 border-b border-border/70 px-5 py-3">
            <Input
              placeholder="Search forms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
            <select
              className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm text-muted-foreground"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "live" | "draft" | "paused")}
            >
              <option value="all">All status</option>
              <option value="live">Live</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div className="grid h-[320px] grid-cols-1 gap-3 overflow-y-auto px-4 py-4 sm:grid-cols-2">
            {filteredForms.length === 0 && (
              <div className="col-span-2 rounded-lg border border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                No forms match your search.
              </div>
            )}

            {filteredForms.map((form) => {
              const status = getStatus(form);
              return (
                <button
                  key={form.id}
                  onClick={() => (popupMode === "export" ? exportFormCsv(form) : copyShareLink(form))}
                  className="flex h-[91px] flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:bg-muted/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold leading-snug">{form.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusPill(status)}`}>
                      {status}
                    </span>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>Ques: {form.questionCount}</span>
                    <span>Resp: {form.responseCount}</span>
                    <span>{createdLabel(form.createdAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border/70 px-5 py-2 text-xs text-muted-foreground">
            <p>{filteredForms.length} form{filteredForms.length !== 1 ? "s" : ""}</p>
            <p>{popupMode === "export" ? "CSV download" : "feedmind.app/f/..."}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
