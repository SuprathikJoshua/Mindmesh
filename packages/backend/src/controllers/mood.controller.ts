import type { Request, Response } from "express";
import { getMoodHistory } from "../services/mood.service";
import asyncHandler from "../utils/asynchandlers";
import ApiResponse from "../utils/ApiResponse";

export const getMoodHistoryHandler = asyncHandler(async (req: Request, res: Response) => {
	const checkins = await getMoodHistory(req.userId);
	res.json(new ApiResponse(200, { checkins }, "Mood history fetched").data);
});