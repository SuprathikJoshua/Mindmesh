"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import AIMessage from "@/components/chat/AIMessage";
import MessageBubble from "@/components/chat/MessageBubble";
import CrisisCallout from "@/components/chat/CrisisCallout";
import {
	getSession,
	sendMessage,
	endSession,
	Message,
	Session,
} from "@/lib/api";

export default function ChatPage() {
	const { sessionid: sessionId } = useParams<{ sessionid: string }>();
	const router = useRouter();

	const [session, setSession] = useState<Session | null>(null);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "init",
			role: "assistant",
			content: "I'm here with you. What's been weighing on you?",
			createdAt: new Date().toISOString(),
		},
	]);
	const [input, setInput] = useState("");
	const [typing, setTyping] = useState(false);
	const [ending, setEnding] = useState(false);
	const [elapsed, setElapsed] = useState(0);
	const ended = session?.status === "ENDED";

	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		getSession(sessionId)
			.then((loadedSession) => {
				setSession(loadedSession);
				setMessages(loadedSession.messages ?? []);
			})
			.catch(() => router.push("/dashboard"));
	}, [sessionId, router]);

	// Elapsed timer
	useEffect(() => {
		const t = setInterval(() => setElapsed((e) => e + 1), 1000);
		return () => clearInterval(t);
	}, []);

	// Scroll to bottom
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, typing]);

	const fmt = (s: number) =>
		`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

	const handleSend = async () => {
		const text = input.trim();
		if (!text || typing || ended || text.length > 2000) return;
		setInput("");

		const userMsg: Message = {
			id: Date.now().toString(),
			role: "user",
			content: text,
			createdAt: new Date().toISOString(),
		};
		setMessages((m) => [...m, userMsg]);
		setTyping(true);

		try {
			const result = await sendMessage(sessionId, text);
			setMessages((m) => [...m, result.assistantMessage]);
		} catch {
			setMessages((m) => [
				...m,
				{
					id: "err",
					role: "assistant",
					content: "Something went wrong. Please try again.",
					createdAt: new Date().toISOString(),
				},
			]);
		} finally {
			setTyping(false);
			inputRef.current?.focus();
		}
	};

	const handleEnd = async () => {
		if (!window.confirm("Are you sure you want to end this session?")) return;
		setEnding(true);
		try {
			const ended = await endSession(sessionId);
			setSession((current) => current ? { ...current, ...ended } : ended);
		} catch {
			setEnding(false);
		}
	};

	const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div
			className="min-h-screen flex flex-col"
			style={{ background: "#090E1C" }}
		>
			{/* Top bar */}
			<div
				className="flex items-center gap-3 px-5 py-3 shrink-0"
				style={{
					background: "#0D1428",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
				}}
			>
				<button
					onClick={() => router.push("/dashboard")}
					className="text-mm-muted hover:text-mm-text transition-colors border-0 bg-transparent cursor-pointer p-0.5"
					aria-label="back"
				>
					<ArrowLeft size={17} />
				</button>
				<div className="flex-1 min-w-0">
					<p
						className="text-sm font-medium truncate"
						style={{ color: "#E8EAF0" }}
					>
						{session?.title ?? "Session"}
					</p>
					<p className="text-[11px]" style={{ color: "#7C9E8F" }}>
						● Live · {fmt(elapsed)}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{session?.moodCheckin && (
						<span
							className="text-[11px] px-2.5 py-1 rounded-full"
							style={{
								background: "rgba(255,255,255,0.05)",
								color: "#8892A4",
							}}
						>
							mood {session.moodCheckin.score}/5
						</span>
					)}
					<button
						onClick={handleEnd}
						disabled={ending || ended}
						className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer border transition-opacity disabled:opacity-50"
						style={{
							border: "1px solid rgba(196,146,122,0.35)",
							background: "transparent",
							color: "#C4927A",
						}}
					>
						{ending ? "Ending..." : ended ? "Session ended" : "End session"}
					</button>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto py-8 flex flex-col gap-7 px-11">
				{messages.map((m) =>
					m.role === "assistant" ? (
						<div key={m.id} className="flex flex-col gap-3"><AIMessage content={m.content} /><CrisisCallout content={m.content} /></div>
					) : (
						<MessageBubble key={m.id} content={m.content} />
					),
				)}

				{/* Typing indicator */}
				{typing && (
					<div className="text-center">
						<div className="inline-flex items-center gap-1.5">
							{[0, 1, 2].map((i) => (
								<div
									key={i}
									className="typing-dot rounded-full"
									style={{ width: 6, height: 6, background: "#7C9E8F" }}
								/>
							))}
						</div>
					</div>
				)}
				<div ref={bottomRef} />
			</div>

			{ended && session.summary && <section className="mx-11 mb-5 rounded-xl border border-white/10 bg-[#0D1428] p-5"><h2 className="text-sm font-semibold text-mm-text">Session summary</h2><p className="mt-2 text-sm leading-7 text-mm-muted">{session.summary}</p></section>}

			{/* Input */}
			<div
				className="flex items-center gap-2.5 px-5 py-3.5 shrink-0"
				style={{
					background: "#0D1428",
					borderTop: "1px solid rgba(255,255,255,0.06)",
				}}
			>
				<textarea
					ref={inputRef}
					value={input}
					maxLength={2000}
					disabled={ended}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKey}
					placeholder="Share what's on your mind..."
					rows={1}
					className="flex-1 resize-none rounded-[22px] px-4 py-2.5 text-[13px] leading-relaxed outline-none"
					style={{
						background: "rgba(255,255,255,0.05)",
						border: "1px solid rgba(255,255,255,0.09)",
						color: "#E8EAF0",
						caretColor: "#7C9E8F",
					}}
				/>
				<span className="text-[10px] text-mm-muted">{input.length}/2000</span>
				<button
					onClick={handleSend}
					disabled={!input.trim() || typing || ended}
					aria-label="send"
					className="w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer transition-opacity disabled:opacity-40 shrink-0"
					style={{ background: "#7C9E8F" }}
				>
					<Send size={14} color="#090E1C" />
				</button>
			</div>
		</div>
	);
}
