import express, { Express, Request, Response } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.route";
import { screeningRouter } from "./routes/screening.route";
import { candidateRouter } from "./routes/candidate.route";
import { errorHandler } from "./middleware/errorHandler";
import { dashboardRouter } from "./routes/dashboard.route";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/screen", screeningRouter);
  app.use("/api/candidates", candidateRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        message: `Not found: ${req.method} ${req.path}`,
        code: "NOT_FOUND"
      }
    });
  });

  app.use(errorHandler);

  return app;
}