"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Sparkles, Wrench, LayoutTemplate, Copy } from "lucide-react";

const options = [
  {
    mode: "ai" as const,
    icon: Sparkles,
    iconBg: "bg-[rgba(12,255,225,0.12)]",
    iconColor: "text-[#0CFFE1]",
    title: "AI Generation",
    desc: "Describe your form and let AI build it in seconds",
  },
  {
    mode: "manual" as const,
    icon: Wrench,
    iconBg: "bg-[rgba(123,108,255,0.15)]",
    iconColor: "text-[#7B6CFF]",
    title: "Manual Builder",
    desc: "Build step by step with full control",
  },
  {
    mode: "template" as const,
    icon: LayoutTemplate,
    iconBg: "bg-[rgba(45,222,152,0.1)]",
    iconColor: "text-[#2DDE98]",
    title: "From Template",
    desc: "Start from a curated template library",
  },
  {
    mode: "duplicate" as const,
    icon: Copy,
    iconBg: "bg-[rgba(255,176,32,0.12)]",
    iconColor: "text-[#FFB020]",
    title: "Duplicate Form",
    desc: "Clone an existing form and modify it",
  },
];

export function CreateFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = (mode: string) => {
    setOpen(false);
    router.push(`/forms/new?mode=${mode}`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0CFFE1] text-background text-sm font-semibold hover:brightness-110 hover:shadow-[0_4px_20px_rgba(12,255,225,0.3)] hover:-translate-y-px transition-all"
      >
        <Plus className="h-4 w-4" />
        Create Form
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Create a new form</DialogTitle>
            <p className="text-sm text-muted-foreground">Choose how you want to build your feedback form.</p>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.mode}
                  onClick={() => handleSelect(opt.mode)}
                  className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center hover:border-[#0CFFE1]/40 hover:bg-[rgba(12,255,225,0.04)] transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.iconBg}`}>
                    <Icon className={`h-5 w-5 ${opt.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{opt.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
