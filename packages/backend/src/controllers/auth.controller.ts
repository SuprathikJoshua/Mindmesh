import type { Request, Response } from "express";
import { getGoogleAuthUrl, handleOAuthCallback, logoutUser, getUserById } from "../services/auth.service";
import asyncHandler from "../utils/asynchandlers";
import ApiResponse from "../utils/ApiResponse";

export const googleAuth = asyncHandler(async (_req: Request, res: Response) => {
	const url = await getGoogleAuthUrl();
	res.redirect(url);
});

export const callback = asyncHandler(async (req: Request, res: Response) => {
	const code = req.query.code as string;
	if (!code) throw new Error("Authorization code missing");
	const result = await handleOAuthCallback(code);
	res.json(
		new ApiResponse(200, {
			token: result.token,
			user: {
				id: result.user.id,
				email: result.user.email,
				name: result.user.name,
				avatarUrl: result.user.avatarUrl,
			},
		}).data,
	);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
	await logoutUser();
	res.json(new ApiResponse(200, { success: true }, "Logged out").data);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
	const user = await getUserById(req.userId);
	res.json(
		new ApiResponse(200, {
			id: user.id,
			email: user.email,
			name: user.name,
			avatarUrl: user.avatarUrl,
			createdAt: user.createdAt,
		}).data,
	);
});