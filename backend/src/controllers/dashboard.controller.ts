import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";

export async function getDashboard(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [
      totalCandidates,
      shortlisted,
      review,
      rejected,
      scoreAggregate,
      recentCandidates
    ] = await Promise.all([
      prisma.candidate.count(),

      prisma.screeningResult.count({
        where: {
          decision: "SHORTLIST"
        }
      }),

      prisma.screeningResult.count({
        where: {
          decision: "REVIEW"
        }
      }),

      prisma.screeningResult.count({
        where: {
          decision: "REJECT"
        }
      }),

      prisma.screeningResult.aggregate({
        _avg: {
          overallScore: true
        }
      }),

      prisma.candidate.findMany({
        orderBy: {
          createdAt: "desc"
        },
        take: 8,
        include: {
          resume: true,
          screeningResult: true,
          screeningRun: {
            include: {
              jobPosting: true
            }
          }
        }
      })
    ]);

    const recent = recentCandidates.map((candidate) => ({
      candidateId: candidate.id,
      name: candidate.name,
      email: candidate.email,
      fileName: candidate.resume?.fileName ?? null,
      jobTitle: candidate.screeningRun.jobPosting.title,
      score: candidate.screeningResult?.overallScore ?? null,
      decision: candidate.screeningResult?.decision ?? null,
      confidence: candidate.screeningResult?.confidence ?? null,
      createdAt: candidate.createdAt
    }));

    res.status(200).json({
      success: true,

      stats: {
        totalCandidates,
        shortlisted,
        review,
        rejected,
        averageScore: Number(
          (scoreAggregate._avg.overallScore ?? 0).toFixed(2)
        )
      },

      recentCandidates: recent
    });
  } catch (error) {
    next(error);
  }
}