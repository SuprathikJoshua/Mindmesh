import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asynchandlers";
import ApiResponse from "../utils/ApiResponse";

export const createSession = asyncHandler(async (req: Request, res: Response) => {
	const { moodScore, moodNote } = req.body;

	const session = await prisma.$transaction(async (tx) => {
		const newSession = await tx.session.create({
			data: { userId: req.userId, status: "ACTIVE" },
		});

		await tx.moodCheckin.create({
			data: {
				userId: req.userId,
				sessionId: newSession.id,
				score: moodScore,
				note: moodNote ?? null,
			},
		});

		return newSession;
	});

	res.status(201).json(
		new ApiResponse(201, {
			session: {
				id: session.id,
				status: session.status,
				startedAt: session.startedAt,
				moodCheckin: { score: moodScore, note: moodNote },
			},
		}).data,
	);
});

export const getSessions = asyncHandler(async (req: Request, res: Response) => {
	const sessions = await prisma.session.findMany({
		where: { userId: req.userId },
		orderBy: { startedAt: "desc" },
		include: {
			moodCheckin: { select: { score: true } },
			_count: { select: { messages: true } },
		},
	});

	res.json(
		new ApiResponse(200, {
			sessions: sessions.map((s) => ({
				id: s.id,
				title: s.title ?? null,
				status: s.status,
				summary: s.summary ?? null,
				startedAt: s.startedAt,
				endedAt: s.endedAt,
				moodCheckin: { score: s.moodCheckin?.score },
				messageCount: s._count.messages,
			})),
		}).data,
	);
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id as string;

	const session = await prisma.session.findFirst({
		where: { id, userId: req.userId },
		include: {
			moodCheckin: { select: { score: true, note: true } },
			messages: {
				orderBy: { createdAt: "asc" },
				select: { id: true, role: true, content: true, createdAt: true },
			},
		},
	});

	if (!session) throw new ApiError(404, "SESSION_NOT_FOUND");

	res.json(
		new ApiResponse(200, {
			session: {
				id: session.id,
				title: session.title ?? null,
				status: session.status,
				startedAt: session.startedAt,
				moodCheckin: session.moodCheckin,
				messages: session.messages,
				summary: session.summary ?? null,
			},
		}).data,
	);
});

export const endSession = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id as string;

	const session = await prisma.session.findFirst({
		where: { id, userId: req.userId },
		include: {
			messages: { orderBy: { createdAt: "asc" }, select: { role: true, content: true } },
		},
	});

	if (!session) throw new ApiError(404, "SESSION_NOT_FOUND");
	if (session.status === "ENDED") throw new ApiError(400, "SESSION_ALREADY_ENDED");

	const transcript = session.messages
		.map((m) => `${m.role === "USER" ? "User" : "Assistant"}: ${m.content}`)
		.join("\n");

	// Placeholder for summary — replace with real LLM call
	const summary = `[Session summary placeholder — ${session.messages.length} messages]\n${transcript.slice(0, 200)}...`;

	const updated = await prisma.session.update({
		where: { id, userId: req.userId },
		data: { status: "ENDED", endedAt: new Date(), summary },
		select: { id: true, status: true, endedAt: true, summary: true },
	});

	res.json(
		new ApiResponse(200, {
			session: {
				id: updated.id,
				status: updated.status,
				endedAt: updated.endedAt,
				summary: updated.summary,
			},
		}).data,
	);
});