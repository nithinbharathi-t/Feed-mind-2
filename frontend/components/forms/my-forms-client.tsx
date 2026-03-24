"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
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
  HelpCircle,
  Clock3,
  Loader2,
  Share2,
  PauseCircle,
  PlayCircle,
  ArrowUpRight,
  Filter,
  Trash,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteForm, publishForm } from "@/server/actions/forms";
import { CreateFormDialog } from "@/components/dashboard/create-form-dialog";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/use-toast";

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
type SortMode = "updated" | "name" | "responses" | "questions";

type ShareFilter = "all" | "published" | "draft";

const PALETTES = [
  { accent: "#00ffe4", icon: "linear-gradient(135deg,#00ffe4,#8b72ff)" },
  { accent: "#8b72ff", icon: "linear-gradient(135deg,#8b72ff,#ff4f6e)" },
  { accent: "#10e8a2", icon: "linear-gradient(135deg,#10e8a2,#00ffe4)" },
  { accent: "#ffb020", icon: "linear-gradient(135deg,#ffb020,#ff4f6e)" },
  { accent: "#3b82f6", icon: "linear-gradient(135deg,#3b82f6,#8b72ff)" },
  { accent: "#f472b6", icon: "linear-gradient(135deg,#f472b6,#fb7185)" },
];

