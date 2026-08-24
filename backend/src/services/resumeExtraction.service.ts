import { completeJson, LLMServiceError } from "./llm.service";
import { isDemoMode } from "../config";
import { logger } from "../utils/logger";
import {
  EMPTY_PARSED_RESUME,
  ParsedResume,
  ParsedResumeSchema
} from "../schemas/resume.schema";
import { normalizeSkillName } from "../utils/skillNormalization";

const SYSTEM_PROMPT = `You are a resume parsing engine. You extract ONLY information that is
explicitly present in the resume text. You NEVER invent, infer, or assume
information that is not stated. If a field is not present, use null (or an
empty array for list fields). Respond with a single JSON object matching the
required schema, and nothing else - no markdown, no commentary.`;

function buildUserPrompt(resumeText: string): string {
  return `Extract structured data from this resume text.

Required JSON shape:

{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "skills": [
    {
      "name": string,
      "category": "language"|"framework"|"database"|"cloud"|"tool"|"other"
    }
  ],
  "experience": [{
    "company": string | null,
    "role": string | null,
    "startDate": string | null,
    "endDate": string | null,
    "durationMonths": number | null,
    "technologies": string[],
    "responsibilities": string[],
    "evidenceSnippets": string[]
  }],
  "education": [{
    "institution": string|null,
    "degree": string|null,
    "field": string|null,
    "graduationYear": number|null
  }],
  "projects": [{
    "name": string|null,
    "description": string|null,
    "technologies": string[]
  }],
  "certifications": string[],
  "totalExperienceMonths": number | null
}

Rules:
- Do not invent a skill that isn't mentioned anywhere in the text.
- Only include a skill in "skills" if the resume text actually names it.
- durationMonths should be calculated from stated dates only when unambiguous; otherwise null.
- Keep evidenceSnippets short (under ~20 words) and close to the original wording.

RESUME TEXT:

"""
${resumeText}
"""`;
}

/**
 * Extracts structured candidate data from raw resume text.
 *
 * Uses the LLM when an API key is configured; otherwise falls back to a
 * deterministic, rule-based extractor so the pipeline remains demoable
 * without an API key.
 */
export async function extractResume(
  resumeText: string
): Promise<{
  resume: ParsedResume;
  usedFallback: boolean;
  fallbackReason?: string;
}> {
  if (isDemoMode()) {
    return {
      resume: ruleBasedExtract(resumeText),
      usedFallback: true,
      fallbackReason: "demo mode (no OPENAI_API_KEY)"
    };
  }

  try {
    const resume = await completeJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(resumeText),
      schema: ParsedResumeSchema
    });

    return {
      resume,
      usedFallback: false
    };
  } catch (err) {
    logger.error(
      "Resume extraction via LLM failed, falling back to rule-based extraction",
      {
        error:
          err instanceof LLMServiceError ? err.message : String(err)
      }
    );

    return {
      resume: ruleBasedExtract(resumeText),
      usedFallback: true,
      fallbackReason: "LLM extraction failed"
    };
  }
}

const EMAIL_RE =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const PHONE_RE =
  /(\+?\d[\d\s().-]{8,}\d)/;

// Conservative demo-mode skill list.
// A skill is returned only when its literal name occurs in the resume.
const KNOWN_SKILL_KEYWORDS: Array<{
  name: string;
  category:
    | "language"
    | "framework"
    | "database"
    | "cloud"
    | "tool"
    | "other";
}> = [
  { name: "JavaScript", category: "language" },
  { name: "TypeScript", category: "language" },
  { name: "Python", category: "language" },
  { name: "Java", category: "language" },
  { name: "C++", category: "language" },
  { name: "C#", category: "language" },
  { name: "Go", category: "language" },

  { name: "React", category: "framework" },
  { name: "Next.js", category: "framework" },
  { name: "Node.js", category: "framework" },
  { name: "Express", category: "framework" },
  { name: "Django", category: "framework" },
  { name: "Flask", category: "framework" },
  { name: "FastAPI", category: "framework" },
  { name: "Spring", category: "framework" },

  { name: "PostgreSQL", category: "database" },
  { name: "MongoDB", category: "database" },
  { name: "MySQL", category: "database" },
  { name: "Redis", category: "database" },

  { name: "AWS", category: "cloud" },
  { name: "GCP", category: "cloud" },
  { name: "Azure", category: "cloud" },

  { name: "Docker", category: "tool" },
  { name: "Kubernetes", category: "tool" },
  { name: "Git", category: "tool" },

  { name: "Machine Learning", category: "other" },
  { name: "TensorFlow", category: "other" },
  { name: "PyTorch", category: "other" }
];

function ruleBasedExtract(resumeText: string): ParsedResume {
  const lowerText = resumeText.toLowerCase();

  const emailMatch = resumeText.match(EMAIL_RE);
  const phoneMatch = resumeText.match(PHONE_RE);

  const foundSkillNames = new Set<string>();

  const skills = KNOWN_SKILL_KEYWORDS.filter((skill) => {
    const key = normalizeSkillName(skill.name);

    if (foundSkillNames.has(key)) {
      return false;
    }

    const isPresent = containsLiteralSkill(lowerText, skill.name);

    if (isPresent) {
      foundSkillNames.add(key);
    }

    return isPresent;
  }).map((skill) => ({
    name: skill.name,
    category: skill.category
  }));

  return {
    ...EMPTY_PARSED_RESUME,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0].trim() : null,
    skills

    // Experience, education and projects intentionally remain empty
    // in rule-based fallback mode.
  };
}

/**
 * Checks whether a skill occurs literally in the text.
 *
 * We don't use \b here because skills such as:
 *   C++
 *   C#
 *   Node.js
 * contain punctuation where JavaScript word boundaries are unreliable.
 *
 * The surrounding characters must not be letters or numbers, preventing
 * false positives such as:
 *   "Java" matching "JavaScript"
 *   "Go" matching "Google"
 */
function containsLiteralSkill(text: string, skillName: string): boolean {
  const escapedSkill = escapeRegExp(skillName.toLowerCase());

  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapedSkill}(?=$|[^a-z0-9])`,
    "i"
  );

  return pattern.test(text);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}