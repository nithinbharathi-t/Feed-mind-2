"use client";

import { useRouter } from "next/navigation";
import { Bot, Share2, BarChart2, Link2 } from "lucide-react";

const actions = [
  {
    icon: Bot,
    iconBg: "bg-[#C0392B]",
    iconShadow: "shadow-[0_4px_14px_rgba(192,57,43,0.45)]",
    label: "AI Form Builder",
    desc: "Describe & generate",
    href: "/forms/new?mode=ai",
  },
  {
    icon: Share2,
    iconBg: "bg-[#6C3FC5]",
    iconShadow: "shadow-[0_4px_14px_rgba(108,63,197,0.45)]",
    label: "Share a Form",
    desc: "Copy link or embed",
    href: "/forms",
  },
  {
    icon: BarChart2,
    iconBg: "bg-[#1E7E50]",
    iconShadow: "shadow-[0_4px_14px_rgba(30,126,80,0.45)]",
    label: "Export Responses",
    desc: "CSV, JSON, PDF",
    href: "/forms",
  },
  {
    icon: Link2,
    iconBg: "bg-[#7B1D2E]",
    iconShadow: "shadow-[0_4px_14px_rgba(123,29,46,0.45)]",
    label: "Connect Slack",
    desc: "Real-time alerts",
    href: "/",
  },
];

export function QuickActions() {
  const router = useRouter();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.label}
            onClick={() => router.push(a.href)}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-all hover:border-border/80 hover:bg-muted/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.iconBg} ${a.iconShadow}`}
            >
              <Icon className="h-[18px] w-[18px] text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{a.label}</p>
              <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
