import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/Dashboard";

/**
 * The route table. AppShell wraps every route, so the sidebar/header stay
 * mounted (and things like mobile-nav state persist) while only the
 * <main> content swaps between pages. Only "/" exists in this batch -
 * Screen Candidates / Candidates / Settings are added as real routes here
 * once their pages are built.
 */
export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </AppShell>
  );
}
