import { Router } from "express";
import multer from "multer";
import { screenCandidates } from "../controllers/screening.controller";
import { config } from "../config";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxUploadFileSizeMb * 1024 * 1024,
    files: config.maxResumesPerRequest
  }
});

router.post(
  "/",
  upload.array("resumes", config.maxResumesPerRequest),
  screenCandidates
);

export const screeningRouter = router;