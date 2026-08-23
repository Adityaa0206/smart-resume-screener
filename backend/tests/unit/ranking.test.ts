import { describe, expect, it } from "vitest";
import { rankCandidates } from "../../src/utils/ranking";

describe("rankCandidates", () => {
  it("ranks strictly by overallScore descending", () => {
    const result = rankCandidates([
      { candidateId: "a", overallScore: 6.2, confidence: "MEDIUM" },
      { candidateId: "b", overallScore: 9.1, confidence: "HIGH" },
      { candidateId: "c", overallScore: 7.5, confidence: "MEDIUM" }
    ]);

    expect(result.map((r) => r.candidate.candidateId)).toEqual(["b", "c", "a"]);
    expect(result.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("breaks ties in score using confidence", () => {
    const result = rankCandidates([
      { candidateId: "low-conf", overallScore: 8.0, confidence: "LOW" },
      { candidateId: "high-conf", overallScore: 8.0, confidence: "HIGH" }
    ]);

    expect(result[0].candidate.candidateId).toBe("high-conf");
    expect(result[1].candidate.candidateId).toBe("low-conf");
  });

  it("breaks score+confidence ties deterministically by candidateId", () => {
    const result = rankCandidates([
      { candidateId: "zeta", overallScore: 7.0, confidence: "MEDIUM" },
      { candidateId: "alpha", overallScore: 7.0, confidence: "MEDIUM" }
    ]);

    expect(result.map((r) => r.candidate.candidateId)).toEqual(["alpha", "zeta"]);
  });

  it("does not mutate the input array", () => {
    const input = [
      { candidateId: "a", overallScore: 1, confidence: "LOW" as const },
      { candidateId: "b", overallScore: 9, confidence: "HIGH" as const }
    ];
    const copy = [...input];
    rankCandidates(input);
    expect(input).toEqual(copy);
  });
});
