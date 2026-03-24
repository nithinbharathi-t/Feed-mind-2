import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { label: string; positive: boolean };
  accent?: "purple" | "cyan" | "green" | "warn";
}

const accentConfig = {
  purple: {
    border: "border-[rgba(108,99,255,0.18)] hover:border-[rgba(108,99,255,0.45)]",
    topBar: "from-[#6C63FF] to-transparent",
    topBarBase: "opacity-40",
    topBarHover: "group-hover:opacity-100",
    iconBg: "bg-[rgba(108,99,255,0.15)]",
    iconColor: "text-[#6C63FF]",
    iconHoverGlow: "group-hover:shadow-[0_0_12px_rgba(108,99,255,0.5)]",
    glow: "bg-[radial-gradient(ellipse_at_top_right,rgba(108,99,255,0.08),transparent_60%)]",
    shadow: "hover:shadow-[0_4px_24px_rgba(108,99,255,0.12)]",
  },
  cyan: {
    border: "border-[rgba(0,212,255,0.18)] hover:border-[rgba(0,212,255,0.45)]",
    topBar: "from-[#00D4FF] to-transparent",
    topBarBase: "opacity-40",
    topBarHover: "group-hover:opacity-100",
    iconBg: "bg-[rgba(0,212,255,0.12)]",
    iconColor: "text-[#00D4FF]",
    iconHoverGlow: "group-hover:shadow-[0_0_12px_rgba(0,212,255,0.45)]",
    glow: "bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.07),transparent_60%)]",
    shadow: "hover:shadow-[0_4px_24px_rgba(0,212,255,0.1)]",
  },
  green: {
    border: "border-[rgba(0,255,163,0.18)] hover:border-[rgba(0,255,163,0.45)]",
    topBar: "from-[#00FFA3] to-transparent",
    topBarBase: "opacity-40",
    topBarHover: "group-hover:opacity-100",
    iconBg: "bg-[rgba(0,255,163,0.12)]",
    iconColor: "text-[#00FFA3]",
    iconHoverGlow: "group-hover:shadow-[0_0_12px_rgba(0,255,163,0.45)]",
    glow: "bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,163,0.07),transparent_60%)]",
    shadow: "hover:shadow-[0_4px_24px_rgba(0,255,163,0.1)]",
  },
  warn: {
    border: "border-[rgba(255,181,71,0.18)] hover:border-[rgba(255,181,71,0.45)]",
    topBar: "from-[#FFB547] to-transparent",
    topBarBase: "opacity-40",
    topBarHover: "group-hover:opacity-100",
    iconBg: "bg-[rgba(255,181,71,0.12)]",
    iconColor: "text-[#FFB547]",
    iconHoverGlow: "group-hover:shadow-[0_0_12px_rgba(255,181,71,0.45)]",
    glow: "bg-[radial-gradient(ellipse_at_top_right,rgba(255,181,71,0.07),transparent_60%)]",
    shadow: "hover:shadow-[0_4px_24px_rgba(255,181,71,0.1)]",
  },
};

export function StatsCard({ title, value, description, icon: Icon, trend, accent = "purple" }: StatsCardProps) {
  const cfg = accentConfig[accent];
  return (
    <div className={cn(
      "relative rounded-2xl border bg-card px-6 py-5 overflow-hidden transition-all duration-200 group",
      cfg.border,
      cfg.shadow,
    )}>
      {/* Radial glow tint */}
      <div className={cn("absolute inset-0 pointer-events-none", cfg.glow)} />

      {/* Accent top bar — always visible at low opacity, full on hover */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r transition-opacity duration-200",
        cfg.topBar,
        cfg.topBarBase,
        cfg.topBarHover,
      )} />

      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">{title}</p>
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center transition-shadow duration-200",
          cfg.iconBg,
          cfg.iconHoverGlow,
        )}>
          <Icon className={cn("h-4 w-4", cfg.iconColor)} />
        </div>
      </div>

      <div className="text-[2.2rem] font-extrabold tracking-tight leading-none mb-2">{value}</div>

      {(description || trend) && (
        <p className={cn(
          "text-xs font-medium",
          trend ? (trend.positive ? "text-[#00FFA3]" : "text-[#FF6B6B]") : "text-muted-foreground"
        )}>
          {trend?.label ?? description}
        </p>
      )}
    </div>
  );
}
