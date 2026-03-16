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
    border: "hover:border-[rgba(108,99,255,0.3)]",
    topBar: "from-[#6C63FF] to-transparent",
    iconBg: "bg-[rgba(108,99,255,0.15)]",
    iconColor: "text-[#6C63FF]",
  },
  cyan: {
    border: "hover:border-[rgba(0,212,255,0.3)]",
    topBar: "from-[#00D4FF] to-transparent",
    iconBg: "bg-[rgba(0,212,255,0.1)]",
    iconColor: "text-[#00D4FF]",
  },
  green: {
    border: "hover:border-[rgba(0,255,163,0.3)]",
    topBar: "from-[#00FFA3] to-transparent",
    iconBg: "bg-[rgba(0,255,163,0.1)]",
    iconColor: "text-[#00FFA3]",
  },
  warn: {
    border: "hover:border-[rgba(255,181,71,0.3)]",
    topBar: "from-[#FFB547] to-transparent",
    iconBg: "bg-[rgba(255,181,71,0.1)]",
    iconColor: "text-[#FFB547]",
  },
};

export function StatsCard({ title, value, description, icon: Icon, trend, accent = "purple" }: StatsCardProps) {
  const cfg = accentConfig[accent];
  return (
    <div className={cn(
      "relative rounded-2xl border border-border bg-card px-6 py-5 overflow-hidden transition-all duration-200 group",
      cfg.border
    )}>
      {/* Accent top line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        cfg.topBar
      )} />

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground tracking-wide">{title}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cfg.iconBg)}>
          <Icon className={cn("h-4 w-4", cfg.iconColor)} />
        </div>
      </div>

      <div className="text-[2rem] font-bold tracking-tight leading-none mb-1.5">{value}</div>

      {(description || trend) && (
        <p className={cn(
          "text-xs",
          trend ? (trend.positive ? "text-[#00FFA3]" : "text-red-500") : "text-muted-foreground"
        )}>
          {trend?.label ?? description}
        </p>
      )}
    </div>
  );
}
