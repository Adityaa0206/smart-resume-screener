import { describe, expect, it } from "vitest";
import { isRelatedNotEquivalent, normalizeSkillName, skillsEqual } from "../../src/utils/skillNormalization";

describe("normalizeSkillName", () => {
  it("lowercases and trims", () => {
    expect(normalizeSkillName("  Python  ")).toBe("python");
  });

  it("maps common aliases to a canonical form", () => {
    expect(normalizeSkillName("JS")).toBe("javascript");
    expect(normalizeSkillName("js")).toBe("javascript");
    expect(normalizeSkillName("Node")).toBe("nodejs");
    expect(normalizeSkillName("K8s")).toBe("kubernetes");
  });

  it("passes through unknown skills unchanged (lowercased)", () => {
    expect(normalizeSkillName("Terraform")).toBe("terraform");
  });
});

describe("skillsEqual", () => {
  it("treats aliases as equal", () => {
    expect(skillsEqual("JS", "JavaScript")).toBe(true);
    expect(skillsEqual("k8s", "Kubernetes")).toBe(true);
  });

  it("treats genuinely different skills as not equal", () => {
    expect(skillsEqual("Docker", "Kubernetes")).toBe(false);
  });
});

describe("isRelatedNotEquivalent", () => {
  it("flags Docker as related-but-not-equivalent to Kubernetes (both directions)", () => {
    expect(isRelatedNotEquivalent("Kubernetes", "Docker")).toBe(true);
    expect(isRelatedNotEquivalent("Docker", "Kubernetes")).toBe(true);
  });

  it("flags JavaScript as related-but-not-equivalent to React", () => {
    expect(isRelatedNotEquivalent("React", "JavaScript")).toBe(true);
  });

  it("does not flag unrelated skills", () => {
    expect(isRelatedNotEquivalent("Kubernetes", "Photoshop")).toBe(false);
  });

  it("does not flag an exact match as related-not-equivalent", () => {
    expect(isRelatedNotEquivalent("Docker", "Docker")).toBe(false);
  });
});
