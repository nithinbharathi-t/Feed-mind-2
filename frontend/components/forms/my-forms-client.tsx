"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { deleteForm, publishForm } from "@/server/actions/forms";
import { CreateFormDialog } from "@/components/dashboard/create-form-dialog";
import {
  Search,
  LayoutGrid,
  List,
  Edit3,
  BarChart3,
  MessageSquare,
  ExternalLink,
  Trash2,
  MoreHorizontal,
  Globe,
  Lock,
  FileText,
  Plus,
  HelpCircle,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  Loader2,
  CheckSquare,
  Trash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface FormItem {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  questionCount: number;
  responseCount: number;
  spamCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MyFormsClientProps {
  forms: FormItem[];
  totalResponses: number;
}

type Tab = "all" | "published" | "drafts" | "bin";
type ViewMode = "grid" | "list";

export function MyFormsClient({ forms, totalResponses }: MyFormsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FormItem | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const published = forms.filter((f) => f.isPublished);
  const drafts = forms.filter((f) => !f.isPublished);

  const filtered = useMemo(() => {
    if (tab === "bin") return [];
    const base = tab === "published" ? published : tab === "drafts" ? drafts : forms;
    if (!search.trim()) return base;
    return base.filter((f) =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.description ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [forms, tab, search, published, drafts]);

  const handleDelete = async (form: FormItem) => {
    setConfirmDelete(null);
    setDeletingId(form.id);
    startTransition(async () => {
      await deleteForm(form.id);
      setDeletingId(null);
      router.refresh();
    });
  };

  const handleTogglePublish = async (form: FormItem) => {
    setTogglingId(form.id);
    startTransition(async () => {
      await publishForm(form.id, !form.isPublished);
      setTogglingId(null);
      router.refresh();
    });
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All Forms", count: forms.length },
    { key: "published", label: "Published", count: published.length },
    { key: "drafts", label: "Drafts", count: drafts.length },
  ];

  return (
    <>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 -mx-9 -mt-6 px-9 py-4 bg-background/95 backdrop-blur-sm border-b border-border/40 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">My Forms</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {forms.length} form{forms.length !== 1 ? "s" : ""} · {totalResponses} total responses
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input
                placeholder="Search forms…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 w-52 text-sm bg-card/60 border-border/60 focus:border-primary/50"
              />
            </div>
            {/* View Toggle */}
            <div className="flex items-center gap-0.5 bg-card/60 border border-border/40 rounded-lg p-0.5">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  view === "grid" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  view === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <CreateFormDialog />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  tab === t.key
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0 rounded-full font-semibold",
                    tab === t.key
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          {/* Bin button */}
          <button
            onClick={() => setTab(tab === "bin" ? "all" : "bin")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              tab === "bin"
                ? "bg-red-500/15 text-red-400"
                : "text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/10"
            )}
          >
            <Trash className="h-3.5 w-3.5" />
            Bin
          </button>
        </div>
      </div>

      {/* ── Empty State ── */}
      {(filtered.length === 0 || tab === "bin") && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl mb-4",
            tab === "bin" ? "bg-red-500/10" : "bg-muted/40"
          )}>
            {tab === "bin"
              ? <Trash className="h-7 w-7 text-red-400/60" />
              : <FileText className="h-7 w-7 text-muted-foreground/50" />
            }
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {tab === "bin" ? "Bin is empty" : search ? "No forms match your search" : "No forms yet"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            {tab === "bin"
              ? "Deleted forms will appear here and be permanently removed after 30 days."
              : search
              ? "Try a different keyword or clear the search"
              : tab === "published"
              ? "You haven't published any forms yet."
              : tab === "drafts"
              ? "You have no draft forms."
              : "Create your first form to start collecting responses."}
          </p>
          {!search && tab === "all" && <CreateFormDialog />}
        </div>
      )}

      {/* ── Grid View ── */}
      {filtered.length > 0 && view === "grid" && tab !== "bin" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              isPending={deletingId === form.id || togglingId === form.id}
              onTogglePublish={() => handleTogglePublish(form)}
              onDelete={() => setConfirmDelete(form)}
            />
          ))}
        </div>
      )}

      {/* ── List View ── */}
      {filtered.length > 0 && view === "list" && tab !== "bin" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2.5fr_110px_90px_90px_130px_44px] gap-3 px-5 py-3 border-b border-border">
            {["Form", "Status", "Responses", "Questions", "Updated", ""].map((h) => (
              <div
                key={h}
                className="text-[0.67rem] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none"
              >
                {h}
              </div>
            ))}
          </div>
          {filtered.map((form) => (
            <FormRow
              key={form.id}
              form={form}
              isPending={deletingId === form.id || togglingId === form.id}
              onTogglePublish={() => handleTogglePublish(form)}
              onDelete={() => setConfirmDelete(form)}
            />
          ))}
        </div>
      )}

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete form?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{confirmDelete?.title}</span> and all its responses will be permanently deleted. This cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ──────────────────────────────────────────
   Form Card (Grid view)
