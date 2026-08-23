import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/config")>();
  return { ...actual, isDemoMode: () => true };
});

import { matchRequirements } from "../../src/services/semanticMatching.service";
import { EMPTY_PARSED_RESUME, ParsedResume } from "../../src/schemas/resume.schema";
import { EMPTY_PARSED_JD, ParsedJobDescription } from "../../src/schemas/job.schema";

function resumeWithSkills(skillNames: string[]): ParsedResume {
  return {
    ...EMPTY_PARSED_RESUME,
    skills: skillNames.map((name) => ({ name, category: "other" as const }))
  };
}

function jdRequiring(requiredNames: string[], preferredNames: string[] = []): ParsedJobDescription {
  return {
    ...EMPTY_PARSED_JD,
    requiredSkills: requiredNames.map((name) => ({ name, mandatory: true, rawText: null })),
    preferredSkills: preferredNames.map((name) => ({ name, mandatory: false, rawText: null }))
  };
}

describe("matchRequirements (demo mode / rule-based)", () => {
  it("returns EXACT_MATCH when the candidate lists the exact required skill", async () => {
    const resume = resumeWithSkills(["Python"]);
    const jd = jdRequiring(["Python"]);
    const matches = await matchRequirements(resume, jd);
    expect(matches[0].relationship).toBe("EXACT_MATCH");
    expect(matches[0].evidence).not.toBeNull();
  });

  it("the canonical Docker/Kubernetes case: Kubernetes required, only Docker present -> RELATED_NOT_EQUIVALENT, never a match", async () => {
    const resume = resumeWithSkills(["Docker"]);
    const jd = jdRequiring(["Kubernetes"]);
    const matches = await matchRequirements(resume, jd);
    expect(matches).toHaveLength(1);
    expect(matches[0].relationship).toBe("RELATED_NOT_EQUIVALENT");
    expect(matches[0].relationship).not.toBe("EXACT_MATCH");
    expect(matches[0].relationship).not.toBe("SEMANTIC_MATCH");
  });

  it("returns NO_EVIDENCE with null evidence when nothing relevant is present", async () => {
    const resume = resumeWithSkills(["Photoshop"]);
    const jd = jdRequiring(["Kubernetes"]);
    const matches = await matchRequirements(resume, jd);
    expect(matches[0].relationship).toBe("NO_EVIDENCE");
    expect(matches[0].evidence).toBeNull();
  });

  it("keeps required and preferred matches correctly categorized", async () => {
    const resume = resumeWithSkills(["Python", "Docker"]);
    const jd = jdRequiring(["Python"], ["Kubernetes"]);
    const matches = await matchRequirements(resume, jd);

    const required = matches.find((m) => m.requirement === "Python");
    const preferred = matches.find((m) => m.requirement === "Kubernetes");

    expect(required?.category).toBe("required");
    expect(preferred?.category).toBe("preferred");
  });

  it("never returns evidence for a NO_EVIDENCE relationship (invariant enforced in code)", async () => {
    const resume = resumeWithSkills([]);
    const jd = jdRequiring(["Rust"]);
    const matches = await matchRequirements(resume, jd);
    expect(matches[0].relationship).toBe("NO_EVIDENCE");
    expect(matches[0].evidence).toBeNull();
  });

  it("returns an empty array when the JD has no requirements at all", async () => {
    const resume = resumeWithSkills(["Python"]);
    const jd = jdRequiring([]);
    const matches = await matchRequirements(resume, jd);
    expect(matches).toEqual([]);
  });
});
