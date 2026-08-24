import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type DivProps = HTMLAttributes<HTMLDivElement>;

/** The card surface itself: a bordered, slightly-elevated container. */
export function Card({ className, children, ...props }: DivProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface", className)} {...props}>
      {children}
    </div>
  );
}

/** Optional header row for a Card - title + description + trailing actions. */
export function CardHeader({ className, children, ...props }: DivProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-border px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: DivProps) {
  return (
    <h3 className={cn("font-display text-sm font-semibold text-ink", className)} {...props}>
      {children}
    </h3>
  );
}

/** Padded content area for a Card. Use this instead of padding Card directly
 * when the card also has a CardHeader, so the padding stays consistent. */
export function CardBody({ className, children, ...props }: DivProps) {
  return (
    <div className={cn("px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}
