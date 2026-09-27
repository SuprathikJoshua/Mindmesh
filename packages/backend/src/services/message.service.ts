import { prisma } from "../lib/prisma";
import { getAIResponse, buildSystemPrompt } from "../lib/openai";
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

	if (!session) {
		const exists = await prisma.session.findUnique({ where: { id } });
		throw new ApiError(exists ? 403 : 404, exists ? "FORBIDDEN" : "SESSION_NOT_FOUND");
	}

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
		include: { user: true, moodCheckin: true },
	});

	if (!session) {
		const exists = await prisma.session.findUnique({ where: { id } });
		throw new ApiError(exists ? 403 : 404, exists ? "FORBIDDEN" : "SESSION_NOT_FOUND");
	}
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

	// Fetch conversation history for context
	const conversationHistory = await prisma.message.findMany({
		where: { sessionId: id },
		orderBy: { createdAt: "desc" },
		select: { role: true, content: true },
		take: 20,
	});

	// Build system prompt with user context
	const systemPrompt = buildSystemPrompt(
		session.user.name,
		session.moodCheckin?.score || 3,
		session.moodCheckin?.note || undefined
	);

	// Convert history to chat format
	const messages = conversationHistory.reverse().map((msg) => ({
		role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
		content: msg.content,
	}));

	// Get AI response from OpenAI
	const aiResponse = await getAIResponse(messages, systemPrompt);

	const assistantMessage = await prisma.message.create({
		data: { sessionId: id, role: "ASSISTANT", content: aiResponse },
		select: { id: true, role: true, content: true, createdAt: true },
	});

	return { userMessage, assistantMessage };
}