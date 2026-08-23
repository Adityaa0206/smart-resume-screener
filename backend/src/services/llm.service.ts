import OpenAI from "openai";
import { ZodError, z } from "zod";
import { config, isDemoMode } from "../config";
import { logger } from "../utils/logger";

export class LLMServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "LLMServiceError";
  }
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (isDemoMode()) {
    throw new LLMServiceError(
      "getClient() called while in demo mode - this should never happen."
    );
  }

  if (!client) {
    client = new OpenAI({
      apiKey: config.openaiApiKey!,
      timeout: 30_000,
      maxRetries: 0
    });
  }

  return client;
}

export interface CompleteJsonParams<T extends z.ZodTypeAny> {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  /** How many times to retry with the validation error fed back to the model. */
  maxValidationRetries?: number;
}

/**
 * Calls the OpenAI API asking for a single JSON object response, then
 * validates that response against the given zod schema before returning it.
 *
 * This is the ONLY place in the codebase that talks to OpenAI directly.
 * Every caller (resume extraction, JD extraction, semantic matching,
 * explanation generation) goes through here so that:
 *   - the API key never leaves the backend process
 *   - every LLM output is schema-validated before being trusted
 *   - malformed output / API failures / timeouts are handled in one place
 *
 * Throws LLMServiceError on: API failure, timeout, or output that still
 * fails schema validation after retries. Callers are expected to catch this
 * and fall back to demo/rule-based behavior (never let it crash the request).
 */
export async function completeJson<T extends z.ZodTypeAny>(
  params: CompleteJsonParams<T>
): Promise<z.output<T>> {
  const {
    systemPrompt,
    userPrompt,
    schema,
    maxValidationRetries = 1
  } = params;

  if (isDemoMode()) {
    throw new LLMServiceError(
      "completeJson() called while OPENAI_API_KEY is not set. Callers must check " +
        "isDemoMode() themselves and use their rule-based fallback instead of calling this."
    );
  }

  const openai = getClient();
  let lastError: unknown = null;
  let feedbackNote = "";

  for (let attempt = 0; attempt <= maxValidationRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: config.openaiModel,
        response_format: { type: "json_object" },
        temperature: 0,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: feedbackNote
              ? `${userPrompt}\n\n${feedbackNote}`
              : userPrompt
          }
        ]
      });

      const raw = response.choices[0]?.message?.content;

      if (!raw) {
        throw new LLMServiceError("OpenAI response contained no content.");
      }

      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(raw);
      } catch (err) {
        throw new LLMServiceError(
          "OpenAI response was not valid JSON.",
          err
        );
      }

      const validation = schema.safeParse(parsedJson);

      if (!validation.success) {
        lastError = validation.error;
        feedbackNote = buildValidationFeedback(validation.error);

        logger.warn(
          "LLM output failed schema validation, will retry if attempts remain",
          {
            attempt,
            issues: validation.error.issues.slice(0, 5)
          }
        );

        continue;
      }

      return validation.data;
    } catch (err) {
      lastError = err;

      // Distinguish rate limits / timeouts / generic API errors for logging,
      // but all are handled the same way: retry loop above, then throw.
      if (err instanceof OpenAI.APIError) {
        logger.warn("OpenAI API error", {
          status: err.status,
          message: err.message,
          attempt
        });
      } else {
        logger.warn("Unexpected error calling OpenAI", {
          attempt,
          error: String(err)
        });
      }
    }
  }

  throw new LLMServiceError(
    `LLM call failed after ${
      maxValidationRetries + 1
    } attempt(s): could not obtain schema-valid output.`,
    lastError
  );
}

function buildValidationFeedback(error: ZodError): string {
  const issues = error.issues
    .slice(0, 8)
    .map(
      (i) =>
        `- ${i.path.join(".") || "(root)"}: ${i.message}`
    )
    .join("\n");

  return (
    `Your previous JSON response did not match the required schema. Fix these issues ` +
    `and return ONLY corrected JSON, with no extra commentary:\n${issues}`
  );
}