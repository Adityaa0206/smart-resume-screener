import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/config")>();
  return { ...actual, isDemoMode: () => true };
});

import { extractJobDescription } from "../../src/services/jdExtraction.service";

describe("extractJobDescription (demo mode / rule-based fallback)", () => {
  it("keeps required and preferred requirements in separate lists", async () => {
    const jd = `
Requirements:
- 4+ years of backend development experience
- Strong Python skills
- Experience with REST APIs

Nice to have:
- Kubernetes experience
- Exposure to machine learning
`;
    const { jd: parsed } = await extractJobDescription(jd);

    const requiredNames = parsed.requiredSkills.map((r) => r.name.toLowerCase());
    const preferredNames = parsed.preferredSkills.map((r) => r.name.toLowerCase());

    expect(requiredNames.some((n) => n.includes("python"))).toBe(true);
    expect(preferredNames.some((n) => n.includes("kubernetes"))).toBe(true);
    // Kubernetes must not leak into the required list just because it's a bullet
    expect(requiredNames.some((n) => n.includes("kubernetes"))).toBe(false);
  });

  it("marks every requiredSkills entry mandatory=true and preferredSkills entry mandatory=false", async () => {
    const jd = `
Requirements:
- Docker

Preferred:
- Terraform
`;
    const { jd: parsed } = await extractJobDescription(jd);
    expect(parsed.requiredSkills.every((r) => r.mandatory === true)).toBe(true);
    expect(parsed.preferredSkills.every((r) => r.mandatory === false)).toBe(true);
  });

  it("extracts a minimum years-of-experience figure when stated", async () => {
    const jd = "We require 5+ years of experience building backend systems.";
    const { jd: parsed } = await extractJobDescription(jd);
    expect(parsed.minExperienceYears).toBe(5);
  });
});
