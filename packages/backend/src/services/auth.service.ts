import { prisma } from "../lib/prisma";
import { supabase } from "../lib/supabase";
import ApiError from "../utils/ApiError";

export async function logoutUser(token: string): Promise<void> {
	const { error } = await supabase.auth.admin.signOut(token);
	if (error) throw new ApiError(500, "LOGOUT_FAILED");
}

export async function getUserById(userId: string) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new ApiError(404, "User not found");
	return user;
}
export async function syncUserService(token: string) {
	const { data, error } = await supabase.auth.getUser(token);
	if (error || !data.user) throw new ApiError(401, "Invalid token");

	const user = await prisma.user.upsert({
		where: { supabaseId: data.user.id },
		update: {
			email: data.user.email ?? "",
			name: data.user.user_metadata?.full_name ?? "User",
			avatarUrl: data.user.user_metadata?.avatar_url ?? null,
		},
		create: {
			supabaseId: data.user.id,
			email: data.user.email ?? "",
			name: data.user.user_metadata?.full_name ?? "User",
			avatarUrl: data.user.user_metadata?.avatar_url ?? null,
		},
	});

	return user;
}
