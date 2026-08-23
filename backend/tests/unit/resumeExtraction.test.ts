import { beforeEach, describe, expect, it, vi } from "vitest";

// Force demo mode for this test file regardless of the environment's .env.
vi.mock("../../src/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/config")>();
  return { ...actual, isDemoMode: () => true };
});

import { extractResume } from "../../src/services/resumeExtraction.service";

describe("extractResume (demo mode / rule-based fallback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts email and phone via regex", async () => {
    const text = "Jane Smith\nEmail: jane.smith@example.com | Phone: +1 415 555 0192\nSkills: Python, React";
    const { resume, usedFallback } = await extractResume(text);
    expect(usedFallback).toBe(true);
    expect(resume.email).toBe("jane.smith@example.com");
    expect(resume.phone).toContain("415");
  });

  it("only flags skills that literally appear in the text (no invention)", async () => {
    const text = "Experienced with Python and Docker. No cloud experience mentioned.";
    const { resume } = await extractResume(text);
    const names = resume.skills.map((s) => s.name);
    expect(names).toContain("Python");
    expect(names).toContain("Docker");
    expect(names).not.toContain("AWS");
    expect(names).not.toContain("Kubernetes");
  });

  it("handles an empty/near-empty resume without inventing data", async () => {
    const { resume } = await extractResume("   ");
    expect(resume.email).toBeNull();
    expect(resume.phone).toBeNull();
    expect(resume.skills).toEqual([]);
    expect(resume.experience).toEqual([]);
  });

  it("does not fabricate experience or education in fallback mode", async () => {
    const text = "Senior Engineer at Acme Corp, 2019-2023. B.S. Computer Science, MIT.";
    const { resume } = await extractResume(text);
    // Rule-based fallback intentionally does not attempt to parse free-form
    // experience/education - it should return empty rather than guess.
    expect(resume.experience).toEqual([]);
    expect(resume.education).toEqual([]);
  });
});
