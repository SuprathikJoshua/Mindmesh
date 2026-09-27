
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem("mm_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();
	const url = `${BASE}${path}`;
	console.log(url);
	const res = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(options.headers ?? {}),
		},
	});
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(body?.message ?? body?.data?.message ?? `HTTP ${res.status}`);
	}
	const body = await res.json();
	return (body?.data ?? body) as T;
}

// Auth

export interface User {
	id: string;
	email: string;
	name: string;
	avatarUrl?: string;
}

export async function syncUser(
	googleToken: string,
): Promise<{ token: string; user: User }> {
	return request("/auth/sync", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${googleToken}`,
		},
	});
}

export async function getMe(): Promise<User> {
	return request("/auth/me", {
		method: "GET",
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
}

export async function logout(): Promise<void> {
	await request("/auth/logout", { method: "POST" });
	localStorage.removeItem("mm_token");
}

// Sessions

export interface Session {
	id: string;
	title: string | null;
	status: "ACTIVE" | "ENDED";
	summary: string | null;
	startedAt: string;
	endedAt: string | null;
	moodCheckin: { score: number; note?: string | null } | null;
	messages?: Message[];
}

export async function createSession(
	moodScore: number,
	moodNote?: string,
): Promise<Session> {
	const data: { session: Session } = await request("/sessions", {
		method: "POST",
		body: JSON.stringify({ moodScore, moodNote }),
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
	return data.session;
}

export async function getSessions(): Promise<Session[]> {
	const data: { sessions: Session[] } = await request("/sessions", {
		method: "GET",
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
	return data.sessions;
}

export async function getSession(id: string): Promise<Session> {
	const data: { session: Omit<Session, "messages"> & { messages?: Array<Omit<Message, "role"> & { role: "USER" | "ASSISTANT" }> } } = await request(`/sessions/${id}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
	return {
		...data.session,
		messages: data.session.messages?.map((message) => ({
			...message,
			role: message.role === "USER" ? "user" : "assistant",
		})),
	};
}

export async function endSession(id: string): Promise<Session> {
	const data: { session: Session } = await request(`/sessions/${id}/end`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
	return data.session;
}

// Messages

export interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: string;
}

export async function sendMessage(
	sessionId: string,
	content: string,
): Promise<{ userMessage: Message; assistantMessage: Message }> {
	return request(`/sessions/${sessionId}/messages`, {
		method: "POST",
		body: JSON.stringify({ content }),
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
}

// Mood

export interface MoodEntry {
	id: string;
	score: number;
	note?: string | null;
	createdAt: string;
	sessionId: string;
}

export async function getMoodHistory(): Promise<MoodEntry[]> {
	const data: { checkins: MoodEntry[] } = await request("/mood/history", {
		method: "GET",
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
	return data.checkins;
}
