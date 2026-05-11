import { Router } from "express";

const router = Router();

router.get("/me", (req, res) => {
	res.json({ message: "auth route working!" });
});

export default router;
