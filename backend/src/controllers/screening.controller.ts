import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { extractText } from "../services/pdfExtraction.service";
import { extractResume } from "../services/resumeExtraction.service";
import { extractJobDescription } from "../services/jdExtraction.service";
import { matchRequirements } from "../services/semanticMatching.service";
import { calculateScore } from "../services/scoring.service";
import { rankCandidates } from "../utils/ranking";

export async function screenCandidates(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { jobDescription } = req.body as {
      jobDescription?: string;
    };

    if (!jobDescription?.trim()) {
      res.status(400).json({
        error: {
          message: "Job description is required.",
          code: "MISSING_JOB_DESCRIPTION"
        }
      });
      return;
    }

    const files = (req.files ?? []) as Express.Multer.File[];

    if (files.length === 0) {
      res.status(400).json({
        error: {
          message: "At least one resume is required.",
          code: "MISSING_RESUMES"
        }
      });
      return;
    }

    // Parse the job description once for the entire screening run.
    const jdResult = await extractJobDescription(jobDescription);

    // Persist the job posting first.
    const jobPosting = await prisma.jobPosting.create({
      data: {
        title: jdResult.jd.title ?? "Untitled Job",
        rawText: jobDescription,
        extracted: JSON.stringify(jdResult.jd)
      }
    });

    // Create a screening run to group all candidates together.
    const screeningRun = await prisma.screeningRun.create({
      data: {
        jobPostingId: jobPosting.id,
        status: "RUNNING"
      }
    });

    const candidates = [];

    try {
      for (const file of files) {
        const extracted = await extractText(
          file.originalname,
          file.buffer,
          file.mimetype
        );

        const resumeResult = await extractResume(extracted.text);

        const matches = await matchRequirements(
          resumeResult.resume,
          jdResult.jd
        );

        const score = calculateScore({
          resume: resumeResult.resume,
          jd: jdResult.jd,
          matches
        });

        // Persist candidate + resume + screening result + requirement matches.
        const candidate = await prisma.candidate.create({
          data: {
            screeningRunId: screeningRun.id,
            name: resumeResult.resume.name,
            email: resumeResult.resume.email,
            phone: resumeResult.resume.phone,

            resume: {
              create: {
                fileName: extracted.fileName,
                rawText: extracted.text,
                extracted: JSON.stringify(resumeResult.resume)
              }
            },

            screeningResult: {
              create: {
                overallScore: score.overallScore,
                decision: score.decision,
                confidence: score.confidence,
                scoreBreakdown: JSON.stringify(score.scoreBreakdown),
                strengths: JSON.stringify(
                  score.matchedRequirements.map(
                    (match) => `${match.requirement}: ${match.relationship}`
                  )
                ),
                concerns: JSON.stringify([
                  ...score.partialRequirements.map(
                    (match) => `Related but not equivalent: ${match.requirement}`
                  ),
                  ...score.missingRequirements.map(
                    (match) => `Missing evidence: ${match.requirement}`
                  )
                ]),
                justification: buildJustification(score),
                requirementMatches: {
                  create: matches.map((match) => ({
                    requirement: match.requirement,
                    category: match.category,
                    relationship: match.relationship,
                    evidence: match.evidence,
                    confidence: match.confidence
                  }))
                }
              }
            }
          }
        });

        candidates.push({
          candidateId: candidate.id,
          overallScore: score.overallScore,
          confidence: score.confidence,
          fileName: extracted.fileName,
          resume: resumeResult.resume,
          matches,
          score
        });
      }

      await prisma.screeningRun.update({
        where: { id: screeningRun.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date()
        }
      });
    } catch (error) {
      await prisma.screeningRun.update({
        where: { id: screeningRun.id },
        data: { status: "FAILED" }
      });

      throw error;
    }

    const ranked = rankCandidates(candidates);

    res.status(200).json({
      success: true,
      screeningRunId: screeningRun.id,
      jobPostingId: jobPosting.id,
      jobDescription: jdResult.jd,
      candidates: ranked,
      meta: {
        candidateCount: ranked.length,
        usedJdFallback: jdResult.usedFallback,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

function buildJustification(score: ReturnType<typeof calculateScore>): string {
  const matched = score.matchedRequirements.length;
  const partial = score.partialRequirements.length;
  const missing = score.missingRequirements.length;

  const parts = [
    `Score: ${score.overallScore}/10.`,
    `Decision: ${score.decision}.`,
    `${matched} requirement(s) matched.`,
    `${partial} requirement(s) partially related.`,
    `${missing} requirement(s) have no evidence.`
  ];

  if (score.overriddenByMandatoryGap) {
    parts.push(
      `Decision was capped because the mandatory requirement "${score.overriddenByMandatoryGap}" was not satisfied.`
    );
  }

  return parts.join(" ");
}