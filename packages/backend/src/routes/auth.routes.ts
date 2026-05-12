import { Router } from "express";
import { logout, me, syncUser } from "../controllers/auth.controller";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router();

router.post("/sync", syncUser);
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, me);

export default router;
