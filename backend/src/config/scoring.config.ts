/**
 * Deterministic scoring configuration.
 *
 * Kept as a single, explicit, easily-reviewed object rather than scattered
 * magic numbers in scoring.service.ts, per the project's "no hidden
 * weights" rule. Changing scoring behavior means changing this file, and
 * tests in tests/unit/scoring.test.ts pin the current values.
 */
export const SCORING_WEIGHTS = {
  requiredSkills: 0.4,
  experience: 0.25,
  education: 0.15,
  preferredSkills: 0.1,
  evidence: 0.1
} as const;

// Sanity check at module load: weights must sum to 1 (100%).
const weightSum = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1) > 1e-9) {
  throw new Error(`SCORING_WEIGHTS must sum to 1, got ${weightSum}`);
}

export const DECISION_THRESHOLDS = {
  shortlist: 8.0, // overallScore >= this -> SHORTLIST (subject to mandatory-gap override)
  review: 6.0 // overallScore >= this (and < shortlist) -> REVIEW; below -> REJECT
} as const;

/**
 * If a mandatory required requirement is not satisfactorily matched
 * (relationship is RELATED_NOT_EQUIVALENT or NO_EVIDENCE), the candidate
 * cannot be marked SHORTLIST regardless of aggregate score - it is capped
 * at REVIEW at best. This directly implements the "Kubernetes required,
 * candidate only has Docker" business rule from the assignment brief.
 */
export const MANDATORY_GAP_MAX_DECISION = "REVIEW" as const;

/** Relationships that count as "the requirement is satisfied" for the mandatory-gap check. */
export const SATISFYING_RELATIONSHIPS = new Set(["EXACT_MATCH", "SEMANTIC_MATCH"]);
