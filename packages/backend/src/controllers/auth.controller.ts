import type { Request, Response } from "express";
import { getUserById, syncUserService } from "../services/auth.service";
import asyncHandler from "../utils/asynchandlers";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

export const logout = asyncHandler(async (_req: Request, res: Response) => {
	// Supabase client SDK manages sign-out on the frontend.
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
export const syncUser = asyncHandler(async (req: Request, res: Response) => {
	const token = req.header("Authorization")?.replace("Bearer ", "");
	if (!token) throw new ApiError(401, "No token");

	const user = await syncUserService(token);
	res.json(new ApiResponse(200, user).data);
});
