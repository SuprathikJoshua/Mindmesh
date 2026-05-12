import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asynchandlers";
import ApiResponse from "../utils/ApiResponse";

const MAX_CONTEXT_MESSAGES = 20;

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id as string;

	const session = await prisma.session.findUnique({
		where: { id, userId: req.userId },
	});

	if (!session) throw new ApiError(404, "SESSION_NOT_FOUND");

	const messages = await prisma.message.findMany({
		where: { sessionId: id },
		orderBy: { createdAt: "asc" },
		select: { id: true, role: true, content: true, createdAt: true },
	});

	res.json(
		new ApiResponse(200, { messages }, "Messages fetched").data,
	);
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { content } = req.body;

	const session = await prisma.session.findUnique({
		where: { id, userId: req.userId },
		include: { moodCheckin: { select: { score: true, note: true } } },
	});

	if (!session) throw new ApiError(404, "SESSION_NOT_FOUND");
	if (session.status === "ENDED") throw new ApiError(400, "SESSION_ENDED");

	const userMessage = await prisma.message.create({
		data: { sessionId: id, role: "USER", content },
		select: { id: true, role: true, content: true, createdAt: true },
	});

	// Set session title from first user message
	if (session.title === null) {
		await prisma.session.update({
			where: { id, userId: req.userId },
			data: { title: content.slice(0, 60) },
		});
	}

	// Fetch context: last 20 messages
	const history = await prisma.message.findMany({
		where: { sessionId: id },
		orderBy: { createdAt: "asc" },
		select: { role: true, content: true },
	});
	// Context window capped at 20 messages — ready for LLM integration
	const _contextWindow = history.slice(-MAX_CONTEXT_MESSAGES);
	void _contextWindow;

	// AI response placeholder — replace with real LLM call
	const aiResponse = "AI_RESPONSE_PLACEHOLDER";

	const assistantMessage = await prisma.message.create({
		data: { sessionId: id, role: "AI", content: aiResponse },
		select: { id: true, role: true, content: true, createdAt: true },
	});

	res.status(201).json(
		new ApiResponse(201, { userMessage, assistantMessage }, "Message sent").data,
	);
});