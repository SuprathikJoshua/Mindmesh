import express from "express";
import { prisma } from "./lib/prisma";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// test query
const users = await prisma.user.findMany();
console.log("DB connected, users:", users);

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
