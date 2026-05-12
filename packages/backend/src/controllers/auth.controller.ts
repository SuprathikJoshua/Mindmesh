import type { Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { prisma } from "../lib/prisma";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asynchandlers";
import ApiResponse from "../utils/ApiResponse";

export const googleAuth = asyncHandler(async (_req: Request, res: Response) => {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: `${process.env.FRONTEND_URL}/api/auth/callback`,
		},
	});

	if (error || !data.url) {
		throw new ApiError(502, "Failed to initiate Google OAuth");
	}

	res.redirect(data.url);
});

export const callback = asyncHandler(async (req: Request, res: Response) => {
	const { code } = req.query;

	if (!code || typeof code !== "string") {
		throw new ApiError(400, "Authorization code missing");
	}

	const { data: oauthData, error: oauthError } =
		await supabase.auth.exchangeCodeForSession(code);

	if (oauthError || !oauthData.user) {
		throw new ApiError(401, "OAuth exchange failed");
	}

	const user = await prisma.user.upsert({
		where: { supabaseId: oauthData.user.id },
		update: {
			email: oauthData.user.email ?? "",
			name: oauthData.user.user_metadata?.full_name ?? oauthData.user.email?.split("@")[0] ?? "User",
			avatarUrl: oauthData.user.user_metadata?.avatar_url ?? null,
		},
		create: {
			supabaseId: oauthData.user.id,
			email: oauthData.user.email ?? "",
			name: oauthData.user.user_metadata?.full_name ?? oauthData.user.email?.split("@")[0] ?? "User",
			avatarUrl: oauthData.user.user_metadata?.avatar_url ?? null,
		},
	});

	const { data: sessionData } = await supabase.auth.getSession();
	const token = sessionData.session?.access_token ?? "";

	res.json(
		new ApiResponse(200, {
			token,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				avatarUrl: user.avatarUrl,
			},
		}).data,
	);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
	await supabase.auth.signOut();
	res.json(new ApiResponse(200, { success: true }, "Logged out").data);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
	const user = await prisma.user.findUnique({ where: { id: req.userId } });
	if (!user) throw new ApiError(404, "User not found");
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