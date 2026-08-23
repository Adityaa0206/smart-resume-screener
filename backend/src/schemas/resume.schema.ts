import { z } from "zod";

/**
 * Structured resume data model.
 *
 * Design rule (see README "Anti-hallucination strategy"): any field for
 * which the source resume text provides no information MUST be null/empty,
 * never guessed or inferred. This schema exists specifically so that the
 * LLM's extraction output can be *validated* against a strict shape before
 * the app trusts it - see llm.service.ts.
 */

export const SkillSchema = z.object({
  name: z.string().min(1),
  category: z.enum([
    "language",
    "framework",
    "database",
    "cloud",
    "tool",
    "other"
  ])
});
export type Skill = z.infer<typeof SkillSchema>;

export const ExperienceEntrySchema = z.object({
  company: z.string().nullable(),
  role: z.string().nullable(),
  startDate: z.string().nullable(), // free-text date as written on resume (e.g. "Jan 2021")
  endDate: z.string().nullable(), // free-text, may be "Present"
  durationMonths: z.number().int().nonnegative().nullable(), // calculated where possible, else null
  technologies: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  // Verbatim/paraphrased snippets from the resume that support claims made
  // about this role. Used later by semantic matching as evidence source.
  evidenceSnippets: z.array(z.string()).default([])
});
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;

export const EducationEntrySchema = z.object({
  institution: z.string().nullable(),
  degree: z.string().nullable(),
  field: z.string().nullable(),
  graduationYear: z.number().int().nullable()
});
export type EducationEntry = z.infer<typeof EducationEntrySchema>;

export const ProjectEntrySchema = z.object({
  name: z.string().nullable(),
  description: z.string().nullable(),
  technologies: z.array(z.string()).default([])
});
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;

export const ParsedResumeSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  skills: z.array(SkillSchema).default([]),
  experience: z.array(ExperienceEntrySchema).default([]),
  education: z.array(EducationEntrySchema).default([]),
  projects: z.array(ProjectEntrySchema).default([]),
  certifications: z.array(z.string()).default([]),
  totalExperienceMonths: z.number().int().nonnegative().nullable()
});
export type ParsedResume = z.infer<typeof ParsedResumeSchema>;

/** Empty/default resume shape used when extraction fails entirely. */
export const EMPTY_PARSED_RESUME: ParsedResume = {
  name: null,
  email: null,
  phone: null,
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  totalExperienceMonths: null
};
