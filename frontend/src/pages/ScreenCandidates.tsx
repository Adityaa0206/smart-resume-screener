import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import {
  FileText,
  Upload,
  X,
  CheckCircle2,
  Play,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";

interface ResumeFile {
  id: string;
  file: File;
}

interface ScreeningCandidate {
  candidateId: string;
  fileName: string;
  overallScore: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  resume: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  score: {
    overallScore: number;
    decision: "SHORTLIST" | "REVIEW" | "REJECT";
    confidence: "HIGH" | "MEDIUM" | "LOW";
    matchedRequirements: unknown[];
    partialRequirements: unknown[];
    missingRequirements: unknown[];
  };
}

interface ScreeningResponse {
  success: boolean;
  screeningRunId: string;
  jobPostingId: string;
  jobDescription: unknown;
  candidates: Array<{
    rank: number;
    candidate: ScreeningCandidate;
  }>;
  meta: {
    candidateCount: number;
    usedJdFallback: boolean;
    processedAt: string;
  };
}

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export function ScreenCandidatesPage() {
  const navigate = useNavigate();

  const [jobDescription, setJobDescription] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<ResumeFile[]>([]);
  const [minExperience, setMinExperience] = useState("");
  const [includePreferred, setIncludePreferred] = useState(true);
  const [mandatoryRequirements, setMandatoryRequirements] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screeningResult, setScreeningResult] =
    useState<ScreeningResponse | null>(null);

  const jdReady = jobDescription.trim().length >= 30 || jdFile !== null;
  const canStart = jdReady && resumes.length > 0;

  const totalResumeSize = useMemo(
    () => resumes.reduce((total, item) => total + item.file.size, 0),
    [resumes]
  );

  function handleJdFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Job description must be a PDF file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Job description file must be smaller than 8 MB.");
      return;
    }

    setError("");
    setJdFile(file);
  }

  function addResumes(files: FileList | File[]) {
    setError("");

    const incoming = Array.from(files);
    const validFiles: ResumeFile[] = [];

    for (const file of incoming) {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        setError(`${file.name} is not a PDF file.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} is larger than 8 MB.`);
        continue;
      }

      const duplicate = resumes.some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified
      );

      const alreadyIncoming = validFiles.some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified
      );

      if (!duplicate && !alreadyIncoming) {
        validFiles.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          file
        });
      }
    }

    setResumes((current) => [...current, ...validFiles]);
  }

  function handleResumeInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      addResumes(event.target.files);
    }

    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files.length > 0) {
      addResumes(event.dataTransfer.files);
    }
  }

  function removeResume(id: string) {
    setResumes((current) => current.filter((item) => item.id !== id));
  }

  function removeJdFile() {
    setJdFile(null);
  }

  async function handleStart() {
    if (!jdReady) {
      setError("Add a job description before starting screening.");
      return;
    }

    if (resumes.length === 0) {
      setError("Add at least one resume before starting screening.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      /*
       * The backend currently expects the job description as text.
       *
       * If a JD PDF is uploaded without pasted text, we cannot send the
       * PDF through the current /api/screen contract, so require text.
       */
      if (!jobDescription.trim()) {
        throw new Error(
          "Please paste the job description text. PDF-only job description upload is not supported by the current backend endpoint."
        );
      }

      formData.append("jobDescription", jobDescription.trim());

      for (const resume of resumes) {
        formData.append("resumes", resume.file);
      }

      const response = await fetch("http://localhost:4000/api/screen", {
        method: "POST",
        body: formData
      });

      let data: ScreeningResponse | {
        error?: {
          message?: string;
        };
      };

      try {
        data = await response.json();
      } catch {
        throw new Error(
          `Backend returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error?.message
            ? data.error.message
            : "Screening request failed."
        );
      }

      setScreeningResult(data as ScreeningResponse);
      setStarted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the screening backend."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function startNewScreening() {
    setStarted(false);
    setScreeningResult(null);
    setError("");
  }

  if (started && screeningResult) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Screening Results"
          title="Screening complete"
          description={`${screeningResult.meta.candidateCount} candidate${
            screeningResult.meta.candidateCount === 1 ? "" : "s"
          } processed successfully.`}
        />

        {screeningResult.meta.usedJdFallback && (
          <Card className="border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Demo / fallback mode
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  The backend used deterministic fallback processing because
                  no Gemini API key is configured.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <SummaryRow
              label="Candidates"
              value={String(screeningResult.meta.candidateCount)}
              ready
            />

            <SummaryRow
              label="Processing"
              value={
                screeningResult.meta.usedJdFallback
                  ? "Demo mode"
                  : "AI powered"
              }
            />

            <SummaryRow
              label="Status"
              value="Complete"
              ready
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-ink/10 px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              Ranked candidates
            </h2>

            <p className="mt-1 text-sm text-ink-muted">
              Candidates are ranked using AI-assisted screening and matching.
            </p>
          </div>

          {screeningResult.candidates.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-medium text-ink">
                No candidates were returned.
              </p>

              <p className="mt-1 text-sm text-ink-muted">
                Try running another screening with different resumes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ink/10">
              {screeningResult.candidates.map((item) => {
                const candidate = item.candidate;
                const score = candidate.score;

                const decisionClass =
                  score.decision === "SHORTLIST"
                    ? "text-emerald-700"
                    : score.decision === "REVIEW"
                      ? "text-amber-700"
                      : "text-red-700";

                return (
                  <div
                    key={candidate.candidateId}
                    className="flex flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                        #{item.rank}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                          {candidate.resume?.name || candidate.fileName}
                        </p>

                        <p className="mt-1 truncate text-sm text-ink-muted">
                          {candidate.resume?.email || "No email extracted"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-7">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                          Score
                        </p>

                        <p className="text-xl font-semibold text-ink">
                          {candidate.overallScore.toFixed(1)}/10
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                          Decision
                        </p>

                        <p className={`font-semibold ${decisionClass}`}>
                          {score.decision}
                        </p>
                      </div>

                      <div className="hidden text-right sm:block">
                        <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                          Confidence
                        </p>

                        <p className="font-medium text-ink">
                          {candidate.confidence}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={startNewScreening}>
            New screening
          </Button>

          <Button onClick={() => navigate("/")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Screen Candidates"
        title="Run a new screening"
        description="Add a job description and resumes to rank candidates against the role requirements."
      />

      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-700"
            />

            <div>
              <p className="text-sm font-semibold text-red-900">
                Something went wrong
              </p>

              <p className="mt-1 text-sm leading-6 text-red-800">
                {error}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-ink-muted">
                  Step 01
                </p>

                <h2 className="mt-1 font-display text-xl font-semibold text-ink">
                  Job description
                </h2>

                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  Paste the role requirements below. The backend will extract
                  required and preferred skills automatically.
                </p>
              </div>

              {jdReady && (
                <CheckCircle2
                  size={20}
                  className="shrink-0 text-emerald-700"
                />
              )}
            </div>

            <textarea
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);

                if (error) {
                  setError("");
                }
              }}
              placeholder={`Example:

Software Engineer

Required:
- TypeScript
- React
- Node.js
- PostgreSQL

Preferred:
- Kubernetes
- AWS

3+ years experience`}
              rows={12}
              className="mt-5 w-full resize-y rounded-md border border-ink/10 bg-white px-4 py-3 text-sm leading-6 text-ink outline-none transition focus:border-ink/30 focus:ring-2 focus:ring-ink/5"
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
                <Upload size={15} />
                <span>Or upload JD PDF</span>

                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleJdFile}
                  className="hidden"
                />
              </label>

              {jdFile && (
                <div className="flex items-center gap-2 rounded-md bg-ink/5 px-3 py-2 text-xs text-ink">
                  <FileText size={14} />
                  <span className="max-w-[220px] truncate">
                    {jdFile.name}
                  </span>

                  <button
                    type="button"
                    onClick={removeJdFile}
                    className="text-ink-muted hover:text-ink"
                    aria-label="Remove job description PDF"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {jdFile && !jobDescription.trim() && (
              <p className="mt-3 text-xs leading-5 text-amber-700">
                The current backend screening endpoint requires the job
                description as text. Paste the JD text above before starting.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-ink-muted">
                  Step 02
                </p>

                <h2 className="mt-1 font-display text-xl font-semibold text-ink">
                  Candidate resumes
                </h2>

                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  Upload PDF resumes. You can screen up to 20 candidates in
                  one run.
                </p>
              </div>

              {resumes.length > 0 && (
                <CheckCircle2
                  size={20}
                  className="shrink-0 text-emerald-700"
                />
              )}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={[
                "mt-5 rounded-lg border-2 border-dashed px-6 py-10 text-center transition",
                isDragging
                  ? "border-ink bg-ink/5"
                  : "border-ink/10 bg-ink/[0.02] hover:border-ink/20"
              ].join(" ")}
            >
              <Upload
                size={28}
                className="mx-auto text-ink-muted"
                strokeWidth={1.5}
              />

              <p className="mt-3 text-sm font-medium text-ink">
                Drag and drop resumes here
              </p>

              <p className="mt-1 text-xs text-ink-muted">
                PDF only · maximum 8 MB per file
              </p>

              <label className="mt-4 inline-flex cursor-pointer">
                <span className="rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-ink/5">
                  Browse files
                </span>

                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handleResumeInput}
                  className="hidden"
                />
              </label>
            </div>

            {resumes.length > 0 && (
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>
                    {resumes.length} resume
                    {resumes.length === 1 ? "" : "s"} selected
                  </span>

                  <span>
                    {(totalResumeSize / (1024 * 1024)).toFixed(1)} MB total
                  </span>
                </div>

                {resumes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-ink/10 px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText
                        size={16}
                        className="shrink-0 text-ink-muted"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {item.file.name}
                        </p>

                        <p className="text-xs text-ink-muted">
                          {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeResume(item.id)}
                      className="shrink-0 rounded p-1 text-ink-muted transition hover:bg-ink/5 hover:text-ink"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-ink-muted">
                Step 03
              </p>

              <h2 className="mt-1 font-display text-xl font-semibold text-ink">
                Screening options
              </h2>
            </div>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-ink">
                  Minimum experience
                </span>

                <span className="mt-1 block text-xs text-ink-muted">
                  Optional override for the minimum years of experience.
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={minExperience}
                  onChange={(event) => setMinExperience(event.target.value)}
                  placeholder="e.g. 3"
                  className="mt-3 w-full rounded-md border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink/30 focus:ring-2 focus:ring-ink/5 sm:max-w-xs"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <Toggle
                  checked={includePreferred}
                  onChange={setIncludePreferred}
                  title="Include preferred skills"
                  description="Use preferred requirements as part of the candidate score."
                />

                <Toggle
                  checked={mandatoryRequirements}
                  onChange={setMandatoryRequirements}
                  title="Enforce mandatory requirements"
                  description="Unsatisfied required requirements can cap the final decision."
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-ink-muted">
              Screening summary
            </p>

            <h2 className="mt-1 font-display text-xl font-semibold text-ink">
              Ready to screen?
            </h2>

            <div className="mt-6 space-y-4">
              <SummaryRow
                label="Job description"
                value={jdReady ? "Ready" : "Missing"}
                ready={jdReady}
              />

              <SummaryRow
                label="Resumes"
                value={
                  resumes.length > 0
                    ? `${resumes.length} selected`
                    : "None selected"
                }
                ready={resumes.length > 0}
              />

              <SummaryRow
                label="Preferred skills"
                value={includePreferred ? "Included" : "Excluded"}
              />

              <SummaryRow
                label="Mandatory rules"
                value={
                  mandatoryRequirements ? "Enforced" : "Not enforced"
                }
              />

              {minExperience && (
                <SummaryRow
                  label="Experience override"
                  value={`${minExperience} years`}
                />
              )}
            </div>

            <Button
              className="mt-6 w-full justify-center"
              disabled={!canStart || isSubmitting}
              onClick={handleStart}
            >
              {isSubmitting ? (
                <>
                  Processing...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Start screening
                </>
              )}
            </Button>

            {!canStart && (
              <p className="mt-3 text-center text-xs leading-5 text-ink-muted">
                Add a job description and at least one resume to continue.
              </p>
            )}

            {isSubmitting && (
              <p className="mt-3 text-center text-xs leading-5 text-ink-muted">
                Extracting resumes, matching requirements, calculating scores,
                and ranking candidates...
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  description
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-ink/20 accent-ink"
      />

      <span>
        <span className="block text-sm font-medium text-ink">{title}</span>

        <span className="mt-1 block text-xs leading-5 text-ink-muted">
          {description}
        </span>
      </span>
    </label>
  );
}

function SummaryRow({
  label,
  value,
  ready
}: {
  label: string;
  value: string;
  ready?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/5 pb-3">
      <span className="text-ink-muted">{label}</span>

      <span
        className={[
          "font-medium",
          ready === true ? "text-emerald-700" : "text-ink"
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}