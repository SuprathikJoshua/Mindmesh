import axios from "axios";
import ApiError from "../utils/ApiError";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4-turbo";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

if (!OPENAI_API_KEY) {
	throw new Error("OPENAI_API_KEY environment variable is not set");
}

const openaiClient = axios.create({
	baseURL: OPENAI_BASE_URL,
	headers: {
		Authorization: `Bearer ${OPENAI_API_KEY}`,
		"Content-Type": "application/json",
	},
});

export interface ChatMessage {
	role: "user" | "assistant" | "system";
	content: string;
}

/**
 * Build system prompt for MindMesh AI therapy
 */
export function buildSystemPrompt(
	userName: string,
	moodScore: number,
	moodNote?: string
): string {
	const moodLabels: Record<number, string> = {
		1: "Very Low",
		2: "Low",
		3: "Moderate",
		4: "Good",
		5: "Excellent",
	};

	const moodLabel = moodLabels[moodScore] || "Unknown";

	return `You are MindMesh, a compassionate and evidence-informed AI mental health companion.
Your role is to provide emotional support through empathetic, non-judgmental conversation.

User Context:
- Name: ${userName}
- Current Mood: ${moodScore}/5 (${moodLabel})
${moodNote ? `- Mood Note: "${moodNote}"` : ""}

Guidelines:
- Always validate the user's feelings before offering coping strategies
- Use CBT-informed language — challenge negative thought patterns gently
- Suggest breathing exercises or grounding techniques when appropriate
- If the user expresses crisis-level distress (self-harm, suicidal ideation), immediately provide crisis resources:
  iCall: 9152987821 | Vandrevala Foundation: 1860-2662-345
- Keep responses under 200 words unless depth is clearly needed
- Never diagnose. Never claim to replace professional therapy.
- End each response with a single open-ended follow-up question.`;
}

/**
 * Get AI response from OpenAI
 */
export async function getAIResponse(
	messages: ChatMessage[],
	systemPrompt: string
): Promise<string> {
	try {
		const response = await openaiClient.post("/chat/completions", {
			model: OPENAI_MODEL,
			messages: [
				{ role: "system", content: systemPrompt },
				...messages,
			],
			temperature: 0.7,
			max_tokens: 300,
		});

		const aiMessage = response.data.choices?.[0]?.message?.content;

		if (!aiMessage) {
			throw new ApiError(500, "EMPTY_AI_RESPONSE");
		}

		return aiMessage;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status || 500;
			const message = error.response?.data?.error?.message || "OpenAI API error";
			throw new ApiError(status, message);
		}
		throw error;
	}
}

/**
 * Generate session summary using OpenAI
 */
export async function generateSessionSummary(
	messages: ChatMessage[],
	userName: string
): Promise<string> {
	const summaryPrompt = `You are summarizing a completed emotional support session for the user. Write one concise third-person paragraph of 3–5 sentences. Use neutral, non-diagnostic language, do not use bullets, and do not invent details. Include the main emotional themes, coping strategies or insights discussed, and the user's emotional trajectory.

User: ${userName}

Session:
${messages.map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n")}

Summary:`;

	try {
		const response = await openaiClient.post("/chat/completions", {
			model: OPENAI_MODEL,
			messages: [
				{
					role: "user",
					content: summaryPrompt,
				},
			],
			temperature: 0.5,
			max_tokens: 150,
		});

		const summary = response.data.choices?.[0]?.message?.content;

		if (!summary) {
			throw new ApiError(500, "EMPTY_SUMMARY");
		}

		return summary;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status || 500;
			const message = error.response?.data?.error?.message || "OpenAI API error";
			throw new ApiError(status, message);
		}
		throw error;
	}
}
