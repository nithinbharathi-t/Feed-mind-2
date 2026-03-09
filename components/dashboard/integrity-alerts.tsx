import { AlertTriangle, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Alert {
  id: string;
  formId: string;
  formTitle: string;
  type: "spam" | "flagged" | "low_integrity";
  count: number;
}

interface IntegrityAlertsProps {
  alerts: Alert[];
  totalResponses: number;
  spamCount: number;
}

export function IntegrityAlerts({ alerts, totalResponses, spamCount }: IntegrityAlertsProps) {
  const suspicious = alerts.filter((a) => a.type === "flagged").length;
  const verified = Math.max(0, totalResponses - spamCount);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[0.9rem] tracking-tight flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-[#FF4D6A]" />
            Integrity Center
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Spam &amp; quality monitoring</p>
        </div>
        {alerts.length > 0 && (
          <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-[rgba(255,77,106,0.12)] text-[#FF4D6A] border border-[rgba(255,77,106,0.2)]">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="flex flex-col items-center p-2.5 rounded-xl bg-muted/20 border border-border">
          <span className="text-lg font-bold text-[#FF4D6A] leading-tight">{spamCount}</span>
          <span className="text-[0.6rem] text-muted-foreground mt-0.5">Spam blocked</span>
        </div>
        <div className="flex flex-col items-center p-2.5 rounded-xl bg-muted/20 border border-border">
          <span className="text-lg font-bold text-[#FFB020] leading-tight">{suspicious}</span>
          <span className="text-[0.6rem] text-muted-foreground mt-0.5">Suspicious</span>
        </div>
        <div className="flex flex-col items-center p-2.5 rounded-xl bg-muted/20 border border-border">
          <span className="text-lg font-bold text-[#2DDE98] leading-tight">{verified}</span>
          <span className="text-[0.6rem] text-muted-foreground mt-0.5">Verified</span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-2.5 rounded-xl border border-[rgba(255,77,106,0.12)] bg-[rgba(255,77,106,0.05)] px-3 py-2.5 hover:border-[rgba(255,77,106,0.25)] transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[rgba(255,77,106,0.12)] flex items-center justify-center shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 text-[#FF4D6A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{alert.formTitle}</p>
                <p className="text-[0.68rem] text-muted-foreground">
                  {alert.count} {alert.type === "spam" ? "spam" : "flagged"} · under review
                </p>
              </div>
              <Link
                href={`/forms/${alert.formId}/responses`}
                className="text-[0.68rem] font-semibold text-[#FF4D6A] hover:text-[#FF4D6A]/80 whitespace-nowrap shrink-0"
              >
                Review →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-[#2DDE98] px-3 py-2.5 rounded-lg bg-[rgba(45,222,152,0.08)] border border-[rgba(45,222,152,0.15)]">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          All forms are clean
        </div>
      )}
    </div>
  );
}
