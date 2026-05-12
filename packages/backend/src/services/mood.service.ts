import { prisma } from "../lib/prisma";

export interface MoodCheckinItem {
	id: string;
	score: number;
	note: string | null;
	sessionId: string;
	createdAt: Date;
}

export async function getMoodHistory(userId: string): Promise<MoodCheckinItem[]> {
	return prisma.moodCheckin.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			score: true,
			note: true,
			sessionId: true,
			createdAt: true,
		},
	});
}