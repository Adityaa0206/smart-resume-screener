import { Router } from "express";
import {
  getCandidates,
  getCandidateById
} from "../controllers/candidate.controller";

const router = Router();

router.get("/", getCandidates);
router.get("/:id", getCandidateById);

export const candidateRouter = router;