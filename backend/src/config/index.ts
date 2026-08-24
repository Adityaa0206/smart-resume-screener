import "dotenv/config";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const parsed = parseInt(raw, 10);

  return Number.isNaN(parsed) ? fallback : parsed;
}

export const config = {
  port: envInt("PORT", 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",

  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || null,
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",

  maxUploadFileSizeMb: envInt("MAX_UPLOAD_FILE_SIZE_MB", 8),
  maxResumesPerRequest: envInt("MAX_RESUMES_PER_REQUEST", 20)
};

/**
 * True when no Gemini API key is configured.
 * In this mode the app falls back to deterministic,
 * rule-based extraction and screening.
 */
export const isDemoMode = () => config.geminiApiKey === null;