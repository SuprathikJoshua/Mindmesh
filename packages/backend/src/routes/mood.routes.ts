import { Router } from "express";
import { getMoodHistory } from "../controllers/mood.controller";

const router = Router();

router.get("/history", getMoodHistory);

export default router;