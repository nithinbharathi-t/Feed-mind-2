interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentRingProps {
  data: SentimentData;
  totalResponses: number;
}

export function SentimentRing({ data, totalResponses }: SentimentRingProps) {
  const r = 38;
  const circ = 2 * Math.PI * r; // ~238.76

  // Compute stroke-dasharray for each segment
  const posLen  = (data.positive  / 100) * circ;
  const neutLen = (data.neutral   / 100) * circ;
  const negLen  = (data.negative  / 100) * circ;

  // Offsets: start from top (−60 offset trick used in reference)
  const startOffset = 60;
  const neutOffset  = -(posLen  - startOffset);
  const negOffset   = -(posLen + neutLen - startOffset);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full flex flex-col">
      <div className="mb-3">
        <h3 className="font-semibold text-[0.9rem] tracking-tight">Response Sentiment</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          AI-analysed · {totalResponses} responses
        </p>
      </div>

      {/* Ring */}
      <div className="flex items-center justify-center my-2 relative">
        <svg viewBox="0 0 100 100" className="w-[120px] h-[120px]">
          {/* Track */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          {/* Positive */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="#2DDE98" strokeWidth="10"
            strokeDasharray={`${posLen} ${circ}`}
            strokeDashoffset={startOffset}
            strokeLinecap="round" />
          {/* Neutral */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="#7B6CFF" strokeWidth="10"
            strokeDasharray={`${neutLen} ${circ}`}
            strokeDashoffset={neutOffset}
            strokeLinecap="round" />
          {/* Negative */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="#FF4D6A" strokeWidth="10"
            strokeDasharray={`${negLen} ${circ}`}
            strokeDashoffset={negOffset}
            strokeLinecap="round" />
        </svg>
        <div className="absolute text-center pointer-events-none">
          <div className="text-xl font-bold text-[#2DDE98] leading-tight">{data.positive}%</div>
          <div className="text-[0.6rem] text-muted-foreground">Positive</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 mt-1">
        {[
          { label: "Positive", pct: data.positive,  color: "#2DDE98" },
          { label: "Neutral",  pct: data.neutral,   color: "#7B6CFF" },
          { label: "Negative", pct: data.negative,  color: "#FF4D6A" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: item.color }} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-14 h-[3px] rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
              </div>
              <span className="text-xs font-semibold w-8 text-right" style={{ color: item.color }}>
                {item.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
