import { useEffect, useState } from "react";
import { ChevronRight, RefreshCw, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";

interface Candidate {
  candidateId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  fileName: string | null;
  job: string;
  score: {
    overallScore: number;
    decision: "SHORTLIST" | "REVIEW" | "REJECT";
    confidence: "HIGH" | "MEDIUM" | "LOW";
    scoreBreakdown: Record<string, number>;
  } | null;
  strengths: string[];
  concerns: string[];
  createdAt: string;
}

interface CandidatesResponse {
  success: boolean;
  candidates: Candidate[];
  meta: {
    candidateCount: number;
  };
}

function decisionClass(decision: Candidate["score"] extends null
  ? never
  : NonNullable<Candidate["score"]>["decision"]) {
  if (decision === "SHORTLIST") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (decision === "REVIEW") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-red-50 text-red-700";
}

function confidenceClass(
  confidence: NonNullable<Candidate["score"]>["confidence"]
) {
  if (confidence === "HIGH") {
    return "text-emerald-700";
  }

  if (confidence === "MEDIUM") {
    return "text-amber-700";
  }

  return "text-red-700";
}

export function CandidatesPage() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCandidates() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:4000/api/candidates");
      const data = (await response.json()) as CandidatesResponse & {
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(
          data.error?.message || "Unable to load candidates."
        );
      }

      setCandidates(data.candidates ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCandidates();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Candidate database"
        title="Candidates"
        description="Review candidates screened against your job requirements."
        actions={
          <Button
            variant="secondary"
            onClick={() => void loadCandidates()}
            disabled={isLoading}
          >
            <RefreshCw
              size={15}
              className={isLoading ? "animate-spin" : ""}
            />
            Refresh
          </Button>
        }
      />

      {error && (
        <Card>
          <div className="p-6">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <p className="mt-1 text-xs text-ink-muted">
              Make sure the backend is running on port 4000.
            </p>
          </div>
        </Card>
      )}

      {!error && isLoading && (
        <Card>
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-ink-muted">
            <RefreshCw size={16} className="animate-spin" />
            Loading candidates...
          </div>
        </Card>
      )}

      {!error && !isLoading && candidates.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5">
              <Users size={20} className="text-ink-muted" />
            </div>

            <h2 className="mt-4 font-display text-lg font-semibold text-ink">
              No candidates yet
            </h2>

            <p className="mt-1 max-w-md text-sm text-ink-muted">
              Screen your first batch of resumes and the candidates will
              appear here.
            </p>

            <Button
              className="mt-5"
              onClick={() => navigate("/screen")}
            >
              Screen candidates
            </Button>
          </div>
        </Card>
      )}

      {!error && !isLoading && candidates.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-ink/5 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-semibold text-ink">
                  All candidates
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {candidates.length} candidate
                  {candidates.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-ink/5 text-left text-xs uppercase tracking-wider text-ink-muted">
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-5 py-3 font-medium">Job</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Decision</th>
                  <th className="px-5 py-3 font-medium">Confidence</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>

              <tbody>
                {candidates.map((candidate) => {
                  const score = candidate.score;

                  return (
                    <tr
                      key={candidate.candidateId}
                      className="border-b border-ink/5 last:border-b-0 hover:bg-ink/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {candidate.name || "Unnamed candidate"}
                          </p>

                          <p className="mt-0.5 text-xs text-ink-muted">
                            {candidate.email ||
                              candidate.fileName ||
                              "No contact information"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-ink">
                          {candidate.job || "Untitled job"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-semibold text-ink">
                          {score ? `${score.overallScore}/10` : "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {score ? (
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                              decisionClass(score.decision)
                            ].join(" ")}
                          >
                            {score.decision}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {score ? (
                          <span
                            className={[
                              "text-xs font-medium",
                              confidenceClass(score.confidence)
                            ].join(" ")}
                          >
                            {score.confidence}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/candidates/${candidate.candidateId}`
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
                        >
                          View
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}