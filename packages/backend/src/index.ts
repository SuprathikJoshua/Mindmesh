import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./lib/prisma";

import authRoutes from "./routes/auth.routes";
import sessionRoutes from "./routes/session.routes";
import moodRoutes from "./routes/mood.routes";

import { verifyJWT } from "./middleware/auth.middleware";
import { globalErrorHandler } from "./middleware/error.middleware";

// Validate required environment variables
const requiredEnvVars = [
	"DATABASE_URL",
	"SUPABASE_URL",
	"SUPABASE_SERVICE_ROLE_KEY",
	"OPENAI_API_KEY",
];

const missingEnvVars = requiredEnvVars.filter(
	(envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
	throw new Error(
		`Missing required environment variables: ${missingEnvVars.join(", ")}`
	);
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: "50kb" }));

// Health check endpoint - tests database connection
app.get("/api/v1/health", async (req, res) => {
	try {
		// Test database connection
		await prisma.$queryRaw`SELECT 1`;
		res.json({ 
			status: "ok",
			database: "connected",
			llm: process.env.OPENAI_API_KEY ? "configured" : "unconfigured",
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		res.status(503).json({ 
			status: "error",
			database: "disconnected",
			llm: process.env.OPENAI_API_KEY ? "configured" : "unconfigured",
			error: error instanceof Error ? error.message : "Unknown error"
		});
	}
});

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/sessions", verifyJWT, sessionRoutes);
app.use("/api/v1/mood", verifyJWT, moodRoutes);

app.use(globalErrorHandler);

app.listen(PORT, () => {
	console.log(`MindMesh server running on port ${PORT}`);
	console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
});
