import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Small uppercase label above the title, e.g. "Overview" or "Candidate 3 of 12". */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Buttons or controls shown at the right (or below, on mobile). */
  actions?: ReactNode;
}

/**
 * Every page in the app starts with one of these, so titles/descriptions
 * always look and behave the same way instead of each page reinventing its
 * own heading markup.
 */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="font-mono text-xs uppercase tracking-widest text-slate">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