────────────────────────────────────────── */
function FormCard({
  form,
  isPending,
  onTogglePublish,
  onDelete,
}: {
  form: FormItem;
  isPending: boolean;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card overflow-hidden transition-all duration-200",
        "hover:border-primary/30 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_8px_24px_-4px_rgba(0,0,0,0.4)]",
        isPending && "opacity-60 pointer-events-none",
        form.isPublished ? "border-border" : "border-border/50"
      )}
    >
      {/* Top colour strip */}
      <div
        className={cn(
          "h-1 w-full",
          form.isPublished
            ? "bg-gradient-to-r from-[#0CFFE1]/60 to-[#7B6CFF]/60"
            : "bg-muted/40"
        )}
      />

      <div className="flex flex-col flex-1 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 shrink-0">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-semibold border",
                form.isPublished
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-muted/30 text-muted-foreground/70 border-border"
              )}
            >
              {form.isPublished ? (
                <><Globe className="h-2.5 w-2.5" /> Published</>
              ) : (
                <><Lock className="h-2.5 w-2.5" /> Draft</>
              )}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href={`/forms/${form.id}/edit`} className="flex items-center gap-2">
                    <Edit3 className="h-3.5 w-3.5" /> Edit Form
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/forms/${form.id}/responses`} className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" /> Responses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/forms/${form.id}/analytics`} className="flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5" /> Analytics
                  </Link>
                </DropdownMenuItem>
                {form.isPublished && (
                  <DropdownMenuItem asChild>
                    <Link href={`/f/${form.id}`} target="_blank" className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5" /> View Live
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onTogglePublish} className="flex items-center gap-2">
                  {form.isPublished ? (
                    <><EyeOff className="h-3.5 w-3.5" /> Unpublish</>
                  ) : (
                    <><Eye className="h-3.5 w-3.5" /> Publish</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="flex items-center gap-2 text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title & description */}
        <Link href={`/forms/${form.id}/edit`} className="flex-1 group/title">
          <h3 className="font-semibold text-sm leading-snug group-hover/title:text-primary transition-colors line-clamp-2 mb-1">
            {form.title}
          </h3>
          {form.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{form.description}</p>
          )}
        </Link>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span className="font-medium text-foreground">{form.responseCount}</span>
            <span>response{form.responseCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HelpCircle className="h-3 w-3" />
            <span className="font-medium text-foreground">{form.questionCount}</span>
            <span>question{form.questionCount !== 1 ? "s" : ""}</span>
          </div>
          {form.spamCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-400 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {form.spamCount} spam
            </div>
          )}
        </div>

        {/* Footer: date + quick actions */}
        <div className="flex items-center justify-between mt-3 pt-0">
          <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href={`/forms/${form.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Edit3 className="h-3 w-3" />
              </Button>
            </Link>
            <Link href={`/forms/${form.id}/analytics`}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <BarChart3 className="h-3 w-3" />
              </Button>
            </Link>
            <Link href={`/forms/${form.id}/responses`}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MessageSquare className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-2xl">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Form Row (List view)
────────────────────────────────────────── */
function FormRow({
  form,
  isPending,
  onTogglePublish,
  onDelete,
}: {
  form: FormItem;
  isPending: boolean;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2.5fr_110px_90px_90px_130px_44px] gap-3 px-5 py-3.5 border-b border-border/50 last:border-0 items-center transition-colors group",
        "hover:bg-muted/15",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      {/* Name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={cn(
            "h-2 w-2 rounded-full shrink-0",
            form.isPublished
              ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
              : "bg-muted-foreground/30"
          )}
        />
        <div className="min-w-0">
          <Link
            href={`/forms/${form.id}/edit`}
            className="text-sm font-medium truncate block hover:text-primary transition-colors"
          >
            {form.title}
          </Link>
          {form.description && (
            <p className="text-[11px] text-muted-foreground truncate">{form.description}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-semibold border",
            form.isPublished
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-muted/30 text-muted-foreground/70 border-border"
          )}
        >
          {form.isPublished ? "● Published" : "Draft"}
        </span>
      </div>

      {/* Responses */}
      <div className="text-sm">
        {form.responseCount > 0 ? (
          <span className="font-medium text-foreground">{form.responseCount}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </div>

      {/* Questions */}
      <div className="text-sm">
        <span className="text-muted-foreground">{form.questionCount}</span>
      </div>

      {/* Updated */}
      <div className="text-xs text-muted-foreground">
        {format(new Date(form.updatedAt), "MMM d, yyyy")}
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={`/forms/${form.id}/edit`} className="flex items-center gap-2">
                <Edit3 className="h-3.5 w-3.5" /> Edit Form
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/forms/${form.id}/responses`} className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" /> Responses
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/forms/${form.id}/analytics`} className="flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5" /> Analytics
              </Link>
            </DropdownMenuItem>
            {form.isPublished && (
              <DropdownMenuItem asChild>
                <Link href={`/f/${form.id}`} target="_blank" className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" /> View Live
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onTogglePublish} className="flex items-center gap-2">
              {form.isPublished ? (
                <><EyeOff className="h-3.5 w-3.5" /> Unpublish</>
              ) : (
                <><Eye className="h-3.5 w-3.5" /> Publish</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="flex items-center gap-2 text-red-500 focus:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
