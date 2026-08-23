import { describe, expect, it } from "vitest";
import { calculateScore } from "../../src/services/scoring.service";
import { EMPTY_PARSED_RESUME, ParsedResume } from "../../src/schemas/resume.schema";
import { EMPTY_PARSED_JD, ParsedJobDescription } from "../../src/schemas/job.schema";
import { RequirementMatch } from "../../src/schemas/matching.schema";

function match(overrides: Partial<RequirementMatch>): RequirementMatch {
  return {
    requirement: "Python",
    category: "required",
    relationship: "EXACT_MATCH",
    evidence: "evidence",
    confidence: 0.9,
    ...overrides
  };
}

describe("calculateScore", () => {
  it("is deterministic: identical inputs always produce identical output", () => {
    const resume: ParsedResume = { ...EMPTY_PARSED_RESUME, totalExperienceMonths: 60 };
    const jd: ParsedJobDescription = { ...EMPTY_PARSED_JD, minExperienceYears: 3 };
    const matches = [match({})];

    const first = calculateScore({ resume, jd, matches });
    const second = calculateScore({ resume, jd, matches });

    expect(first).toEqual(second);
  });

  it("gives full marks for a category with no stated requirements", () => {
    const resume = EMPTY_PARSED_RESUME;
    const jd = EMPTY_PARSED_JD; // no experience/education requirements, no skills
    const result = calculateScore({ resume, jd, matches: [] });

    expect(result.scoreBreakdown.requiredSkills).toBe(100);
    expect(result.scoreBreakdown.preferredSkills).toBe(100);
    expect(result.scoreBreakdown.experience).toBe(100);
    expect(result.scoreBreakdown.education).toBe(100);
    expect(result.overallScore).toBe(10);
    expect(result.decision).toBe("SHORTLIST");
  });

  it("scores a candidate with all required skills exactly matched and high confidence highly", () => {
    const resume = EMPTY_PARSED_RESUME;
    const jd = EMPTY_PARSED_JD;
    const matches = [
      match({ requirement: "Python", relationship: "EXACT_MATCH", confidence: 0.95 }),
      match({ requirement: "REST APIs", relationship: "SEMANTIC_MATCH", confidence: 0.85 })
    ];
    const result = calculateScore({ resume, jd, matches });
    expect(result.overallScore).toBeGreaterThanOrEqual(8);
    expect(result.decision).toBe("SHORTLIST");
  });

  it("REJECTs a candidate with no evidence for any required skill", () => {
    const resume = EMPTY_PARSED_RESUME;
    const jd = EMPTY_PARSED_JD;
    const matches = [
      match({ requirement: "Python", relationship: "NO_EVIDENCE", evidence: null, confidence: 0.5 }),
      match({ requirement: "Kubernetes", relationship: "NO_EVIDENCE", evidence: null, confidence: 0.5 })
    ];
    const result = calculateScore({ resume, jd, matches });
    expect(result.decision).toBe("REJECT");
  });

  it("mandatory-gap override: a high aggregate score cannot reach SHORTLIST if a required skill is unsatisfied (Kubernetes/Docker case)", () => {
    const resume = EMPTY_PARSED_RESUME;
    const jd = EMPTY_PARSED_JD;
    // Everything else about this candidate is excellent...
    const matches = [
      match({ requirement: "Python", relationship: "EXACT_MATCH", confidence: 0.95 }),
      match({ requirement: "REST APIs", relationship: "EXACT_MATCH", confidence: 0.95 }),
      match({ requirement: "SQL", relationship: "EXACT_MATCH", confidence: 0.95 }),
      // ...except this required skill is only RELATED_NOT_EQUIVALENT (Docker, not Kubernetes)
      match({ requirement: "Kubernetes", relationship: "RELATED_NOT_EQUIVALENT", confidence: 0.6 })
    ];

    const result = calculateScore({ resume, jd, matches });

    expect(result.decision).not.toBe("SHORTLIST");
    expect(result.overriddenByMandatoryGap).toBe("Kubernetes");
  });

  it("does not apply the mandatory-gap override when all required skills are satisfied", () => {
    const resume = EMPTY_PARSED_RESUME;
    const jd = EMPTY_PARSED_JD;
    const matches = [
      match({ requirement: "Python", relationship: "EXACT_MATCH", confidence: 0.95 }),
      match({ requirement: "Docker", relationship: "SEMANTIC_MATCH", confidence: 0.8 })
    ];
    const result = calculateScore({ resume, jd, matches });
    expect(result.overriddenByMandatoryGap).toBeNull();
  });

  it("separates matched/partial/missing requirement lists correctly", () => {
    const resume = EMPTY_PARSED_RESUME;
    const jd = EMPTY_PARSED_JD;
    const matches = [
      match({ requirement: "Python", relationship: "EXACT_MATCH" }),
      match({ requirement: "Kubernetes", relationship: "RELATED_NOT_EQUIVALENT" }),
      match({ requirement: "Rust", relationship: "NO_EVIDENCE", evidence: null })
    ];
    const result = calculateScore({ resume, jd, matches });
    expect(result.matchedRequirements.map((m) => m.requirement)).toEqual(["Python"]);
    expect(result.partialRequirements.map((m) => m.requirement)).toEqual(["Kubernetes"]);
    expect(result.missingRequirements.map((m) => m.requirement)).toEqual(["Rust"]);
  });

  it("rewards experience that meets or exceeds the preferred years with full credit", () => {
    const resume: ParsedResume = { ...EMPTY_PARSED_RESUME, totalExperienceMonths: 84 }; // 7 years
    const jd: ParsedJobDescription = { ...EMPTY_PARSED_JD, minExperienceYears: 3, preferredExperienceYears: 5 };
    const result = calculateScore({ resume, jd, matches: [] });
    expect(result.scoreBreakdown.experience).toBe(100);
  });

  it("gives partial (not full, not zero) credit for experience between minimum and preferred", () => {
    const resume: ParsedResume = { ...EMPTY_PARSED_RESUME, totalExperienceMonths: 48 }; // 4 years
    const jd: ParsedJobDescription = { ...EMPTY_PARSED_JD, minExperienceYears: 3, preferredExperienceYears: 5 };
    const result = calculateScore({ resume, jd, matches: [] });
    expect(result.scoreBreakdown.experience).toBeGreaterThan(70);
    expect(result.scoreBreakdown.experience).toBeLessThan(100);
  });

  it("penalizes experience below the stated minimum", () => {
    const resume: ParsedResume = { ...EMPTY_PARSED_RESUME, totalExperienceMonths: 12 }; // 1 year
    const jd: ParsedJobDescription = { ...EMPTY_PARSED_JD, minExperienceYears: 5 };
    const result = calculateScore({ resume, jd, matches: [] });
    expect(result.scoreBreakdown.experience).toBeLessThan(70);
  });
});
