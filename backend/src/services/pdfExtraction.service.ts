import pdfParse from "pdf-parse";

export class TextExtractionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "TextExtractionError";
  }
}

export interface ExtractedFile {
  fileName: string;
  text: string;
  pageCount?: number;
}

/**
 * Extracts raw text from an uploaded resume file buffer.
 *
 * Supports:
 *  - application/pdf via pdf-parse
 *  - text/plain (and anything else we just decode as utf-8, e.g. .txt/.md)
 *
 * Deliberately does NOT attempt structured extraction here - this service's
 * only job is "bytes in, raw text out". Structured field extraction is a
 * separate concern (resumeExtraction.service.ts) so each service stays
 * small and independently testable.
 */
export async function extractText(
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedFile> {
  if (!buffer || buffer.length === 0) {
    throw new TextExtractionError(`File "${fileName}" is empty.`);
  }

  const isPdf = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    try {
      const result = await pdfParse(buffer);
      const text = (result.text ?? "").trim();
      if (text.length === 0) {
        throw new TextExtractionError(
          `File "${fileName}" is a PDF but no extractable text was found ` +
            `(it may be a scanned image without OCR text).`
        );
      }
      return { fileName, text, pageCount: result.numpages };
    } catch (err) {
      if (err instanceof TextExtractionError) throw err;
      throw new TextExtractionError(`Failed to parse PDF "${fileName}": corrupt or unsupported file.`, err);
    }
  }

  // Fall back to plain-text decoding for .txt/.md and unknown types.
  try {
    const text = buffer.toString("utf-8").trim();
    if (text.length === 0) {
      throw new TextExtractionError(`File "${fileName}" contains no readable text.`);
    }
    return { fileName, text };
  } catch (err) {
    if (err instanceof TextExtractionError) throw err;
    throw new TextExtractionError(`Failed to read "${fileName}" as text.`, err);
  }
}
