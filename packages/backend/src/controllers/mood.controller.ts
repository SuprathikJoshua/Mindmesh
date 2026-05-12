import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import asyncHandler from "../utils/asynchandlers";
import ApiResponse from "../utils/ApiResponse";

export const getMoodHistory = asyncHandler(async (req: Request, res: Response) => {
	const checkins = await prisma.moodCheckin.findMany({
		where: { userId: req.userId },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			score: true,
			note: true,
			sessionId: true,
			createdAt: true,
		},
	});

	res.json(
		new ApiResponse(200, { checkins }, "Mood history fetched").data,
	);
});