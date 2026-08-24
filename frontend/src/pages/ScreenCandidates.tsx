import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import { FileText, Upload, X, CheckCircle2, Play, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";

interface ResumeFile {
  id: string;
  file: File;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

  const jdReady = jobDescription.trim().length >= 30 || jdFile !== null;

  const canStart = jdReady && resumes.length > 0;

  const totalResumeSize = useMemo(
    () => resumes.reduce((total, item) => total + item.file.size, 0),
    [resumes]
  );

  function handleJdFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Job description must be a PDF file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Job description file must be smaller than 10 MB.");
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
        setError(`${file.name} is larger than 10 MB.`);
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

  function handleStart() {
    if (!jdReady) {
      setError("Add a job description before starting screening.");
      return;
    }

    if (resumes.length === 0) {
      setError("Add at least one resume before starting screening.");
      return;
    }

    setError("");
    setStarted(true);
  }

  if (started) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Screen Candidates"
          title="Screening ready"
          description="Your screening configuration has been validated. Backend integration will be connected next."
        />

        <Card className="p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                Screening queued in demo mode
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                {resumes.length} candidate{resumes.length === 1 ? "" : "s"} are
                ready to be processed. The real API connection will be added in
                the integration phase.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={() => setStarted(false)} variant="secondary">
              Edit screening
            </Button>

            <Button onClick={() => navigate("/")}>
              Back to dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Screen Candidates"
        title="Set up a screening run"
        description="Provide a job description, upload candidate resumes, and configure the criteria used for screening."
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          {/* Job description */}
          <Card className="p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  1
                </span>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Job description
                </h2>
              </div>

              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Paste the job description or upload a PDF. The backend will
                extract requirements during the integration phase.
              </p>
            </div>

            <textarea
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);
                setJdFile(null);
                setError("");
              }}
              placeholder="Paste the full job description here..."
              rows={10}
              className="w-full resize-y rounded-lg border border-ink/10 bg-paper px-4 py-3 text-sm leading-6 text-ink outline-none transition focus:border-ink/30 focus:ring-2 focus:ring-ink/5"
            />

            <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
              <span>
                {jobDescription.length.toLocaleString()} characters
              </span>

              <span>
                {jdReady ? "Job description ready" : "At least 30 characters"}
              </span>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-ink-muted">
              <div className="h-px flex-1 bg-ink/10" />
              OR
              <div className="h-px flex-1 bg-ink/10" />
            </div>

            {jdFile ? (
              <div className="flex items-center justify-between rounded-lg border border-ink/10 bg-ink/[0.02] p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={20} className="shrink-0 text-ink-muted" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {jdFile.name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {(jdFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeJdFile}
                  className="rounded-md p-2 text-ink-muted hover:bg-ink/5 hover:text-ink"
                  aria-label="Remove job description file"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ink/20 px-4 py-4 text-sm text-ink-muted transition hover:border-ink/40 hover:bg-ink/[0.02]">
                <Upload size={17} />
                Upload job description PDF
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={handleJdFile}
                />
              </label>
            )}
          </Card>

          {/* Resume upload */}
          <Card className="p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  2
                </span>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Candidate resumes
                </h2>
              </div>

              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Upload one or more candidate resumes. PDF files up to 10 MB are
                supported.
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={[
                "rounded-xl border-2 border-dashed p-8 text-center transition",
                isDragging
                  ? "border-ink bg-ink/[0.04]"
                  : "border-ink/15 hover:border-ink/30"
              ].join(" ")}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
                <Upload size={22} />
              </div>

              <p className="mt-4 text-sm font-medium text-ink">
                Drop resumes here
              </p>

              <p className="mt-1 text-xs text-ink-muted">
                or choose files from your computer
              </p>

              <label className="mt-4 inline-flex cursor-pointer">
                <span className="rounded-md border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition hover:bg-ink/5">
                  Choose resumes
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={handleResumeInput}
                />
              </label>
            </div>

            {resumes.length > 0 && (
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>
                    {resumes.length} resume{resumes.length === 1 ? "" : "s"} selected
                  </span>
                  <span>
                    {(totalResumeSize / 1024 / 1024).toFixed(2)} MB total
                  </span>
                </div>

                {resumes.map(({ id, file }) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-lg border border-ink/10 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText size={18} className="shrink-0 text-ink-muted" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {file.name}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeResume(id)}
                      className="rounded-md p-2 text-ink-muted hover:bg-ink/5 hover:text-ink"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setResumes([])}
                  className="pt-1 text-xs font-medium text-ink-muted hover:text-ink"
                >
                  Clear all resumes
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Configuration + review */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  3
                </span>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Screening configuration
                </h2>
              </div>

              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Configure how the existing screening engine should treat
                requirements.
              </p>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-ink">
                  Minimum experience
                </span>
                <select
                  value={minExperience}
                  onChange={(event) => setMinExperience(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-ink/10 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
                >
                  <option value="">No minimum specified</option>
                  <option value="1">1+ years</option>
                  <option value="2">2+ years</option>
                  <option value="3">3+ years</option>
                  <option value="5">5+ years</option>
                  <option value="7">7+ years</option>
                  <option value="10">10+ years</option>
                </select>
              </label>

              <Toggle
                checked={mandatoryRequirements}
                onChange={setMandatoryRequirements}
                title="Enforce mandatory requirements"
                description="Mandatory requirements can override an otherwise strong match."
              />

              <Toggle
                checked={includePreferred}
                onChange={setIncludePreferred}
                title="Consider preferred skills"
                description="Preferred skills contribute to the candidate evaluation."
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  4
                </span>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Review
                </h2>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <SummaryRow
                label="Job description"
                value={jdReady ? "Ready" : "Missing"}
                ready={jdReady}
              />

              <SummaryRow
                label="Candidates"
                value={`${resumes.length} selected`}
                ready={resumes.length > 0}
              />

              <SummaryRow
                label="Minimum experience"
                value={minExperience ? `${minExperience}+ years` : "Not specified"}
              />

              <SummaryRow
                label="Mandatory requirements"
                value={mandatoryRequirements ? "Enabled" : "Disabled"}
              />

              <SummaryRow
                label="Preferred skills"
                value={includePreferred ? "Included" : "Excluded"}
              />
            </div>

            <Button
              className="mt-6 w-full justify-center"
              disabled={!canStart}
              onClick={handleStart}
            >
              <Play size={16} />
              Start screening
            </Button>

            {!canStart && (
              <p className="mt-3 text-center text-xs text-ink-muted">
                Add a job description and at least one resume to continue.
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