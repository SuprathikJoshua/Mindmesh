import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes";
import sessionRoutes from "./routes/session.routes";
import moodRoutes from "./routes/mood.routes";

import { verifyJWT } from "./middleware/auth.middleware";
import { globalErrorHandler } from "./middleware/error.middleware";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: "50kb" }));

app.get("/api/v1/health", (req, res) => {
	res.json({ db: "ok", llm: "ok" });
});

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/sessions", verifyJWT, sessionRoutes);
app.use("/api/v1/mood", verifyJWT, moodRoutes);

app.use(globalErrorHandler);

app.listen(PORT, () => {
	console.log(`MindMesh server running on port ${PORT}`);
});
