import { TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";

interface Insight {
  icon: "up" | "down" | "tip";
  title: string;
  desc: string;
  tag: string;
}

interface AiInsightsProps {
  publishedForms: number;
  draftForms: number;
  totalResponses: number;
  spamCount: number;
}

export function AiInsights({ publishedForms, draftForms, totalResponses, spamCount }: AiInsightsProps) {
  const insights: Insight[] = [
    {
      icon: "up",
      title: "Peak engagement detected",
      desc: `${totalResponses > 0 ? "Most responses arrive mid-week." : "No responses yet — publish a form to start collecting."} Schedule launches accordingly.`,
      tag: "Timing tip",
    },
    ...(spamCount > 0
      ? [{
          icon: "down" as const,
          title: `${spamCount} spam response${spamCount !== 1 ? "s" : ""} blocked`,
          desc: "AI integrity filters caught suspicious submissions. Review flagged responses.",
          tag: "Action needed",
        }]
      : []),
    ...(draftForms > 0
      ? [{
          icon: "tip" as const,
          title: `${draftForms} draft${draftForms !== 1 ? "s" : ""} awaiting publish`,
          desc: `Publishing ${draftForms > 1 ? "them" : "it"} could significantly increase your monthly response count.`,
          tag: "Opportunity",
        }]
      : []),
    {
      icon: "tip",
      title: "Try AI form generation",
      desc: "Describe your survey in plain English and let AI build it for you in seconds.",
      tag: "Feature tip",
    },
  ];

  const cfg = {
    up:   { bg: "bg-[rgba(45,222,152,0.1)]",  icon: TrendingUp,     color: "text-[#2DDE98]", tagBg: "bg-[rgba(45,222,152,0.1)]",   tagColor: "text-[#2DDE98]",  label: "Positive" },
    down: { bg: "bg-[rgba(255,77,106,0.1)]",  icon: AlertTriangle,  color: "text-[#FF4D6A]", tagBg: "bg-[rgba(255,77,106,0.1)]",   tagColor: "text-[#FF4D6A]",  label: "Alert"    },
    tip:  { bg: "bg-[rgba(12,255,225,0.1)]",  icon: Lightbulb,      color: "text-[#0CFFE1]", tagBg: "bg-[rgba(12,255,225,0.1)]",   tagColor: "text-[#0CFFE1]",  label: "Tip"      },
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden h-full flex flex-col">
      <div className="px-5 pt-5 pb-3">
        <h3 className="font-semibold text-[0.9rem] tracking-tight">✦ AI Insights</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Auto-generated · based on your data</p>
      </div>

      <div className="flex flex-col gap-2.5 px-5 pb-5 flex-1">
        {insights.slice(0, 3).map((insight, i) => {
          const c = cfg[insight.icon];
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="flex gap-3 items-start p-3 rounded-xl border border-border bg-muted/10 hover:border-border/80 transition-colors cursor-pointer"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${c.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${c.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold mb-0.5">{insight.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.desc}</p>
                <span className={`inline-block text-[0.6rem] font-bold px-1.5 py-0.5 rounded mt-1.5 ${c.tagBg} ${c.tagColor}`}>
                  {insight.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
