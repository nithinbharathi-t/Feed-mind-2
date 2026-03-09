interface ActivityHeatmapProps {
  /** Map of "YYYY-MM-DD" → count */
  data: Record<string, number>;
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function intensityClass(count: number): string {
  if (count === 0) return "bg-muted/40";
  if (count === 1) return "bg-[rgba(12,255,225,0.15)]";
  if (count === 2) return "bg-[rgba(12,255,225,0.3)]";
  if (count === 3) return "bg-[rgba(12,255,225,0.5)]";
  if (count === 4) return "bg-[rgba(12,255,225,0.75)]";
  return "bg-[#0CFFE1]";
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Build a 5×7 grid for the current month (Feb 2026)
  // Feb 1 2026 is a Sunday (day index 6 in Mon-first grid)
  const cells: { date: string; count: number }[] = [];

  // Pad before Feb 1 (0 = Mon, 6 = Sun; Feb 1 is Sunday = index 6)
  const firstDayOfWeek = 6; // Sunday
  for (let i = 0; i < firstDayOfWeek; i++) cells.push({ date: "", count: 0 });

  for (let d = 1; d <= 28; d++) {
    const key = `2026-02-${String(d).padStart(2, "0")}`;
    cells.push({ date: key, count: data[key] ?? 0 });
  }

  // Pad to fill last row (28 + 6 = 34 cells, next multiple of 7 = 35)
  while (cells.length % 7 !== 0) cells.push({ date: "", count: 0 });

  const legend = [0, 1, 2, 3, 4, 5];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full flex flex-col">
      <div className="mb-3">
        <h3 className="font-semibold text-[0.9rem] tracking-tight">Activity Heatmap</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Responses by day · Feb 2026</p>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[0.6rem] text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {cells.map((cell, i) => (
          <div
            key={i}
            title={cell.date ? `${cell.date}: ${cell.count}` : undefined}
            className={`aspect-square rounded-sm transition-transform hover:scale-110 cursor-pointer ${
              cell.date ? intensityClass(cell.count) : "bg-transparent"
            }`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 justify-end mt-2">
        <span className="text-[0.6rem] text-muted-foreground">Less</span>
        {legend.map((l) => (
          <div key={l} className={`w-3 h-3 rounded-sm ${intensityClass(l)}`} />
        ))}
        <span className="text-[0.6rem] text-muted-foreground">More</span>
      </div>
    </div>
  );
}
