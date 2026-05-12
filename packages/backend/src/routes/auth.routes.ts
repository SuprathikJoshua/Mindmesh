import { Router } from "express";
import { googleAuth, callback, logout, me } from "../controllers/auth.controller";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router();

router.get("/google", googleAuth);
router.get("/callback", callback);
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, me);

export default router;