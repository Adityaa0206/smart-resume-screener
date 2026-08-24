import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/Dashboard";
import { ScreenCandidatesPage } from "./pages/ScreenCandidates";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/screen" element={<ScreenCandidatesPage />} />
      </Routes>
    </AppShell>
  );
}