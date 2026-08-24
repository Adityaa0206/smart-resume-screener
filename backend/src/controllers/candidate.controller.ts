import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function getCandidates(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        resume: true,
        screeningResult: {
          include: {
            requirementMatches: true
          }
        },
        screeningRun: {
          include: {
            jobPosting: true
          }
        }
      }
    });

    const result = candidates.map((candidate) => ({
      candidateId: candidate.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      fileName: candidate.resume?.fileName ?? null,

      job: candidate.screeningRun.jobPosting.title,

      score: candidate.screeningResult
        ? {
            overallScore: candidate.screeningResult.overallScore,
            decision: candidate.screeningResult.decision,
            confidence: candidate.screeningResult.confidence,
            scoreBreakdown: parseJson(
              candidate.screeningResult.scoreBreakdown,
              {}
            )
          }
        : null,

      strengths: candidate.screeningResult
        ? parseJson<string[]>(candidate.screeningResult.strengths, [])
        : [],

      concerns: candidate.screeningResult
        ? parseJson<string[]>(candidate.screeningResult.concerns, [])
        : [],

      createdAt: candidate.createdAt
    }));

    res.status(200).json({
      success: true,
      candidates: result,
      meta: {
        candidateCount: result.length
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getCandidateById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const candidate = await prisma.candidate.findUnique({
      where: {
        id
      },
      include: {
        resume: true,
        screeningResult: {
          include: {
            requirementMatches: {
              orderBy: {
                createdAt: "asc"
              }
            }
          }
        },
        screeningRun: {
          include: {
            jobPosting: true
          }
        }
      }
    });

    if (!candidate) {
      res.status(404).json({
        error: {
          message: `Candidate not found: ${id}`,
          code: "CANDIDATE_NOT_FOUND"
        }
      });
      return;
    }

    const resume = candidate.resume
      ? parseJson(candidate.resume.extracted, null)
      : null;

    const screeningResult = candidate.screeningResult;

    res.status(200).json({
      success: true,

      candidate: {
        candidateId: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,

        resume: candidate.resume
          ? {
              id: candidate.resume.id,
              fileName: candidate.resume.fileName,
              rawText: candidate.resume.rawText,
              extracted: resume
            }
          : null,

        job: {
          id: candidate.screeningRun.jobPosting.id,
          title: candidate.screeningRun.jobPosting.title,
          rawText: candidate.screeningRun.jobPosting.rawText,
          extracted: parseJson(
            candidate.screeningRun.jobPosting.extracted,
            null
          )
        },

        screening: screeningResult
          ? {
              overallScore: screeningResult.overallScore,
              decision: screeningResult.decision,
              confidence: screeningResult.confidence,

              scoreBreakdown: parseJson(
                screeningResult.scoreBreakdown,
                {}
              ),

              strengths: parseJson<string[]>(
                screeningResult.strengths,
                []
              ),

              concerns: parseJson<string[]>(
                screeningResult.concerns,
                []
              ),

              justification: screeningResult.justification,

              requirementMatches: screeningResult.requirementMatches
            }
          : null,

        createdAt: candidate.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}