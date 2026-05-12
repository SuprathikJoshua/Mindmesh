import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asynchandlers";
import { supabase } from "../lib/supabase";
import { prisma } from "../lib/prisma";

export const verifyJWT = asyncHandler(
	async (req: Request, res: Response, next: NextFunction) => {
		const token =
			req.cookies?.access_token ||
			req.header("Authorization")?.replace("Bearer ", "");

		if (!token) {
			throw new ApiError(401, "Unauthorized request");
		}

		const { data, error } = await supabase.auth.getUser(token);

		if (error || !data.user) {
			throw new ApiError(401, "Invalid or expired token");
		}

		// MindMesh schema uses supabaseId — not id
		const user = await prisma.user.findUnique({
			where: { supabaseId: data.user.id },
		});

		if (!user) {
			throw new ApiError(401, "User not found");
		}

		req.userId = user.id;
		next();
	},
);
