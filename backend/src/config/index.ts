import "dotenv/config";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const config = {
  port: envInt("PORT", 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",

  openaiApiKey: process.env.OPENAI_API_KEY?.trim() || null,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",

  maxUploadFileSizeMb: envInt("MAX_UPLOAD_FILE_SIZE_MB", 8),
  maxResumesPerRequest: envInt("MAX_RESUMES_PER_REQUEST", 20)
};

/**
 * True when no OpenAI API key is configured. In this mode the app falls
 * back to deterministic, rule-based extraction/explanation logic instead of
 * calling the OpenAI API, so the full pipeline can be demoed/tested for
 * free. All demo-mode output is explicitly labeled - see llm.service.ts.
 */
export const isDemoMode = () => config.openaiApiKey === null;
