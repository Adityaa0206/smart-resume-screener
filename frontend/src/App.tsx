import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/Dashboard";
import { ScreenCandidatesPage } from "./pages/ScreenCandidates";
import { CandidatesPage } from "./pages/Candidates";
import { CandidateDetailPage } from "./pages/CandidateDetail";

export default function App() {
  return (
    <AppShell>
      <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/screen" element={<ScreenCandidatesPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
      </Routes>
    </AppShell>
  );
}