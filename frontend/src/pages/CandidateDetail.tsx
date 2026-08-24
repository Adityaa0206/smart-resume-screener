import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  FileText,
  Mail,
  Phone,
  BriefcaseBusiness,
  GraduationCap,
  Award
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";

type Decision = "SHORTLIST" | "REVIEW" | "REJECT";

type Confidence = "HIGH" | "MEDIUM" | "LOW";

type Relationship =
  | "EXACT_MATCH"
  | "SEMANTIC_MATCH"
  | "RELATED_NOT_EQUIVALENT"
  | "NO_EVIDENCE";

interface RequirementMatch {
  id: string;
  requirement: string;
  category: "required" | "preferred";
  relationship: Relationship;
  evidence: string | null;
  confidence: number;
}

interface CandidateDetail {
  candidateId: string;
  name: string | null;
  email: string | null;
  phone: string | null;

  resume: {
    id: string;
    fileName: string;
    rawText: string;
    extracted: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      skills?: Array<{
        name: string;
        category: string;
      }>;
      experience?: Array<{
        company: string | null;
        role: string | null;
        startDate: string | null;
        endDate: string | null;
        durationMonths: number | null;
        technologies: string[];
        responsibilities: string[];
        evidenceSnippets: string[];
      }>;
      education?: Array<{
        degree: string | null;
        field: string | null;
        institution: string | null;
      }>;
      projects?: Array<unknown>;
      certifications?: Array<unknown>;
      totalExperienceMonths?: number | null;
    } | null;
  } | null;

  job: {
    id: string;
    title: string | null;
    rawText: string;
    extracted: {
      requiredSkills?: Array<{
        name: string;
        mandatory?: boolean;
      }>;
      preferredSkills?: Array<{
        name: string;
        mandatory?: boolean;
      }>;
      minExperienceYears?: number | null;
      preferredExperienceYears?: number | null;
      educationRequirements?: string[];
      responsibilities?: string[];
    } | null;
  };

  screening: {
    overallScore: number;
    decision: Decision;
    confidence: Confidence;
    scoreBreakdown: {
      requiredSkills?: number;
      experience?: number;
      education?: number;
      preferredSkills?: number;
      evidence?: number;
    };
    strengths: string[];
    concerns: string[];
    justification: string;
    requirementMatches: RequirementMatch[];
  } | null;

  createdAt: string;
}

interface CandidateResponse {
  success: boolean;
  candidate: CandidateDetail;
}

function relationshipLabel(relationship: Relationship): string {
  switch (relationship) {
    case "EXACT_MATCH":
      return "Exact match";
    case "SEMANTIC_MATCH":
      return "Semantic match";
    case "RELATED_NOT_EQUIVALENT":
      return "Related";
    case "NO_EVIDENCE":
      return "No evidence";
    default:
      return "Unknown";
  }
}

function relationshipClasses(relationship: Relationship): string {
  switch (relationship) {
    case "EXACT_MATCH":
      return "bg-emerald-50 text-emerald-700";

    case "SEMANTIC_MATCH":
      return "bg-blue-50 text-blue-700";

    case "RELATED_NOT_EQUIVALENT":
      return "bg-amber-50 text-amber-700";

    case "NO_EVIDENCE":
      return "bg-red-50 text-red-700";

    default:
      return "bg-ink/5 text-ink-muted";
  }
}

function RelationshipIcon({
  relationship
}: {
  relationship: Relationship;
}) {
  if (
    relationship === "EXACT_MATCH" ||
    relationship === "SEMANTIC_MATCH"
  ) {
    return <CheckCircle2 size={16} />;
  }

  if (relationship === "RELATED_NOT_EQUIVALENT") {
    return <MinusCircle size={16} />;
  }

  return <AlertCircle size={16} />;
}

function decisionClasses(decision: Decision): string {
  switch (decision) {
    case "SHORTLIST":
      return "bg-emerald-50 text-emerald-700";

    case "REVIEW":
      return "bg-amber-50 text-amber-700";

    case "REJECT":
      return "bg-red-50 text-red-700";

    default:
      return "bg-ink/5 text-ink-muted";
  }
}

function scoreBarWidth(value: number | undefined): string {
  const safeValue = Math.max(0, Math.min(100, value ?? 0));
  return `${safeValue}%`;
}