function getInitials(value: string) {
  const normalized = value.trim();
  if (!normalized) return "FM";
  return normalized
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function compareBy(sortBy: SortMode, a: FormItem, b: FormItem) {
  if (sortBy === "name") return a.title.localeCompare(b.title);
  if (sortBy === "responses") return b.responseCount - a.responseCount;
  if (sortBy === "questions") return b.questionCount - a.questionCount;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function getStatusVisual(isPublished: boolean) {
  return isPublished
    ? {
        accent: "linear-gradient(90deg,#047857 0%,#10b981 45%,#34d399 100%)",
        icon: "linear-gradient(135deg,#10b981,#34d399)",
      }
    : {
        accent: "linear-gradient(90deg,#b45309 0%,#f59e0b 45%,#fb923c 100%)",
        icon: "linear-gradient(135deg,#f59e0b,#fb923c)",
      };
}

export function MyFormsClient({ forms, totalResponses }: MyFormsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [tab, setTab] = useState<Tab>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("updated");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FormItem | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareSearch, setShareSearch] = useState("");
  const [shareFilter, setShareFilter] = useState<ShareFilter>("all");

  const published = useMemo(() => forms.filter((f) => f.isPublished), [forms]);
  const drafts = useMemo(() => forms.filter((f) => !f.isPublished), [forms]);
  const spamTotal = useMemo(() => forms.reduce((sum, f) => sum + f.spamCount, 0), [forms]);

  const filteredForms = useMemo(() => {
    if (tab === "bin") return [];
    const base = tab === "published" ? published : tab === "drafts" ? drafts : forms;

    const filtered = base.filter((f) => {
      if (!search.trim()) return true;
      const needle = search.toLowerCase();
      return (
        f.title.toLowerCase().includes(needle) ||
        (f.description ?? "").toLowerCase().includes(needle)
      );
    });

    return [...filtered].sort((a, b) => compareBy(sortBy, a, b));
  }, [forms, drafts, published, search, sortBy, tab]);

  const shareForms = useMemo(() => {
    return forms
      .filter((f) => {
        const bySearch = !shareSearch.trim() || f.title.toLowerCase().includes(shareSearch.toLowerCase());
        const byFilter =
          shareFilter === "all" ||
          (shareFilter === "published" && f.isPublished) ||
          (shareFilter === "draft" && !f.isPublished);
        return bySearch && byFilter;
      })
      .sort((a, b) => compareBy("updated", a, b));
  }, [forms, shareFilter, shareSearch]);

  const tabMeta = [
    { key: "all" as const, label: "All Forms", count: forms.length },
    { key: "published" as const, label: "Published", count: published.length },
    { key: "drafts" as const, label: "Drafts", count: drafts.length },
  ];

  const copyPublicLink = async (form: FormItem) => {
    try {
      const url = `${window.location.origin}/f/${form.id}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: `Copied link for ${form.title}` });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePublish = async (form: FormItem) => {
    setTogglingId(form.id);
    startTransition(async () => {
      await publishForm(form.id, !form.isPublished);
      setTogglingId(null);
      router.refresh();
    });
  };

  const handleDelete = async (form: FormItem) => {
    setConfirmDelete(null);
    setDeletingId(form.id);
    startTransition(async () => {
      await deleteForm(form.id);
      setDeletingId(null);
      router.refresh();
      toast({ title: "Form deleted", description: `${form.title} was deleted.` });
    });
  };

  return (
    <>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute top-40 right-10 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border/50 bg-gradient-to-b from-slate-950/80 to-slate-900/70 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight">My Forms</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {forms.length} forms · {published.length} published · {drafts.length} drafts · {totalResponses} responses
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTab(tab === "bin" ? "all" : "bin")}
                  className={cn(
                    "gap-1.5 border text-xs",
                    tab === "bin"
                      ? "border-red-400/30 bg-red-500/10 text-red-300"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Trash className="h-3.5 w-3.5" />
                  Bin
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShareOpen(true)}>
                  <Share2 className="h-3.5 w-3.5" />
                  Share a form
                </Button>
                <CreateFormDialog />
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatChip label="Total forms" value={forms.length} tone="default" />
            <StatChip label="Published" value={published.length} tone="emerald" />
            <StatChip label="Drafts" value={drafts.length} tone="amber" />
            <StatChip label="Spam flags" value={spamTotal} tone="rose" />
          </section>

          <section className="rounded-2xl border border-border/60 bg-card/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-background/60 p-1">
                {tabMeta.map((item) => {
                  const isActive = tab === item.key;
                  const activeClass =
                    item.key === "published"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : item.key === "drafts"
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-primary/15 text-primary";

                  const countClass =
                    item.key === "published"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : item.key === "drafts"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-primary/20 text-primary";

                  return (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      isActive
                        ? activeClass
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px]",
                        isActive ? countClass : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.count}
                    </span>
                  </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search forms"
                    className="h-8 w-56 border-border/60 bg-background/70 pl-8 text-xs"
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortMode)}
                    className="h-8 rounded-md border border-border/60 bg-background/70 pl-8 pr-8 text-xs text-muted-foreground outline-none ring-offset-background transition focus:ring-1 focus:ring-primary"
                  >
                    <option value="updated">Last modified</option>
                    <option value="name">Name A-Z</option>
                    <option value="responses">Most responses</option>
                    <option value="questions">Most questions</option>
                  </select>
                </div>

                <div className="flex items-center rounded-lg border border-border/60 bg-background/70 p-0.5">
                  <button
                    onClick={() => setView("grid")}
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      view === "grid" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Grid view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      view === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {(filteredForms.length === 0 || tab === "bin") && (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40">
                {tab === "bin" ? <Trash className="h-6 w-6 text-red-400/70" /> : <HelpCircle className="h-6 w-6 text-muted-foreground/60" />}
              </div>
              <h3 className="text-lg font-semibold">
                {tab === "bin" ? "Bin is empty" : search ? "No forms match your search" : "No forms yet"}
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {tab === "bin"
                  ? "Deleted forms will appear here before permanent cleanup."
                  : search
                  ? "Try a different keyword or clear your search."
                  : "Create your first form to start collecting responses."}
              </p>
              {!search && tab === "all" && (
                <div className="mt-5 inline-flex">
                  <CreateFormDialog />
                </div>
              )}
            </div>
          )}

          {filteredForms.length > 0 && view === "grid" && tab !== "bin" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredForms.map((form) => (
                <FormCard
                  key={form.id}
                  form={form}
                  visual={getStatusVisual(form.isPublished)}
                  isPending={isPending && (deletingId === form.id || togglingId === form.id)}
                  onCopyLink={() => copyPublicLink(form)}
                  onTogglePublish={() => handleTogglePublish(form)}
                  onDelete={() => setConfirmDelete(form)}
                />
              ))}
            </div>
          )}

          {filteredForms.length > 0 && view === "list" && tab !== "bin" && (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
              <div className="grid grid-cols-[1fr_120px_100px_90px_130px_50px] border-b border-border/60 px-5 py-3">
                {[
                  "Form",
                  "Status",
                  "Responses",
                  "Questions",
                  "Updated",
                  "",
                ].map((column) => (
                  <div
                    key={column}
                    className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60"
                  >
                    {column}
                  </div>
                ))}
              </div>

              {filteredForms.map((form, idx) => (
                <FormRow
                  key={form.id}
                  form={form}
                  accent={PALETTES[idx % PALETTES.length].accent}
                  isPending={isPending && (deletingId === form.id || togglingId === form.id)}
                  onCopyLink={() => copyPublicLink(form)}
                  onTogglePublish={() => handleTogglePublish(form)}
                  onDelete={() => setConfirmDelete(form)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-2xl border-border/60 bg-slate-950/95">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Share a form</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Input
                value={shareSearch}
                onChange={(e) => setShareSearch(e.target.value)}
                placeholder="Search forms"
                className="h-9 flex-1 border-border/60 bg-background/70 text-sm"
              />
              <select
                value={shareFilter}
                onChange={(e) => setShareFilter(e.target.value as ShareFilter)}
                className="h-9 rounded-md border border-border/60 bg-background/70 px-3 text-sm text-muted-foreground outline-none"
              >
                <option value="all">All status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
            </div>

            <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {shareForms.length > 0 ? (
                shareForms.map((form, idx) => {
                  const visual = getStatusVisual(form.isPublished);
                  return (
                    <button
                      key={form.id}
                      onClick={() => copyPublicLink(form)}
                      className="rounded-xl border border-border/60 bg-card/70 p-3 text-left transition-colors hover:border-primary/40 hover:bg-card"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black text-slate-950"
                          style={{ background: visual.icon }}
                        >
                          {getInitials(form.title)}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            form.isPublished
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-300"
                          )}
                        >
                          {form.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold">{form.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {form.responseCount} resp. · {form.questionCount} Qs
                      </p>
                    </button>
                  );
                })
              ) : (
                <p className="col-span-2 rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                  No forms match your filters.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete form?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{confirmDelete?.title}</span> and all responses will be permanently deleted.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>
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

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : tone === "rose"
      ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
      : tone === "amber"
      ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
      : "bg-primary/10 text-primary border-primary/20";

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("h-2.5 w-2.5 rounded-full", toneClass)}>
          <span className="sr-only">status tone</span>
        </span>
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function FormCard({
  form,
  visual,
  isPending,
  onCopyLink,
  onTogglePublish,
  onDelete,
}: {
  form: FormItem;
  visual: { accent: string; icon: string };
  isPending: boolean;
  onCopyLink: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_14px_32px_-10px_rgba(0,0,0,0.6)]",
        isPending && "pointer-events-none opacity-60"
      )}
    >
      <div className="h-1 w-full" style={{ background: visual.accent }} />

      <div className="flex h-full flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-slate-950"
            style={{ background: visual.icon }}
          >
            {getInitials(form.title)}
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                form.isPublished
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/20 bg-amber-500/10 text-amber-300"
              )}
            >
              {form.isPublished ? (
                <>
                  <Globe className="h-3 w-3" /> Published
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> Draft
                </>
              )}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href={`/forms/${form.id}/edit`} className="flex items-center gap-2">
                    <Edit3 className="h-3.5 w-3.5" /> Edit form
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
                      <ArrowUpRight className="h-3.5 w-3.5" /> View live
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCopyLink} className="flex items-center gap-2">
                  <Copy className="h-3.5 w-3.5" /> Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onTogglePublish} className="flex items-center gap-2">
                  {form.isPublished ? (
                    <>
                      <PauseCircle className="h-3.5 w-3.5" /> Unpublish
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-3.5 w-3.5" /> Publish
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="flex items-center gap-2 text-red-500 focus:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Link href={`/forms/${form.id}/edit`} className="group/title flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover/title:text-primary">
            {form.title}
          </h3>
          {form.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{form.description}</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground/60">No description yet</p>
          )}
        </Link>

        <div className="mt-4 border-t border-border/50 pt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" />
              <span className="font-semibold text-foreground">{form.responseCount}</span>
              responses
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HelpCircle className="h-3 w-3" />
              <span className="font-semibold text-foreground">{form.questionCount}</span>
              questions
            </span>
            {form.spamCount > 0 && (
              <span className="ml-auto rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                {form.spamCount} spam
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
              <Clock3 className="h-3 w-3" />
              {formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}
            </span>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Link href={`/forms/${form.id}/edit`}>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Edit3 className="h-3 w-3" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopyLink}>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
    </article>
  );
}

function FormRow({
  form,
  accent,
  isPending,
  onCopyLink,
  onTogglePublish,
  onDelete,
}: {
  form: FormItem;
  accent: string;
  isPending: boolean;
  onCopyLink: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group grid grid-cols-[1fr_120px_100px_90px_130px_50px] items-center gap-3 border-b border-border/50 px-5 py-3.5 last:border-0",
        "transition-colors hover:bg-muted/20",
        isPending && "pointer-events-none opacity-60"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <div className="min-w-0">
          <Link href={`/forms/${form.id}/edit`} className="block truncate text-sm font-medium transition-colors hover:text-primary">
            {form.title}
          </Link>
          {form.description && <p className="truncate text-[11px] text-muted-foreground">{form.description}</p>}
        </div>
      </div>

      <div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
            form.isPublished ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"
          )}
        >
          {form.isPublished ? "Published" : "Draft"}
        </span>
      </div>

      <div className="text-sm">
        {form.responseCount > 0 ? (
          <span className="font-medium text-foreground">{form.responseCount}</span>
        ) : (
          <span className="text-muted-foreground/40">-</span>
        )}
      </div>

      <div className="text-sm text-muted-foreground">{form.questionCount}</div>

      <div className="text-xs text-muted-foreground">{format(new Date(form.updatedAt), "MMM d, yyyy")}</div>

      <div className="flex justify-end">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/forms/${form.id}/edit`} className="flex items-center gap-2">
                  <Edit3 className="h-3.5 w-3.5" /> Edit form
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCopyLink} className="flex items-center gap-2">
                <Copy className="h-3.5 w-3.5" /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePublish} className="flex items-center gap-2">
                {form.isPublished ? (
                  <>
                    <PauseCircle className="h-3.5 w-3.5" /> Unpublish
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-3.5 w-3.5" /> Publish
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="flex items-center gap-2 text-red-500 focus:text-red-500">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
