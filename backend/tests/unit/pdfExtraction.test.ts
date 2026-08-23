import { describe, expect, it } from "vitest";
import { extractText, TextExtractionError } from "../../src/services/pdfExtraction.service";

describe("extractText", () => {
  it("extracts text from a plain-text buffer", async () => {
    const buffer = Buffer.from("John Doe\nSoftware Engineer\nSkills: Python, Docker", "utf-8");
    const result = await extractText("resume.txt", buffer, "text/plain");
    expect(result.text).toContain("John Doe");
    expect(result.fileName).toBe("resume.txt");
  });

  it("throws TextExtractionError for an empty file", async () => {
    const buffer = Buffer.alloc(0);
    await expect(extractText("empty.txt", buffer, "text/plain")).rejects.toThrow(TextExtractionError);
  });

  it("throws TextExtractionError for a whitespace-only text file", async () => {
    const buffer = Buffer.from("   \n\n   ", "utf-8");
    await expect(extractText("blank.txt", buffer, "text/plain")).rejects.toThrow(TextExtractionError);
  });

  it("throws TextExtractionError for a corrupt/invalid PDF", async () => {
    // Not a real PDF - pdf-parse should fail to parse this and we should
    // surface it as a TextExtractionError, not an unhandled exception.
    const buffer = Buffer.from("this is not a real pdf file at all", "utf-8");
    await expect(extractText("corrupt.pdf", buffer, "application/pdf")).rejects.toThrow(TextExtractionError);
  });

  it("identifies PDF files by extension even with a generic mime type", async () => {
    const buffer = Buffer.from("not actually a pdf", "utf-8");
    await expect(extractText("resume.pdf", buffer, "application/octet-stream")).rejects.toThrow(
      TextExtractionError
    );
  });
});
