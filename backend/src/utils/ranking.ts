export interface RankableCandidate {
  candidateId: string;
  overallScore: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface RankedCandidate<T extends RankableCandidate> {
  rank: number;
  candidate: T;
}

const CONFIDENCE_RANK: Record<RankableCandidate["confidence"], number> = { HIGH: 2, MEDIUM: 1, LOW: 0 };

/**
 * Deterministically ranks screened candidates: primarily by overallScore
 * descending, then by confidence descending as a tiebreaker, then by
 * candidateId ascending as a final stable tiebreaker (so ranking is fully
 * reproducible given the same inputs, with no reliance on array order).
 */
export function rankCandidates<T extends RankableCandidate>(candidates: T[]): RankedCandidate<T>[] {
  const sorted = [...candidates].sort((a, b) => {
    if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore;
    const confDiff = CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
    if (confDiff !== 0) return confDiff;
    return a.candidateId.localeCompare(b.candidateId);
  });

  return sorted.map((candidate, index) => ({ rank: index + 1, candidate }));
}
