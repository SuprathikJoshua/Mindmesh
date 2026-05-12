import { Router } from "express";
import { getMoodHistoryHandler } from "../controllers/mood.controller";

const router = Router();

router.get("/history", getMoodHistoryHandler);

export default router;