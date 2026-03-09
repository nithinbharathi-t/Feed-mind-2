"use client";

import Link from "next/link";
import { Edit, MoreHorizontal, Eye, BarChart3, Trash2, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface FormItem {
  id: string;
  title: string;
  isPublished: boolean;
  responseCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FormListProps {
  forms: FormItem[];
  onDelete?: (id: string) => void;
}

export function FormList({ forms, onDelete }: FormListProps) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-[0.95rem] tracking-tight">Recent Forms</h3>
        <Link href="/forms" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          View all forms →
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground mb-3">No forms yet. Create your first form!</p>
          <Link
            href="/forms/new"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Create Form →
          </Link>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div className="grid grid-cols-[2fr_100px_90px_120px_70px_48px] gap-3 px-5 py-2.5 border-b border-border">
            {["Form Name", "Status", "Responses", "Updated", "Rate", ""].map((h) => (
              <div key={h} className="text-[0.68rem] font-medium text-muted-foreground/60 uppercase tracking-widest">{h}</div>
            ))}
          </div>

          {/* Table rows */}
          {forms.map((form) => (
            <div
              key={form.id}
              className="grid grid-cols-[2fr_100px_90px_120px_70px_48px] gap-3 px-5 py-3.5 border-b border-border last:border-0 items-center hover:bg-muted/20 transition-colors cursor-pointer group"
            >
              {/* Name */}
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  form.isPublished
                    ? "bg-emerald-500 shadow-[0_0_6px_rgba(0,255,163,0.5)]"
                    : "bg-muted-foreground/40"
                }`} />
                <Link
                  href={`/forms/${form.id}/responses`}
                  className="text-sm font-medium truncate hover:text-primary transition-colors"
                >
                  {form.title}
                </Link>
              </div>

              {/* Status */}
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.7rem] font-semibold border ${
                  form.isPublished
                    ? "bg-emerald-500/8 text-emerald-500 border-emerald-500/15"
                    : "bg-muted/30 text-muted-foreground border-border"
                }`}>
                  {form.isPublished ? "● Published" : "Draft"}
                </span>
              </div>

              {/* Responses */}
              <div className="text-sm text-muted-foreground">
                {form.responseCount > 0 ? form.responseCount : <span className="text-muted-foreground/40">—</span>}
              </div>

              {/* Updated */}
              <div className="text-sm text-muted-foreground">
                {format(new Date(form.updatedAt), "MMM d, yyyy")}
              </div>

              {/* Rate */}
              <div className="text-sm">
                {form.responseCount > 0 ? (
                  <span className="text-amber-500">{Math.min(100, form.responseCount * 10)}%</span>
                ) : (
                  <span className="text-muted-foreground/40">—</span>
                )}
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
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/forms/${form.id}/edit`} className="flex items-center gap-2">
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/forms/${form.id}/responses`} className="flex items-center gap-2">
                        <Eye className="h-3.5 w-3.5" /> Responses
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
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={() => onDelete?.(form.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
