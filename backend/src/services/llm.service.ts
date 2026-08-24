import { GoogleGenAI } from "@google/genai";
import { ZodError, z } from "zod";
import { config, isDemoMode } from "../config";
import { logger } from "../utils/logger";

export class LLMServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "LLMServiceError";
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (isDemoMode()) {
    throw new LLMServiceError(
      "getClient() called while in demo mode - this should never happen."
    );
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: config.geminiApiKey!
    });
  }

  return client;
}

export interface CompleteJsonParams<T extends z.ZodTypeAny> {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  maxValidationRetries?: number;
}

/**
 * Calls Gemini using Google's native SDK.
 * The response is parsed and validated against the supplied Zod schema.
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
      "completeJson() called while GEMINI_API_KEY is not set."
    );
  }

  const gemini = getClient();

  let lastError: unknown = null;
  let feedbackNote = "";

  for (
    let attempt = 0;
    attempt <= maxValidationRetries;
    attempt++
  ) {
    try {
      const response = await gemini.models.generateContent({
        model: config.geminiModel,
        contents: feedbackNote
          ? `${userPrompt}\n\n${feedbackNote}`
          : userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0,
          responseMimeType: "application/json"
        }
      });

      const raw = response.text;

      if (!raw) {
        throw new LLMServiceError(
          "Gemini response contained no content."
        );
      }

      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(raw);
      } catch (err) {
        throw new LLMServiceError(
          "Gemini response was not valid JSON.",
          err
        );
      }

      const validation = schema.safeParse(parsedJson);

      if (!validation.success) {
        lastError = validation.error;
        feedbackNote = buildValidationFeedback(validation.error);

        logger.warn(
          "Gemini output failed schema validation, will retry if attempts remain",
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

      logger.warn("Gemini API error", {
        attempt,
        error: String(err)
      });
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
    `Your previous JSON response did not match the required schema. ` +
    `Fix these issues and return ONLY corrected JSON, with no extra ` +
    `commentary:\n${issues}`
  );
}