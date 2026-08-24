import { useState } from "react";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

/**
 * The application frame every page renders inside. This is where the
 * "is the mobile nav drawer open?" state lives - it's owned here (not in
 * Sidebar or Header) because both of those components need to affect it:
 * Header's hamburger button opens it, Sidebar's backdrop/link-click closes
 * it. In React this is called "lifting state up": when two sibling
 * components need to share state, that state moves to their closest common
 * parent, which then passes it down as props.
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
