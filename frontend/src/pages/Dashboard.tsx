import { useEffect, useState } from "react";
import { ArrowRight, FileSearch, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import type { BadgeTone } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

const API_BASE_URL = "http://localhost:4000";

const GETTING_STARTED_STEPS = [
  {
    number: "01",
    title: "Add a job description",
    description:
      "Paste or upload the role you're hiring for. Required and preferred requirements are kept separate."
  },
  {
    number: "02",
    title: "Upload candidate resumes",
    description:
      "PDF or text resumes for as many candidates as you want to compare against the role."
  },
  {
    number: "03",
    title: "Review ranked, explained results",
    description:
      "Every match is backed by evidence pulled from the resume - not just a score."
  }
];

const RELATIONSHIP_LEGEND: Array<{
  label: string;
  tone: BadgeTone;
  description: string;
}> = [
  {
    label: "Exact match",
    tone: "success",
    description: "The requirement is directly demonstrated."
  },
  {
    label: "Semantic match",
    tone: "accent",
    description: "Different wording, equivalent capability."
  },
  {
    label: "Related, not equivalent",
    tone: "warning",
    description: "Adjacent skill - doesn't satisfy the requirement."
  },
  {
    label: "No evidence",
    tone: "danger",
    description: "Nothing in the resume supports this requirement."
  }
];

interface DashboardStats {
  totalCandidates: number;
  shortlisted: number;
  review: number;
  rejected: number;
  averageScore: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

interface DashboardResponse {
  success: boolean;
  stats: DashboardStats;
}

interface Candidate {
  candidateId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  fileName: string | null;
  job: string;
  score: {
    overallScore: number;
    decision: string;
    confidence: string;
    scoreBreakdown?: {
      requiredSkills?: number;
      experience?: number;
      education?: number;
      preferredSkills?: number;
      evidence?: number;
    };
  } | null;
  strengths: string[];
  concerns: string[];
  createdAt: string;
}

interface CandidatesResponse {
  success: boolean;
  candidates: Candidate[];
}

function decisionTone(decision: string): BadgeTone {
  switch (decision) {
    case "SHORTLIST":
      return "success";
    case "REVIEW":
      return "warning";
    case "REJECT":
      return "danger";
    default:
      return "accent";
  }
}

function formatDecision(decision: string): string {
  switch (decision) {
    case "SHORTLIST":
      return "Shortlisted";
    case "REVIEW":
      return "Review";
    case "REJECT":
      return "Rejected";
    default:
      return decision;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [dashboardResponse, candidatesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard`),
        fetch(`${API_BASE_URL}/api/candidates`)
      ]);

      const dashboardData =
        (await dashboardResponse.json()) as DashboardResponse;

      const candidatesData =
        (await candidatesResponse.json()) as CandidatesResponse;

      if (!dashboardResponse.ok) {
        throw new Error(
          "Unable to load dashboard statistics."
        );
      }

      if (!candidatesResponse.ok) {
        throw new Error(
          "Unable to load recent candidates."
        );
      }

      setStats(dashboardData.stats);

      setRecentCandidates(
        Array.isArray(candidatesData.candidates)
          ? candidatesData.candidates.slice(0, 5)
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const totalCandidates = stats?.totalCandidates ?? 0;
  const shortlisted = stats?.shortlisted ?? 0;
  const review = stats?.review ?? 0;
  const rejected = stats?.rejected ?? 0;
  const averageScore = stats?.averageScore ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A snapshot of screening activity across your open roles."
      />

      {error && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">
                  Dashboard unavailable
                </p>
                <p className="mt-1 text-sm text-slate">
                  {error}
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={() => void loadDashboard()}
              >
                <RefreshCw size={15} />
                Retry
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Candidates screened"
          value={loading ? "—" : String(totalCandidates)}
          hint={
            totalCandidates === 0
              ? "No screenings run yet"
              : "Candidates processed"
          }
        />

        <StatCard
          label="Shortlisted"
          value={loading ? "—" : String(shortlisted)}
          hint={
            shortlisted === 0
              ? "No candidates shortlisted"
              : "Strong matches"
          }
          tone="success"
        />

        <StatCard
          label="Needs review"
          value={loading ? "—" : String(review)}
          hint={
            review === 0
              ? "No candidates awaiting review"
              : "Requires human review"
          }
          tone="warning"
        />

        <StatCard
          label="Average score"
          value={
            loading
              ? "—"
              : `${averageScore.toFixed(1)}/10`
          }
          hint={
            totalCandidates === 0
              ? "No scores yet"
              : `${rejected} rejected`
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Get started</CardTitle>
          </CardHeader>

          <CardBody>
            <ol className="flex flex-col gap-5">
              {GETTING_STARTED_STEPS.map((step) => (
                <li key={step.number} className="flex gap-4">
                  <span className="font-mono text-xs text-slate-soft">
                    {step.number}
                  </span>

                  <div>
                    <p className="text-sm font-medium text-ink">
                      {step.title}
                    </p>

                    <p className="mt-0.5 text-sm text-slate">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 border-t border-ink/5 pt-5">
              <Button onClick={() => navigate("/screen")}>
                Screen Candidates
                <ArrowRight size={15} />
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>How matching works</CardTitle>
          </CardHeader>

          <CardBody>
            <p className="text-sm text-slate">
              Every requirement is classified against the resume,
              never assumed:
            </p>

            <ul className="mt-4 flex flex-col gap-3">
              {RELATIONSHIP_LEGEND.map((item) => (
                <li
                  key={item.label}
                  className="flex flex-col gap-1"
                >
                  <Badge tone={item.tone}>
                    {item.label}
                  </Badge>

                  <p className="text-xs text-slate">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Recent screenings</CardTitle>

              {recentCandidates.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/candidates")}
                >
                  View all
                  <ArrowRight size={15} />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardBody>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-slate">
                  Loading recent screenings...
                </p>
              </div>
            ) : recentCandidates.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <FileSearch
                  size={28}
                  strokeWidth={1.5}
                  className="text-slate-soft"
                />

                <p className="text-sm font-medium text-ink">
                  No screenings yet
                </p>

                <p className="max-w-sm text-sm text-slate">
                  Upload a job description and resumes to
                  start your first screening run.
                </p>

                <Button
                  className="mt-2"
                  onClick={() => navigate("/screen")}
                >
                  Start screening
                  <ArrowRight size={15} />
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr className="border-b border-ink/10 text-left">
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-slate">
                        Candidate
                      </th>

                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-slate">
                        Role
                      </th>

                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-slate">
                        Score
                      </th>

                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-slate">
                        Decision
                      </th>

                      <th className="pb-3 text-xs font-medium uppercase tracking-wider text-slate">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentCandidates.map((candidate) => (
                      <tr
                        key={candidate.candidateId}
                        className="cursor-pointer border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]"
                        onClick={() =>
                          navigate(
                            `/candidates/${candidate.candidateId}`
                          )
                        }
                      >
                        <td className="py-4 pr-4">
                          <p className="text-sm font-medium text-ink">
                            {candidate.name ||
                              candidate.fileName ||
                              "Unnamed candidate"}
                          </p>

                          {candidate.email && (
                            <p className="mt-0.5 text-xs text-slate">
                              {candidate.email}
                            </p>
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          <p className="max-w-[180px] truncate text-sm text-ink">
                            {candidate.job || "Untitled role"}
                          </p>
                        </td>

                        <td className="py-4 pr-4">
                          <span className="font-mono text-sm font-semibold text-ink">
                            {candidate.score
                              ? `${candidate.score.overallScore.toFixed(
                                  1
                                )}/10`
                              : "—"}
                          </span>
                        </td>

                        <td className="py-4 pr-4">
                          {candidate.score ? (
                            <Badge
                              tone={decisionTone(
                                candidate.score.decision
                              )}
                            >
                              {formatDecision(
                                candidate.score.decision
                              )}
                            </Badge>
                          ) : (
                            <span className="text-sm text-slate">
                              —
                            </span>
                          )}
                        </td>

                        <td className="py-4 text-sm text-slate">
                          {formatDate(candidate.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}