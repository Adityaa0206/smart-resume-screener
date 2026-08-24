import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-paper text-slate border-border",
  accent: "bg-accent-soft text-accent border-accent/20",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  danger: "bg-danger-soft text-danger border-danger/20"
};

/**
 * Small classification label, styled like a stamped/ledger tag (uppercase
 * mono text, hairline border) rather than a bright filled pill. This is
 * the app's recurring "evidence, not vibes" visual signature - it's used
 * for the SHORTLIST/REVIEW/REJECT decision later, and will be reused for
 * EXACT_MATCH/SEMANTIC_MATCH/RELATED_NOT_EQUIVALENT/NO_EVIDENCE tags once
 * candidate detail pages exist.
 */
export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5",
        "font-mono text-[11px] font-medium uppercase tracking-wider",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
