import { supabase } from "../lib/supabase";
import { prisma } from "../lib/prisma";
import ApiError from "../utils/ApiError";

export async function getGoogleAuthUrl(): Promise<string> {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: `${process.env.FRONTEND_URL}/api/auth/callback`,
		},
	});

	if (error || !data.url) {
		throw new ApiError(502, "Failed to initiate Google OAuth");
	}

	return data.url;
}

export async function handleOAuthCallback(code: string) {
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

	return { token, user };
}

export async function logoutUser(): Promise<void> {
	await supabase.auth.signOut();
}

export async function getUserById(userId: string) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new ApiError(404, "User not found");
	return user;
}