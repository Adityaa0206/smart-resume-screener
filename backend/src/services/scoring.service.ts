import { ParsedResume } from "../schemas/resume.schema";
import { ParsedJobDescription } from "../schemas/job.schema";
import { RELATIONSHIP_CREDIT, RequirementMatch } from "../schemas/matching.schema";
import { ConfidenceLevel, Decision, ScoreBreakdown } from "../schemas/screening.schema";
import {
  DECISION_THRESHOLDS,
  MANDATORY_GAP_MAX_DECISION,
  SATISFYING_RELATIONSHIPS,
  SCORING_WEIGHTS
} from "../config/scoring.config";

export interface ScoringInput {
  resume: ParsedResume;
  jd: ParsedJobDescription;
  matches: RequirementMatch[];
}

/**
 * Everything the scoring engine produces EXCEPT candidateId and the
 * LLM-generated justification text - those are assembled by the
 * orchestration layer (Phase 2), which owns persistence and ties this
 * output together with an explanation. Keeping justification out of this
 * module is deliberate: the score itself must never depend on any
 * natural-language LLM output (see project rule "final score must be
 * deterministic and reproducible given the same structured inputs").
 */
export interface ScoringOutput {
  overallScore: number;
  decision: Decision;
  confidence: ConfidenceLevel;
  scoreBreakdown: ScoreBreakdown;
  matchedRequirements: RequirementMatch[];
  partialRequirements: RequirementMatch[];
  missingRequirements: RequirementMatch[];
  overriddenByMandatoryGap: string | null;
}

export function calculateScore(input: ScoringInput): ScoringOutput {
  const { resume, jd, matches } = input;

  const requiredMatches = matches.filter((m) => m.category === "required");
  const preferredMatches = matches.filter((m) => m.category === "preferred");

  const requiredSkillsScore = averageCreditScore(requiredMatches);
  const preferredSkillsScore = averageCreditScore(preferredMatches);
  const experienceScore = calculateExperienceScore(resume, jd);
  const educationScore = calculateEducationScore(resume, jd);
  const evidenceScore = averageConfidenceScore(matches);

  const scoreBreakdown: ScoreBreakdown = {
    requiredSkills: round1(requiredSkillsScore),
    experience: round1(experienceScore),
    education: round1(educationScore),
    preferredSkills: round1(preferredSkillsScore),
    evidence: round1(evidenceScore)
  };

  const weightedTotal =
    scoreBreakdown.requiredSkills * SCORING_WEIGHTS.requiredSkills +
    scoreBreakdown.experience * SCORING_WEIGHTS.experience +
    scoreBreakdown.education * SCORING_WEIGHTS.education +
    scoreBreakdown.preferredSkills * SCORING_WEIGHTS.preferredSkills +
    scoreBreakdown.evidence * SCORING_WEIGHTS.evidence;

  const overallScore = round1(weightedTotal / 10); // 0-100 -> 0-10

  let decision = decisionFromScore(overallScore);

  // Mandatory requirement override: an unsatisfied REQUIRED requirement
  // caps the decision regardless of how high the aggregate score is.
  const unsatisfiedMandatory = requiredMatches.find((m) => !SATISFYING_RELATIONSHIPS.has(m.relationship));
  let overriddenByMandatoryGap: string | null = null;
  if (unsatisfiedMandatory && decision !== "REJECT" && decisionRank(decision) > decisionRank(MANDATORY_GAP_MAX_DECISION)) {
    overriddenByMandatoryGap = unsatisfiedMandatory.requirement;
    decision = MANDATORY_GAP_MAX_DECISION;
  }

  const confidence = confidenceFromMatches(matches);

  return {
    overallScore,
    decision,
    confidence,
    scoreBreakdown,
    matchedRequirements: matches.filter((m) => SATISFYING_RELATIONSHIPS.has(m.relationship)),
    partialRequirements: matches.filter((m) => m.relationship === "RELATED_NOT_EQUIVALENT"),
    missingRequirements: matches.filter((m) => m.relationship === "NO_EVIDENCE"),
    overriddenByMandatoryGap
  };
}

function averageCreditScore(matches: RequirementMatch[]): number {
  if (matches.length === 0) return 100; // nothing required in this category -> full credit
  const total = matches.reduce((sum, m) => sum + RELATIONSHIP_CREDIT[m.relationship], 0);
  return (total / matches.length) * 100;
}

function averageConfidenceScore(matches: RequirementMatch[]): number {
  if (matches.length === 0) return 100;
  const total = matches.reduce((sum, m) => sum + m.confidence, 0);
  return (total / matches.length) * 100;
}

function calculateExperienceScore(resume: ParsedResume, jd: ParsedJobDescription): number {
  const minYears = jd.minExperienceYears;
  if (minYears === null || minYears === 0) return 100; // no requirement stated

  const candidateYears = (resume.totalExperienceMonths ?? 0) / 12;
  const preferredYears = jd.preferredExperienceYears ?? minYears;

  if (candidateYears >= preferredYears) return 100;
  if (candidateYears >= minYears) {
    // linear interpolation between "meets minimum" (70) and "meets preferred" (100)
    const span = Math.max(preferredYears - minYears, 0.01);
    const progress = (candidateYears - minYears) / span;
    return 70 + progress * 30;
  }
  // below minimum: proportional credit, capped so it can't reach the "meets minimum" band
  return Math.max(0, Math.min(69, (candidateYears / minYears) * 70));
}

function calculateEducationScore(resume: ParsedResume, jd: ParsedJobDescription): number {
  if (jd.educationRequirements.length === 0) return 100; // no requirement stated
  if (resume.education.length === 0) return 0; // requirement exists, candidate lists none

  const requirementText = jd.educationRequirements.join(" ").toLowerCase();
  const hasMatch = resume.education.some((edu) => {
    const fields = [edu.degree, edu.field].filter((v): v is string => !!v);
    return fields.some((f) => requirementText.includes(f.toLowerCase()) || f.toLowerCase().includes("bachelor") || f.toLowerCase().includes("master"));
  });

  return hasMatch ? 100 : 50; // has *some* relevant degree info, just not a confirmed match
}

function decisionFromScore(score: number): Decision {
  if (score >= DECISION_THRESHOLDS.shortlist) return "SHORTLIST";
  if (score >= DECISION_THRESHOLDS.review) return "REVIEW";
  return "REJECT";
}

function decisionRank(decision: Decision): number {
  return { REJECT: 0, REVIEW: 1, SHORTLIST: 2 }[decision];
}

function confidenceFromMatches(matches: RequirementMatch[]): ConfidenceLevel {
  if (matches.length === 0) return "MEDIUM";
  const avg = matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length;
  if (avg >= 0.8) return "HIGH";
  if (avg >= 0.5) return "MEDIUM";
  return "LOW";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
