import { completeJson, LLMServiceError } from "./llm.service";
import { isDemoMode } from "../config";
import { logger } from "../utils/logger";
import { EMPTY_PARSED_JD, ParsedJobDescription, ParsedJobDescriptionSchema } from "../schemas/job.schema";

const SYSTEM_PROMPT = `You are a job description parsing engine. You extract required vs
preferred requirements EXACTLY as distinguished in the text. Never move a
"nice to have" / preferred item into required, and never assume an
unstated requirement is required. Respond with a single JSON object
matching the required schema, and nothing else.`;

function buildUserPrompt(jdText: string): string {
  return `Extract structured requirements from this job description.

Required JSON shape:
{
  "title": string | null,
  "requiredSkills": [{ "name": string, "mandatory": true, "rawText": string | null }],
  "preferredSkills": [{ "name": string, "mandatory": false, "rawText": string | null }],
  "minExperienceYears": number | null,
  "preferredExperienceYears": number | null,
  "educationRequirements": string[],
  "responsibilities": string[],
  "otherRequirements": string[]
}

Rules:
- A skill only belongs in "requiredSkills" if the JD text clearly states it is required/must-have.
- A skill described as "nice to have", "bonus", "preferred", "a plus" belongs in "preferredSkills", never requiredSkills.
- "mandatory" must be true for every item in requiredSkills and false for every item in preferredSkills.
- Keep skill names short and canonical (e.g. "Kubernetes", not "experience with Kubernetes clusters").

JOB DESCRIPTION TEXT:
"""
${jdText}
"""`;
}

export async function extractJobDescription(
  jdText: string
): Promise<{ jd: ParsedJobDescription; usedFallback: boolean; fallbackReason?: string }> {
  if (isDemoMode()) {
    return { jd: ruleBasedExtractJD(jdText), usedFallback: true, fallbackReason: "demo mode (no OPENAI_API_KEY)" };
  }

  try {
    const jd = await completeJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(jdText),
      schema: ParsedJobDescriptionSchema
    });
    return { jd, usedFallback: false };
  } catch (err) {
    logger.error("JD extraction via LLM failed, falling back to rule-based extraction", {
      error: err instanceof LLMServiceError ? err.message : String(err)
    });
    return { jd: ruleBasedExtractJD(jdText), usedFallback: true, fallbackReason: "LLM extraction failed" };
  }
}

const PREFERRED_MARKERS = ["nice to have", "preferred", "bonus", "a plus", "good to have", "desirable"];
const REQUIRED_SECTION_MARKERS = ["required", "must have", "requirements", "qualifications"];

/**
 * Rule-based JD parser used in demo mode / on LLM failure.
 *
 * Strategy: split the JD into lines/bullets, classify each line as
 * "preferred" if it contains a preferred-marker phrase, otherwise treat
 * lines under a required-looking heading (or with no heading context) as
 * required. This is a coarse heuristic - real assignments should mostly hit
 * the LLM path - but it keeps the fallback deterministic and dependency-free.
 */
function ruleBasedExtractJD(jdText: string): ParsedJobDescription {
  const lines = jdText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const requiredSkills: ParsedJobDescription["requiredSkills"] = [];
  const preferredSkills: ParsedJobDescription["preferredSkills"] = [];
  let inPreferredSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (/preferred|nice to have|bonus/i.test(lower) && /:$/.test(line)) {
      inPreferredSection = true;
      continue;
    }
    if (REQUIRED_SECTION_MARKERS.some((m) => lower.includes(m)) && /:$/.test(line)) {
      inPreferredSection = false;
      continue;
    }

    const isBullet = /^[-*•]/.test(line) || /^\d+[.)]/.test(line);
    if (!isBullet) continue;

    const cleaned = line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "");
    const isPreferredLine = inPreferredSection || PREFERRED_MARKERS.some((m) => lower.includes(m));

    const entry = { name: cleaned, mandatory: !isPreferredLine, rawText: line };
    if (isPreferredLine) {
      preferredSkills.push({ ...entry, mandatory: false });
    } else {
      requiredSkills.push({ ...entry, mandatory: true });
    }
  }

  const expMatch = jdText.match(/(\d+)\+?\s*(?:years|yrs)/i);

  return {
    ...EMPTY_PARSED_JD,
    requiredSkills,
    preferredSkills,
    minExperienceYears: expMatch ? Number(expMatch[1]) : null
  };
}
