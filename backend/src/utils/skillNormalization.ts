/**
 * Skill normalization utilities.
 *
 * Two responsibilities:
 *  1. Canonicalize free-text skill names ("JS", "js", "Java Script" -> "JavaScript")
 *     so exact-match comparisons aren't defeated by casing/aliasing.
 *  2. Provide a small, explicit "related but not equivalent" knowledge base
 *     used by the deterministic DEMO-MODE matcher (see semanticMatching.service.ts)
 *     when no OpenAI key is configured. This is intentionally a hardcoded,
 *     auditable table - not a learned embedding space - because demo mode's
 *     entire point is to be deterministic and explainable without any API
 *     dependency. When a real OpenAI key is present, the LLM's semantic
 *     judgement is used instead (see llm.service.ts), and this table is not
 *     consulted for that path.
 */

const ALIASES: Record<string, string> = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  "node.js": "nodejs",
  node: "nodejs",
  nodejs: "nodejs",
  py: "python",
  python: "python",
  "reactjs": "react",
  "react.js": "react",
  react: "react",
  "next.js": "nextjs",
  nextjs: "nextjs",
  postgres: "postgresql",
  postgresql: "postgresql",
  mongo: "mongodb",
  mongodb: "mongodb",
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  docker: "docker",
  aws: "aws",
  gcp: "gcp",
  azure: "azure",
  ml: "machine learning",
  "machine learning": "machine learning",
  tensorflow: "tensorflow",
  pytorch: "pytorch",
  django: "django",
  flask: "flask",
  fastapi: "fastapi",
  express: "express",
  "express.js": "express",
  sql: "sql",
  "c#": "csharp",
  csharp: "csharp",
  "c++": "cpp",
  cpp: "cpp"
};

export function normalizeSkillName(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  return ALIASES[cleaned] ?? cleaned;
}

export function skillsEqual(a: string, b: string): boolean {
  return normalizeSkillName(a) === normalizeSkillName(b);
}

/**
 * Explicit "related but not equivalent" pairs. Each entry: a requirement
 * skill mapped to skills that, if present on a resume, should be scored as
 * RELATED_NOT_EQUIVALENT rather than a match. Symmetric lookups are handled
 * by isRelatedNotEquivalent() checking both directions.
 *
 * This directly encodes the examples given in the assignment brief:
 * Kubernetes/Docker, JS/React, Python/Django, AWS/specific-AWS-services,
 * Machine Learning/TensorFlow, React/Next.js.
 */
const RELATED_NOT_EQUIVALENT_PAIRS: Array<[string, string]> = [
  ["kubernetes", "docker"],
  ["javascript", "react"],
  ["javascript", "nextjs"],
  ["python", "django"],
  ["python", "flask"],
  ["python", "fastapi"],
  ["react", "nextjs"],
  ["machine learning", "tensorflow"],
  ["machine learning", "pytorch"],
  ["aws", "gcp"],
  ["aws", "azure"]
];

export function isRelatedNotEquivalent(requirementSkill: string, candidateSkill: string): boolean {
  const r = normalizeSkillName(requirementSkill);
  const c = normalizeSkillName(candidateSkill);
  return RELATED_NOT_EQUIVALENT_PAIRS.some(
    ([x, y]) => (x === r && y === c) || (x === c && y === r)
  );
}
