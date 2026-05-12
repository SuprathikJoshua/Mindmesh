import { prisma } from "../lib/prisma";
import ApiError from "../utils/ApiError";

export interface MessageItem {
	id: string;
	role: string;
	content: string;
	createdAt: Date;
}

export async function getMessagesBySessionId(id: string, userId: string) {
	const session = await prisma.session.findUnique({
		where: { id, userId },
	});

	if (!session) throw new ApiError(404, "SESSION_NOT_FOUND");

	return prisma.message.findMany({
		where: { sessionId: id },
		orderBy: { createdAt: "asc" },
		select: { id: true, role: true, content: true, createdAt: true },
	});
}

export async function sendMessageToSession(
	id: string,
	userId: string,
	content: string,
) {
	const session = await prisma.session.findUnique({
		where: { id, userId },
	});

	if (!session) throw new ApiError(404, "SESSION_NOT_FOUND");
	if (session.status === "ENDED") throw new ApiError(400, "SESSION_ENDED");

	const userMessage = await prisma.message.create({
		data: { sessionId: id, role: "USER", content },
		select: { id: true, role: true, content: true, createdAt: true },
	});

	if (session.title === null) {
		await prisma.session.update({
			where: { id, userId },
			data: { title: content.slice(0, 60) },
		});
	}

	// AI response placeholder — replace with real LLM call
	const aiResponse = "AI_RESPONSE_PLACEHOLDER";

	const assistantMessage = await prisma.message.create({
		data: { sessionId: id, role: "AI", content: aiResponse },
		select: { id: true, role: true, content: true, createdAt: true },
	});

	return { userMessage, assistantMessage };
}