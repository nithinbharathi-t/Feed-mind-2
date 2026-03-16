interface FormHealthProps {
  published: number;
  draft: number;
  spam: number;
  total: number;
}

export function RecentActivity({ published, draft, spam, total }: FormHealthProps) {
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const rows = [
    { label: "Published", value: published, color: "bg-emerald-500", textColor: "text-emerald-500", pct: pct(published) },
    { label: "Draft", value: draft, color: "bg-muted-foreground/50", textColor: "text-muted-foreground", pct: pct(draft) },
    { label: "Spam filtered", value: spam, color: "bg-amber-500", textColor: "text-amber-500", pct: Math.min(100, spam * 20) },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex-1 flex flex-col">
      <h3 className="font-semibold text-[0.9rem] tracking-tight mb-3">Form Health</h3>
      <div className="divide-y divide-border flex-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <div className="flex items-center gap-3">
              <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${row.color}`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className={`text-sm font-semibold w-4 text-right ${row.textColor}`}>
                {row.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
