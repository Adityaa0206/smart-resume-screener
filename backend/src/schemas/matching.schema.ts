import { z } from "zod";

/**
 * The four relationship categories a candidate's evidence can have to a
 * single job requirement. This is the semantic core of the whole project -
 * see README "Semantic matching" for the full definitions and worked
 * examples (Kubernetes/Docker, Python/FastAPI, etc.)
 */
export const MatchRelationship = z.enum([
  "EXACT_MATCH",
  "SEMANTIC_MATCH",
  "RELATED_NOT_EQUIVALENT",
  "NO_EVIDENCE"
]);
export type MatchRelationship = z.infer<typeof MatchRelationship>;

export const RequirementMatchSchema = z.object({
  requirement: z.string().min(1),
  category: z.enum(["required", "preferred"]),
  relationship: MatchRelationship,
  // Paraphrased/quoted evidence pulled from the resume. Must be null when
  // relationship === NO_EVIDENCE - enforced in semanticMatching.service.ts,
  // not just trusted from the LLM.
  evidence: z.string().nullable(),
  confidence: z.number().min(0).max(1)
});
export type RequirementMatch = z.infer<typeof RequirementMatchSchema>;

/**
 * Points awarded per relationship type, as a fraction of "full credit" for
 * that requirement. This table is the deterministic bridge between the
 * LLM's semantic judgement (a category label) and the numeric score - the
 * LLM never outputs a number that goes directly into the score.
 */
export const RELATIONSHIP_CREDIT: Record<MatchRelationship, number> = {
  EXACT_MATCH: 1.0,
  SEMANTIC_MATCH: 0.85,
  RELATED_NOT_EQUIVALENT: 0.35,
  NO_EVIDENCE: 0.0
};
