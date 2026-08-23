import { z } from "zod";
import { completeJson, LLMServiceError } from "./llm.service";
import { isDemoMode } from "../config";
import { logger } from "../utils/logger";
import { ParsedResume } from "../schemas/resume.schema";
import { ParsedJobDescription, Requirement } from "../schemas/job.schema";
import { MatchRelationship, RequirementMatch, RequirementMatchSchema } from "../schemas/matching.schema";
import { isRelatedNotEquivalent, normalizeSkillName, skillsEqual } from "../utils/skillNormalization";

const MatchResponseSchema = z.object({
  matches: z.array(RequirementMatchSchema)
});

const SYSTEM_PROMPT = `You are a strict technical recruiter performing evidence-based requirement
matching. For EACH requirement given, decide the candidate's relationship to
it using EXACTLY one of these four categories:

- EXACT_MATCH: the candidate directly demonstrates the requirement (the
  exact skill/technology is named in their skills or experience).
- SEMANTIC_MATCH: the candidate demonstrates substantially equivalent
  experience/capability even though the wording differs (e.g. JD asks for
  "RESTful backend development in Python", resume shows "built FastAPI
  microservices in Python" - the underlying capability is the same).
- RELATED_NOT_EQUIVALENT: the candidate has related but distinct knowledge
  that should NOT be treated as satisfying the requirement (e.g. JD requires
  Kubernetes, resume only shows Docker; JD requires React, resume only shows
  JavaScript with no React evidence).
- NO_EVIDENCE: the resume provides no reliable evidence at all.

CRITICAL RULES:
- Never mark a requirement as satisfied (EXACT_MATCH or SEMANTIC_MATCH)
  just because a related or broader skill is present. Relatedness alone is
  RELATED_NOT_EQUIVALENT, not a match.
- Never invent or assume evidence that isn't in the resume text provided.
- If relationship is NO_EVIDENCE, evidence MUST be null.
- Otherwise, evidence must be a short (<25 word) quote or close paraphrase
  actually drawn from the resume.
- confidence is a 0-1 number reflecting how certain you are in this judgement.

Respond with a single JSON object: { "matches": [ { "requirement": string,
"category": "required"|"preferred", "relationship": "EXACT_MATCH"|
"SEMANTIC_MATCH"|"RELATED_NOT_EQUIVALENT"|"NO_EVIDENCE", "evidence": string|null,
"confidence": number } ] } - one entry per requirement given, in the same order.
No extra commentary.`;

function buildUserPrompt(resume: ParsedResume, requirements: Array<Requirement & { category: "required" | "preferred" }>): string {
  const resumeSummary = {
    skills: resume.skills,
    experience: resume.experience.map((e) => ({
      role: e.role,
      company: e.company,
      technologies: e.technologies,
      responsibilities: e.responsibilities,
      evidenceSnippets: e.evidenceSnippets
    })),
    projects: resume.projects,
    certifications: resume.certifications,
    education: resume.education
  };

  const requirementList = requirements.map((r) => ({ requirement: r.name, category: r.category }));

  return `RESUME (structured extraction):
${JSON.stringify(resumeSummary, null, 2)}

REQUIREMENTS TO EVALUATE (evaluate every single one, same order in your response):
${JSON.stringify(requirementList, null, 2)}`;
}

/**
 * Matches every job requirement (required + preferred) against a candidate's
 * structured resume, producing one RequirementMatch per requirement.
 *
 * LLM path: a single batched call classifies all requirements at once
 * (cheaper + keeps relative judgements consistent across the requirement
 * list). Demo/fallback path: deterministic skill-name comparison using the
 * alias + related-pairs tables in utils/skillNormalization.ts.
 *
 * Regardless of path, the NO_EVIDENCE <-> evidence===null invariant is
 * enforced here in code, not just trusted from the LLM output.
 */
export async function matchRequirements(
  resume: ParsedResume,
  jd: ParsedJobDescription
): Promise<RequirementMatch[]> {
  const requirements: Array<Requirement & { category: "required" | "preferred" }> = [
    ...jd.requiredSkills.map((r) => ({ ...r, category: "required" as const })),
    ...jd.preferredSkills.map((r) => ({ ...r, category: "preferred" as const }))
  ];

  if (requirements.length === 0) return [];

  if (!isDemoMode()) {
    try {
      const result = await completeJson({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: buildUserPrompt(resume, requirements),
        schema: MatchResponseSchema
      });
      return reconcileWithRequirementList(resume, result.matches, requirements).map(enforceEvidenceInvariant);
    } catch (err) {
      logger.error("Semantic matching via LLM failed, falling back to rule-based matching", {
        error: err instanceof LLMServiceError ? err.message : String(err)
      });
    }
  }

  return requirements.map((req) => ruleBasedMatch(resume, req));
}

/**
 * The LLM is asked to return one match per requirement in order, but LLMs
 * can drop/reorder/duplicate items. This guarantees the returned list has
 * exactly one entry per input requirement, falling back to a rule-based
 * match for any requirement the LLM didn't return a valid entry for.
 */
function reconcileWithRequirementList(
  resume: ParsedResume,
  llmMatches: RequirementMatch[],
  requirements: Array<Requirement & { category: "required" | "preferred" }>
): RequirementMatch[] {
  const byName = new Map(llmMatches.map((m) => [normalizeSkillName(m.requirement), m]));
  return requirements.map((req) => {
    const found = byName.get(normalizeSkillName(req.name));
    if (found) return { ...found, requirement: req.name, category: req.category };
    logger.warn("LLM omitted a requirement from its match response, using rule-based fallback for it", {
      requirement: req.name
    });
    return ruleBasedMatch(resume, req);
  });
}

function enforceEvidenceInvariant(match: RequirementMatch): RequirementMatch {
  if (match.relationship === "NO_EVIDENCE" && match.evidence !== null) {
    return { ...match, evidence: null };
  }
  return match;
}

function ruleBasedMatch(resume: ParsedResume, req: Requirement & { category: "required" | "preferred" }): RequirementMatch {
  const skillNames = resume.skills.map((s) => s.name);

  const exact = skillNames.find((s) => skillsEqual(s, req.name));
  if (exact) {
    return {
      requirement: req.name,
      category: req.category,
      relationship: "EXACT_MATCH",
      evidence: `Listed in candidate skills: "${exact}"`,
      confidence: 0.9
    };
  }

  const related = skillNames.find((s) => isRelatedNotEquivalent(req.name, s));
  if (related) {
    return {
      requirement: req.name,
      category: req.category,
      relationship: "RELATED_NOT_EQUIVALENT",
      evidence: `Candidate lists related skill "${related}", not "${req.name}" itself`,
      confidence: 0.6
    };
  }

  return {
    requirement: req.name,
    category: req.category,
    relationship: "NO_EVIDENCE",
    evidence: null,
    confidence: 0.5
  };
}

export const _internal = { ruleBasedMatch, enforceEvidenceInvariant };
export type { MatchRelationship };
