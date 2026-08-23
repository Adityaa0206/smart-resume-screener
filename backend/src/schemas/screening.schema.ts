import { z } from "zod";
import { RequirementMatchSchema } from "./matching.schema";

export const Decision = z.enum(["SHORTLIST", "REVIEW", "REJECT"]);
export type Decision = z.infer<typeof Decision>;

export const ConfidenceLevel = z.enum(["HIGH", "MEDIUM", "LOW"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevel>;

export const ScoreBreakdownSchema = z.object({
  requiredSkills: z.number().min(0).max(100),
  experience: z.number().min(0).max(100),
  education: z.number().min(0).max(100),
  preferredSkills: z.number().min(0).max(100),
  evidence: z.number().min(0).max(100)
});
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const ScreeningResultSchema = z.object({
  candidateId: z.string(),
  overallScore: z.number().min(0).max(10),
  decision: Decision,
  confidence: ConfidenceLevel,
  scoreBreakdown: ScoreBreakdownSchema,
  matchedRequirements: z.array(RequirementMatchSchema),
  partialRequirements: z.array(RequirementMatchSchema),
  missingRequirements: z.array(RequirementMatchSchema),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  // A mandatory requirement (e.g. "Kubernetes required") that had no
  // acceptable match and therefore capped/overrode the decision, if any.
  overriddenByMandatoryGap: z.string().nullable(),
  justification: z.string()
});
export type ScreeningResult = z.infer<typeof ScreeningResultSchema>;
