import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mockCreate = vi.fn();

// Mock the OpenAI SDK entirely so these tests never touch the network and
// can deterministically simulate malformed output / API failures.
vi.mock("openai", () => {
  class MockAPIError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }

  class MockOpenAI {
    chat = { completions: { create: mockCreate } };
    static APIError = MockAPIError;
  }

  return { default: MockOpenAI };
});

vi.mock("../../src/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/config")>();
  return {
    ...actual,
    config: { ...actual.config, openaiApiKey: "test-key", openaiModel: "gpt-4o-mini" },
    isDemoMode: () => false
  };
});

import { completeJson, LLMServiceError } from "../../src/services/llm.service";

const TestSchema = z.object({ foo: z.string() });

function chatResponse(content: string) {
  return { choices: [{ message: { content } }] };
}

describe("completeJson", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns validated data on a well-formed first response", async () => {
    mockCreate.mockResolvedValueOnce(chatResponse(JSON.stringify({ foo: "bar" })));
    const result = await completeJson({ systemPrompt: "sys", userPrompt: "user", schema: TestSchema });
    expect(result).toEqual({ foo: "bar" });
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("throws LLMServiceError when the response is not valid JSON, after exhausting retries", async () => {
    mockCreate.mockResolvedValue(chatResponse("this is not json at all"));
    await expect(
      completeJson({ systemPrompt: "sys", userPrompt: "user", schema: TestSchema, maxValidationRetries: 1 })
    ).rejects.toThrow(LLMServiceError);
    expect(mockCreate).toHaveBeenCalledTimes(2); // initial attempt + 1 retry
  });

  it("retries once on schema validation failure and succeeds if the retry is valid", async () => {
    mockCreate
      .mockResolvedValueOnce(chatResponse(JSON.stringify({ wrongField: 123 })))
      .mockResolvedValueOnce(chatResponse(JSON.stringify({ foo: "corrected" })));

    const result = await completeJson({
      systemPrompt: "sys",
      userPrompt: "user",
      schema: TestSchema,
      maxValidationRetries: 1
    });

    expect(result).toEqual({ foo: "corrected" });
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("throws LLMServiceError if schema validation keeps failing past max retries", async () => {
    mockCreate.mockResolvedValue(chatResponse(JSON.stringify({ wrongField: 123 })));
    await expect(
      completeJson({ systemPrompt: "sys", userPrompt: "user", schema: TestSchema, maxValidationRetries: 1 })
    ).rejects.toThrow(LLMServiceError);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("throws LLMServiceError when the API call itself fails (simulated network/API error)", async () => {
    mockCreate.mockRejectedValue(new Error("connection reset"));
    await expect(
      completeJson({ systemPrompt: "sys", userPrompt: "user", schema: TestSchema, maxValidationRetries: 0 })
    ).rejects.toThrow(LLMServiceError);
  });

  it("throws LLMServiceError when the response has no content at all", async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: {} }] });
    await expect(
      completeJson({ systemPrompt: "sys", userPrompt: "user", schema: TestSchema, maxValidationRetries: 0 })
    ).rejects.toThrow(LLMServiceError);
  });
});
