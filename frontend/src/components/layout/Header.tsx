import { Menu } from "lucide-react";
import { Button } from "../ui/Button";

interface HeaderProps {
  onMenuClick: () => void;
}

/**
 * Global top bar. Distinct from PageHeader (ui/PageHeader.tsx): this one is
 * app-level chrome that's the same on every page (workspace context, mobile
 * nav trigger); PageHeader is per-page content (title, description).
 */
export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-paper px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-md p-2 text-slate hover:bg-accent-soft hover:text-ink md:hidden"
        >
          <Menu size={18} strokeWidth={1.75} />
        </button>

        <div className="leading-tight">
          <p className="font-mono text-[11px] uppercase tracking-widest text-slate">Workspace</p>
          <p className="font-display text-sm font-semibold text-ink">AI Recruitment Workspace</p>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        disabled
        title="Resume upload and screening are built in a later batch"
      >
        New Screening
      </Button>
    </header>
  );
}
