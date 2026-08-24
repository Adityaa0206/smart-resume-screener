import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ScanSearch, Settings, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Badge } from "../ui/Badge";

interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Omitted for pages that don't exist yet - see comingSoon below. */
  to?: string;
  /** Batch 1 only builds the Dashboard route. Other destinations are shown
   * for context (so the shell looks like the real app) but are disabled
   * rather than linking to pages that don't exist yet. */
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Screen Candidates", icon: ScanSearch, to: "/screen" },
  { label: "Candidates", icon: Users, comingSoon: true },
  { label: "Settings", icon: Settings, comingSoon: true }
];

interface SidebarProps {
  /** Whether the mobile drawer is open. Ignored above the md breakpoint,
   * where the sidebar is always visible as a static column. */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop: only rendered/interactive on mobile, and only while open. */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between bg-ink text-white",
          "transition-transform duration-200 ease-out",
          "md:static md:z-auto md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          <div className="flex items-center gap-2.5 px-5 py-6">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-white/15 font-mono text-xs font-semibold">
              SR
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold">Smart Resume</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">Screener</p>
            </div>
          </div>

          <nav className="mt-2 flex flex-col gap-1 px-3">
            {NAV_ITEMS.map((item) => (
              <SidebarLink key={item.label} item={item} onNavigate={onClose} />
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <Badge tone="warning">Demo mode</Badge>
          <p className="mt-2 text-xs leading-relaxed text-white/50">
            No OpenAI key configured. The backend falls back to deterministic,
            rule-based matching so the pipeline stays fully demoable.
          </p>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon;

  if (item.comingSoon || !item.to) {
    return (
      <div className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-white/35">
        <span className="flex items-center gap-3">
          <Icon size={16} strokeWidth={1.75} />
          {item.label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/25">Soon</span>
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
        )
      }
    >
      <Icon size={16} strokeWidth={1.75} />
      {item.label}
    </NavLink>
  );
}
