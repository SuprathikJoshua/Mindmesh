const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem("mm_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();
	const res = await fetch(`${BASE}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(options.headers ?? {}),
		},
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(err || `HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

// Auth

export interface User {
	id: string;
	email: string;
	name: string;
	avatarUrl?: string;
}

export async function syncAuth(
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
	return request("/auth/me");
}

// Sessions

export interface Session {
	id: string;
	title: string;
	mood: number;
	moodNote?: string;
	durationMinutes?: number;
	createdAt: string;
	endedAt?: string;
}

export async function createSession(
	mood: number,
	moodNote?: string,
): Promise<Session> {
	return request("/sessions", {
		method: "POST",
		body: JSON.stringify({ mood, moodNote }),
	});
}

export async function getSessions(): Promise<Session[]> {
	return request("/sessions");
}

export async function getSession(id: string): Promise<Session> {
	return request(`/sessions/${id}`);
}

export async function endSession(id: string): Promise<Session> {
	return request(`/sessions/${id}/end`, { method: "POST" });
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
): Promise<Message> {
	return request(`/sessions/${sessionId}/messages`, {
		method: "POST",
		body: JSON.stringify({ content }),
	});
}

// Mood

export interface MoodEntry {
	id: string;
	mood: number;
	note?: string;
	createdAt: string;
}

export async function getMoodHistory(): Promise<MoodEntry[]> {
	return request("/mood/history");
}
