interface FormCompletion {
  id: string;
  title: string;
  pct: number;
}

interface CompletionRatesProps {
  forms: FormCompletion[];
}

function pctColor(pct: number) {
  if (pct >= 80) return { text: "text-[#2DDE98]", bar: "#2DDE98" };
  if (pct >= 50) return { text: "text-[#0CFFE1]",  bar: "#0CFFE1"  };
  if (pct >= 20) return { text: "text-[#FFB020]",  bar: "#FFB020"  };
  return { text: "text-[#FF4D6A]", bar: "#FF4D6A" };
}

export function CompletionRates({ forms }: CompletionRatesProps) {
  const avg =
    forms.length > 0
      ? Math.round(forms.reduce((s, f) => s + f.pct, 0) / forms.length)
      : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-semibold text-[0.9rem] tracking-tight">Completion Rates</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Per published form</p>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {forms.slice(0, 5).map((form) => {
          const { text, bar } = pctColor(form.pct);
          return (
            <div key={form.id}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground truncate max-w-[160px]">{form.title}</span>
                <span className={`text-xs font-bold ${text}`}>{form.pct}%</span>
              </div>
              <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${form.pct}%`, background: bar }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs">
        <span className="text-muted-foreground">Avg completion</span>
        <span className="font-bold text-[#0CFFE1]">{avg}%</span>
      </div>
    </div>
  );
}
