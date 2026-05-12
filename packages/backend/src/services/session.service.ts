import { prisma } from "../lib/prisma";
import ApiError from "../utils/ApiError";

export interface CreateSessionInput {
	userId: string;
	moodScore: number;
	moodNote?: string;
}

export interface SessionListItem {
	id: string;
	title: string | null;
	status: string;
	summary: string | null;
	startedAt: Date;
	endedAt: Date | null;
	moodCheckin: { score: number } | null;
	messageCount: number;
}

export async function createSession(input: CreateSessionInput) {
	const { userId, moodScore, moodNote } = input;

	const session = await prisma.$transaction(async (tx) => {
		const newSession = await tx.session.create({
			data: { userId, status: "ACTIVE" },
		});

		await tx.moodCheckin.create({
			data: {
				userId,
				sessionId: newSession.id,
				score: moodScore,
				note: moodNote ?? null,
			},
		});

		return newSession;
	});

	return {
		session: {
			id: session.id,
			status: session.status,
			startedAt: session.startedAt,
			moodCheckin: { score: moodScore, note: moodNote },
		},
	};
}

export async function getSessionList(userId: string): Promise<SessionListItem[]> {
	const sessions = await prisma.session.findMany({
		where: { userId },
		orderBy: { startedAt: "desc" },
		include: {
			moodCheckin: { select: { score: true } },
			_count: { select: { messages: true } },
		},
	});

	return sessions.map((s) => ({
		id: s.id,
		title: s.title ?? null,
		status: s.status,
		summary: s.summary ?? null,
		startedAt: s.startedAt,
		endedAt: s.endedAt,
		moodCheckin: s.moodCheckin ? { score: s.moodCheckin.score } : null,
		messageCount: s._count.messages,
	}));
}

export async function getSessionById(id: string, userId: string) {
	const session = await prisma.session.findFirst({
		where: { id, userId },
		include: {
			moodCheckin: { select: { score: true, note: true } },
			messages: {
				orderBy: { createdAt: "asc" },
				select: { id: true, role: true, content: true, createdAt: true },
			},
		},
	});

	if (!session) throw new ApiError(404, "SESSION_NOT_FOUND");

	return {
		id: session.id,
		title: session.title ?? null,
		status: session.status,
		startedAt: session.startedAt,
		moodCheckin: session.moodCheckin,
		messages: session.messages,
		summary: session.summary ?? null,
	};
}

export async function endSessionById(id: string, userId: string) {
	const session = await prisma.session.findFirst({
		where: { id, userId },
		include: {
			messages: { orderBy: { createdAt: "asc" }, select: { role: true, content: true } },
		},
	});

	if (!session) throw new ApiError(404, "SESSION_NOT_FOUND");
	if (session.status === "ENDED") throw new ApiError(400, "SESSION_ALREADY_ENDED");

	const transcript = session.messages
		.map((m) => `${m.role === "USER" ? "User" : "Assistant"}: ${m.content}`)
		.join("\n");

	// Placeholder for summary — replace with real LLM call
	const summary = `[Session summary placeholder — ${session.messages.length} messages]\n${transcript.slice(0, 200)}...`;

	const updated = await prisma.session.update({
		where: { id, userId },
		data: { status: "ENDED", endedAt: new Date(), summary },
		select: { id: true, status: true, endedAt: true, summary: true },
	});

	return {
		id: updated.id,
		status: updated.status,
		endedAt: updated.endedAt,
		summary: updated.summary,
	};
}