import type { Request, Response } from "express";
import { getMessagesBySessionId, sendMessageToSession } from "../services/message.service";
import asyncHandler from "../utils/asynchandlers";
import ApiResponse from "../utils/ApiResponse";

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const messages = await getMessagesBySessionId(id, req.userId);
	res.json(new ApiResponse(200, { messages }, "Messages fetched").data);
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const { content } = req.body;
	const result = await sendMessageToSession(id, req.userId, content);
	res.status(201).json(new ApiResponse(201, result, "Message sent").data);
});