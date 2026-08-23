import { z } from "zod";

/**
 * Structured job description model.
 *
 * Required vs preferred requirements are kept as SEPARATE lists throughout
 * the pipeline (never merged) so that scoring can weight them differently
 * and a missing preferred skill can never be treated the same as a missing
 * mandatory one (see scoring.service.ts).
 */

export const RequirementSchema = z.object({
  // Normalized short label, e.g. "Kubernetes", "REST API development".
  name: z.string().min(1),
  // Whether the requirement is a "hard" one, i.e. failing it should be able
  // to override an otherwise-high aggregate score (see scoring.service.ts).
  mandatory: z.boolean().default(false),
  rawText: z.string().nullable() // original sentence/phrase from the JD, if available
});
export type Requirement = z.infer<typeof RequirementSchema>;

export const ParsedJobDescriptionSchema = z.object({
  title: z.string().nullable(),
  requiredSkills: z.array(RequirementSchema).default([]),
  preferredSkills: z.array(RequirementSchema).default([]),
  minExperienceYears: z.number().nonnegative().nullable(),
  preferredExperienceYears: z.number().nonnegative().nullable(),
  educationRequirements: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  otherRequirements: z.array(z.string()).default([])
});
export type ParsedJobDescription = z.infer<typeof ParsedJobDescriptionSchema>;

export const EMPTY_PARSED_JD: ParsedJobDescription = {
  title: null,
  requiredSkills: [],
  preferredSkills: [],
  minExperienceYears: null,
  preferredExperienceYears: null,
  educationRequirements: [],
  responsibilities: [],
  otherRequirements: []
};