export function CandidateDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [candidate, setCandidate] =
    useState<CandidateDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Candidate ID is missing.");
      setIsLoading(false);
      return;
    }

    async function loadCandidate() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:4000/api/candidates/${id}`
        );

        const data = (await response.json()) as CandidateResponse & {
          error?: {
            message?: string;
          };
        };

        if (!response.ok) {
          throw new Error(
            data.error?.message || "Unable to load candidate."
          );
        }

        setCandidate(data.candidate);
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

    void loadCandidate();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <p className="text-sm text-ink-muted">
          Loading candidate...
        </p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="space-y-5">
        <Button
          variant="secondary"
          onClick={() => navigate("/candidates")}
        >
          <ArrowLeft size={15} />
          Back to candidates
        </Button>

        <Card>
          <div className="p-8">
            <p className="font-medium text-red-700">
              {error || "Candidate not found."}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const screening = candidate.screening;
  const resume = candidate.resume;
  const extractedResume = resume?.extracted;

  const displayName =
    candidate.name ||
    extractedResume?.name ||
    "Unnamed candidate";

  const jobTitle =
    candidate.job.title ||
    "Untitled Job";

  const matches = screening?.requirementMatches ?? [];

  const requiredMatches = matches.filter(
    (match) => match.category === "required"
  );

  const preferredMatches = matches.filter(
    (match) => match.category === "preferred"
  );

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="secondary"
          onClick={() => navigate("/candidates")}
        >
          <ArrowLeft size={15} />
          Back to candidates
        </Button>
      </div>

      <PageHeader
        eyebrow="Candidate profile"
        title={displayName}
        description={`${jobTitle} · ${
          resume?.fileName || "Resume unavailable"
        }`}
      />

      {/* Candidate overview */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="p-6">
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-muted">
              {candidate.email && (
                <div className="flex items-center gap-2">
                  <Mail size={15} />
                  {candidate.email}
                </div>
              )}

              {candidate.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={15} />
                  {candidate.phone}
                </div>
              )}

              {resume?.fileName && (
                <div className="flex items-center gap-2">
                  <FileText size={15} />
                  {resume.fileName}
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <InfoTile
                label="Experience"
                value={
                  extractedResume?.totalExperienceMonths != null
                    ? `${(
                        extractedResume.totalExperienceMonths / 12
                      ).toFixed(1)} yrs`
                    : "Not available"
                }
              />

              <InfoTile
                label="Job"
                value={jobTitle}
              />

              <InfoTile
                label="Screened"
                value={new Date(
                  candidate.createdAt
                ).toLocaleDateString()}
              />
            </div>
          </div>
        </Card>

        {screening && (
          <Card>
            <div className="p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                Overall score
              </p>

              <div className="mt-2 flex items-end gap-2">
                <span className="font-mono text-4xl font-semibold text-ink">
                  {screening.overallScore}
                </span>

                <span className="mb-1 text-sm text-ink-muted">
                  / 10
                </span>
              </div>

              <div className="mt-4">
                <span
                  className={[
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                    decisionClasses(screening.decision)
                  ].join(" ")}
                >
                  {screening.decision}
                </span>

                <span className="ml-3 text-xs font-medium text-ink-muted">
                  {screening.confidence} confidence
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {screening && (
        <>
          {/* Score breakdown */}
          <section>
            <SectionHeading
              title="Score breakdown"
              description="How the AI-assisted screening score was calculated."
            />

            <Card>
              <div className="grid gap-5 p-6 md:grid-cols-2">
                <ScoreBar
                  label="Required skills"
                  value={screening.scoreBreakdown.requiredSkills}
                />

                <ScoreBar
                  label="Experience"
                  value={screening.scoreBreakdown.experience}
                />

                <ScoreBar
                  label="Education"
                  value={screening.scoreBreakdown.education}
                />

                <ScoreBar
                  label="Preferred skills"
                  value={screening.scoreBreakdown.preferredSkills}
                />

                <ScoreBar
                  label="Evidence confidence"
                  value={screening.scoreBreakdown.evidence}
                />
              </div>
            </Card>
          </section>

          {/* Strengths and concerns */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={17}
                    className="text-emerald-700"
                  />

                  <h2 className="font-display text-base font-semibold">
                    Strengths
                  </h2>
                </div>

                {screening.strengths.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {screening.strengths.map((strength, index) => (
                      <li
                        key={`${strength}-${index}`}
                        className="flex gap-3 text-sm leading-6 text-ink-muted"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-muted">
                    No strengths recorded.
                  </p>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <AlertCircle
                    size={17}
                    className="text-amber-700"
                  />

                  <h2 className="font-display text-base font-semibold">
                    Concerns
                  </h2>
                </div>

                {screening.concerns.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {screening.concerns.map((concern, index) => (
                      <li
                        key={`${concern}-${index}`}
                        className="flex gap-3 text-sm leading-6 text-ink-muted"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                        {concern}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-muted">
                    No concerns recorded.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Requirement matching */}
          <section>
            <SectionHeading
              title="Requirement analysis"
              description="Evidence-based relationship between the job requirements and the candidate."
            />

            <div className="space-y-4">
              {requiredMatches.length > 0 && (
                <RequirementGroup
                  title="Required requirements"
                  matches={requiredMatches}
                />
              )}

              {preferredMatches.length > 0 && (
                <RequirementGroup
                  title="Preferred requirements"
                  matches={preferredMatches}
                />
              )}

              {matches.length === 0 && (
                <Card>
                  <div className="p-6 text-sm text-ink-muted">
                    No requirement matches were recorded.
                  </div>
                </Card>
              )}
            </div>
          </section>

          {/* Justification */}
          <section>
            <SectionHeading
              title="Screening justification"
              description="The explanation generated for this screening result."
            />

            <Card>
              <div className="p-6">
                <p className="whitespace-pre-line text-sm leading-7 text-ink-muted">
                  {screening.justification ||
                    "No justification was recorded."}
                </p>
              </div>
            </Card>
          </section>
        </>
      )}

      {/* Resume information */}
      {resume && extractedResume && (
        <section>
          <SectionHeading
            title="Resume details"
            description="Structured information extracted from the uploaded resume."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness size={17} />
                  <h2 className="font-display text-base font-semibold">
                    Skills
                  </h2>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(extractedResume.skills ?? []).length > 0 ? (
                    extractedResume.skills?.map((skill) => (
                      <span
                        key={`${skill.name}-${skill.category}`}
                        className="rounded-md bg-ink/5 px-2.5 py-1.5 text-xs font-medium text-ink"
                      >
                        {skill.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-ink-muted">
                      No skills extracted.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <GraduationCap size={17} />
                  <h2 className="font-display text-base font-semibold">
                    Education
                  </h2>
                </div>

                <div className="mt-4 space-y-3">
                  {(extractedResume.education ?? []).length > 0 ? (
                    extractedResume.education?.map(
                      (education, index) => (
                        <div
                          key={`${education.institution}-${index}`}
                          className="rounded-md bg-ink/[0.03] p-3"
                        >
                          <p className="text-sm font-medium text-ink">
                            {education.degree || "Degree"}
                          </p>

                          {education.field && (
                            <p className="mt-1 text-xs text-ink-muted">
                              {education.field}
                            </p>
                          )}

                          {education.institution && (
                            <p className="mt-1 text-xs text-ink-muted">
                              {education.institution}
                            </p>
                          )}
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-ink-muted">
                      No education extracted.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <Card className="mt-4">
            <div className="p-6">
              <div className="flex items-center gap-2">
                <Award size={17} />
                <h2 className="font-display text-base font-semibold">
                  Experience
                </h2>
              </div>

              <div className="mt-5 space-y-5">
                {(extractedResume.experience ?? []).length > 0 ? (
                  extractedResume.experience?.map(
                    (experience, index) => (
                      <div
                        key={`${experience.company}-${experience.role}-${index}`}
                        className="border-l-2 border-ink/10 pl-4"
                      >
                        <p className="text-sm font-semibold text-ink">
                          {experience.role || "Role"}
                        </p>

                        <p className="mt-1 text-xs font-medium text-ink-muted">
                          {experience.company || "Company"}
                        </p>

                        {(experience.startDate ||
                          experience.endDate) && (
                          <p className="mt-1 text-xs text-ink-muted">
                            {experience.startDate || "Unknown"} —{" "}
                            {experience.endDate || "Present"}
                          </p>
                        )}

                        {experience.technologies.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {experience.technologies.map(
                              (technology) => (
                                <span
                                  key={technology}
                                  className="rounded bg-ink/5 px-2 py-1 text-[11px] text-ink-muted"
                                >
                                  {technology}
                                </span>
                              )
                            )}
                          </div>
                        )}

                        {experience.responsibilities.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {experience.responsibilities.map(
                              (
                                responsibility,
                                responsibilityIndex
                              ) => (
                                <li
                                  key={`${responsibility}-${responsibilityIndex}`}
                                  className="text-sm leading-6 text-ink-muted"
                                >
                                  • {responsibility}
                                </li>
                              )
                            )}
                          </ul>
                        )}
                      </div>
                    )
                  )
                ) : (
                  <p className="text-sm text-ink-muted">
                    No experience entries were extracted.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

function InfoTile({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-ink/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-wider text-ink-muted">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-ink">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="font-display text-base font-semibold text-ink">
        {title}
      </h2>

      <p className="mt-1 text-xs text-ink-muted">
        {description}
      </p>
    </div>
  );
}

function ScoreBar({
  label,
  value
}: {
  label: string;
  value: number | undefined;
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, value ?? 0)
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-ink">
          {label}
        </span>

        <span className="font-mono text-xs font-semibold text-ink">
          {safeValue.toFixed(1)}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/5">
        <div
          className="h-full rounded-full bg-ink transition-all"
          style={{
            width: scoreBarWidth(safeValue)
          }}
        />
      </div>
    </div>
  );
}

function RequirementGroup({
  title,
  matches
}: {
  title: string;
  matches: RequirementMatch[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink/5 px-5 py-4">
        <h3 className="font-display text-sm font-semibold text-ink">
          {title}
        </h3>

        <p className="mt-0.5 text-xs text-ink-muted">
          {matches.length} requirement
          {matches.length === 1 ? "" : "s"}
        </p>
      </div>

      <div>
        {matches.map((match) => (
          <div
            key={match.id}
            className="border-b border-ink/5 p-5 last:border-b-0"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-ink">
                  {match.requirement}
                </p>

                {match.evidence && (
                  <p className="mt-2 max-w-3xl text-xs leading-5 text-ink-muted">
                    <span className="font-medium text-ink">
                      Evidence:
                    </span>{" "}
                    {match.evidence}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    relationshipClasses(match.relationship)
                  ].join(" ")}
                >
                  <RelationshipIcon
                    relationship={match.relationship}
                  />

                  {relationshipLabel(match.relationship)}
                </span>

                <span className="font-mono text-[11px] text-ink-muted">
                  {Math.round(match.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}