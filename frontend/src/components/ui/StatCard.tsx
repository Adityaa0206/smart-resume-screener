import { Card } from "./Card";
import { cn } from "../../lib/cn";

type StatTone = "neutral" | "accent" | "success" | "warning" | "danger";

interface StatCardProps {
  label: string;
  /** Pass as a string so callers control formatting exactly (e.g. "8.4", "12", "—"). */
  value: string;
  hint?: string;
  tone?: StatTone;
}

const TONE_TEXT: Record<StatTone, string> = {
  neutral: "text-ink",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger"
};

/**
 * A single metric tile. Numbers are rendered in the mono font, on purpose -
 * it's the same visual language as the evidence/score displays that will
 * appear on candidate detail pages later, so a recruiter learns to read
 * "mono number = a measured value" throughout the app.
 */
export function StatCard({ label, value, hint, tone = "neutral" }: StatCardProps) {
  return (
    <Card className="p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-slate">{label}</p>
      <p className={cn("mt-2 font-mono text-3xl font-medium", TONE_TEXT[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate">{hint}</p>}
    </Card>
  );
}
