import { Request, Response } from "express";
import { isDemoMode } from "../config";

export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    llmMode: isDemoMode() ? "demo (rule-based fallback, no OPENAI_API_KEY set)" : "live (OpenAI)"
  });
}
