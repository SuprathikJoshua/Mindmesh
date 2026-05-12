import type { Request, Response } from "express";
import {
	createSession,
	getSessionList,
	getSessionById,
	endSessionById,
} from "../services/session.service";
import asyncHandler from "../utils/asynchandlers";
import ApiResponse from "../utils/ApiResponse";

export const createSessionHandler = asyncHandler(async (req: Request, res: Response) => {
	const { moodScore, moodNote } = req.body;
	const result = await createSession({ userId: req.userId, moodScore, moodNote });
	res.status(201).json(new ApiResponse(201, result).data);
});

export const getSessionsHandler = asyncHandler(async (req: Request, res: Response) => {
	const sessions = await getSessionList(req.userId);
	res.json(new ApiResponse(200, { sessions }).data);
});

export const getSessionHandler = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const session = await getSessionById(id, req.userId);
	res.json(new ApiResponse(200, { session }).data);
});

export const endSessionHandler = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const session = await endSessionById(id, req.userId);
	res.json(new ApiResponse(200, { session }).data);
});