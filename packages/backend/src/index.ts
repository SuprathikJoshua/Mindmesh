import express from "express";
import authRoutes from "./routes/auth.routes";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
