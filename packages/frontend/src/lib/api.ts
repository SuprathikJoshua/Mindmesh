const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem("mm_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();
	const url = `${BASE}${path}`;
	console.log("[API] request:", options.method ?? "GET", url);
	console.log("[API] headers:", {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...(options.headers ?? {}),
	});
	const res = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(options.headers ?? {}),
		},
	});
	if (!res.ok) {
		const err = await res.text();
		console.log("[API] request failed:", res.status, err);
		throw new Error(err || `HTTP ${res.status}`);
	}
	console.log("[API] request success:", res.status);
	return res.json() as Promise<T>;
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
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
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
	return request(`/sessions/${id}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
}

export async function endSession(id: string): Promise<Session> {
	return request(`/sessions/${id}/end`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
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
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
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
	return request("/mood/history", {
		method: "GET",
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	});
}
