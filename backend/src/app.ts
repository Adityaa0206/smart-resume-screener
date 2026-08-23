import express, { Express, Request, Response } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.route";
import { errorHandler } from "./middleware/errorHandler";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRouter);

  // Phase 1 scope note: /api/screen, /api/candidates, /api/candidates/:id
  // are built in Phase 2 (they require the database persistence layer and
  // full orchestration pipeline, which is explicitly out of scope here).

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: { message: `Not found: ${req.method} ${req.path}`, code: "NOT_FOUND" } });
  });

  app.use(errorHandler);

  return app;
}
