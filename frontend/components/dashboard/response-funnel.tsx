interface FunnelStage {
  label: string;
  value: number;
  pct: number;
}

interface ResponseFunnelProps {
  totalResponses: number;
  spamCount: number;
}

export function ResponseFunnel({ totalResponses, spamCount }: ResponseFunnelProps) {
  const views = Math.max(totalResponses * 4, 10);
  const started = Math.round(views * 0.72);
  const halfway = Math.round(views * 0.52);
  const submitted = totalResponses;
  const valid = Math.max(0, submitted - spamCount);

  const stages: FunnelStage[] = [
    { label: "Form views",      value: views,     pct: 100 },
    { label: "Started",         value: started,   pct: Math.round((started / views) * 100) },
    { label: "Halfway",         value: halfway,   pct: Math.round((halfway / views) * 100) },
    { label: "Submitted",       value: submitted, pct: Math.round((submitted / views) * 100) },
    { label: "Valid (no spam)", value: valid,     pct: Math.round((valid / views) * 100) },
  ];

  const conversion = views > 0 ? Math.round((valid / views) * 100) : 0;

  const gradients = [
    "from-[#7B6CFF] to-[#0CFFE1]",
    "from-[#7B6CFF] to-[#4fd8c4]",
    "from-[#6a5ce0] to-[#3ab8a8]",
    "from-[#5a4dcc] to-[#2d9e8f]",
    "from-[#3d3399] to-[#1a7066]",
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-semibold text-[0.9rem] tracking-tight">Response Funnel</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Views → completions · avg all forms</p>
      </div>
      <div className="flex flex-col gap-2.5 flex-1">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-[90px] shrink-0 text-right">{stage.label}</span>
            <div className="flex-1 h-6 bg-muted/30 rounded-md overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${gradients[i]} rounded-md flex items-center justify-end pr-2 transition-all duration-700`}
                style={{ width: `${stage.pct}%` }}
              >
                <span className="text-[0.65rem] font-bold text-background">{stage.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Overall conversion:{" "}
          <span className="text-[#0CFFE1] font-bold ml-1">{conversion}%</span>
        </span>
      </div>
    </div>
  );
}
