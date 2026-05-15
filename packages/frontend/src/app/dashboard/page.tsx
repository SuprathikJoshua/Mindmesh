"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart, Bar, Cell, ResponsiveContainer } from "recharts";
import { ChevronRight, MessageSquare, Plus } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { getMe, getSessions, User, Session } from "@/lib/api";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const MOCK_BARS = [3, 4, 3, 5, 2, 4, 4]; // replace with real mood history

function moodColor(v: number) {
	if (v >= 4) return "#7C9E8F";
	if (v >= 3) return "#334455";
	return "#C4927A";
}

function sessionAccent(i: number) {
	const colors = ["#7C9E8F", "#C4927A", "#8A9ED4"];
	return colors[i % colors.length];
}

export default function DashboardPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [sessions, setSessions] = useState<Session[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const [u, s] = await Promise.all([getMe(), getSessions()]);
				setUser(u);
				setSessions(s);
			} catch {
				router.push("/");
			} finally {
				setLoading(false);
			}
		})();
	}, [router]);

	const avgMood = sessions.length
		? (
				sessions.reduce((s, x) => s + (x.mood ?? 0), 0) / sessions.length
			).toFixed(1)
		: "—";

	if (loading) {
		return (
			<div className="min-h-screen bg-mm-bg flex items-center justify-center">
				<p className="text-mm-muted text-sm">Loading...</p>
			</div>
		);
	}

	const barData = WEEK.map((day, i) => ({ day, mood: MOCK_BARS[i] }));

	return (
		<div className="min-h-screen bg-mm-bg flex">
			<Sidebar user={user ?? undefined} />

			<main className="flex-1 px-7 py-6 overflow-y-auto">
				{/* Header */}
				<div className="flex items-start justify-between mb-5">
					<div>
						<h1
							className="text-[19px] font-semibold mb-0.5"
							style={{ fontFamily: "var(--font-playfair)", color: "#E8EAF0" }}
						>
							Good evening, {user?.name?.split(" ")[0] ?? "there"}
						</h1>
						<p className="text-[11px]" style={{ color: "#8892A4" }}>
							{new Date().toLocaleDateString("en-US", {
								weekday: "long",
								month: "long",
								day: "numeric",
							})}{" "}
							· 5 day streak 🔥
						</p>
					</div>
					<Link
						href="/mood"
						className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border-0"
						style={{ background: "#7C9E8F", color: "#090E1C" }}
					>
						<Plus size={13} />
						New Session
					</Link>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-3 gap-2.5 mb-4">
					{[
						{
							label: "Sessions",
							value: sessions.length,
							sub: "+3 this week",
							subColor: "#7C9E8F",
						},
						{
							label: "Avg mood",
							value: avgMood,
							sub: "↓ slightly",
							subColor: "#C4927A",
						},
						{
							label: "Streak",
							value: "5 days",
							sub: "Keep going!",
							subColor: "#7C9E8F",
						},
					].map(({ label, value, sub, subColor }) => (
						<div
							key={label}
							className="rounded-xl p-3.5"
							style={{
								background: "#0D1428",
								border: "1px solid rgba(255,255,255,0.07)",
							}}
						>
							<p
								className="text-[10px] uppercase tracking-wide mb-1"
								style={{ color: "#8892A4" }}
							>
								{label}
							</p>
							<p
								className="text-[22px] font-semibold leading-none"
								style={{ color: "#E8EAF0" }}
							>
								{value}
							</p>
							<p className="text-[11px] mt-1" style={{ color: subColor }}>
								{sub}
							</p>
						</div>
					))}
				</div>

				{/* Mood chart */}
				<div
					className="rounded-xl p-4 mb-4"
					style={{
						background: "#0D1428",
						border: "1px solid rgba(255,255,255,0.07)",
					}}
				>
					<p
						className="text-[10px] uppercase tracking-wide mb-3 font-medium"
						style={{ color: "#8892A4" }}
					>
						Mood this week
					</p>
					<ResponsiveContainer width="100%" height={64}>
						<BarChart data={barData} barCategoryGap="20%">
							<Bar dataKey="mood" radius={[3, 3, 0, 0]}>
								{barData.map((entry, i) => (
									<Cell
										key={i}
										fill={moodColor(entry.mood)}
										fillOpacity={0.85}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
					<div className="flex justify-between mt-1">
						{WEEK.map((d, i) => (
							<span
								key={i}
								className="text-[9px] flex-1 text-center"
								style={{ color: "#8892A4" }}
							>
								{d}
							</span>
						))}
					</div>
				</div>

				{/* Sessions */}
				<p
					className="text-[10px] uppercase tracking-wide font-medium mb-2.5"
					style={{ color: "#8892A4" }}
				>
					Recent sessions
				</p>
				<div className="flex flex-col gap-2">
					{sessions.slice(0, 5).map((s, i) => (
						<Link
							key={s.id}
							href={`/chat/${s.id}`}
							className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors"
							style={{
								background: "#0D1428",
								border: "1px solid rgba(255,255,255,0.07)",
							}}
						>
							<div
								className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
								style={{ background: `${sessionAccent(i)}1A` }}
							>
								<MessageSquare size={14} color={sessionAccent(i)} />
							</div>
							<div className="flex-1 min-w-0">
								<p
									className="text-[13px] font-medium truncate"
									style={{ color: "#E8EAF0" }}
								>
									{s.title ?? "Untitled session"}
								</p>
								<p className="text-[11px] mt-0.5" style={{ color: "#8892A4" }}>
									{new Date(s.createdAt).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									})}
									{s.durationMinutes ? ` · ${s.durationMinutes} min` : ""}
									{s.mood ? ` · mood ${s.mood}/5` : ""}
								</p>
							</div>
							<ChevronRight size={13} color="#445566" />
						</Link>
					))}
					{sessions.length === 0 && (
						<p className="text-sm text-mm-muted text-center py-6">
							No sessions yet.{" "}
							<Link
								href="/mood"
								className="underline"
								style={{ color: "#7C9E8F" }}
							>
								Start your first one.
							</Link>
						</p>
					)}
				</div>
			</main>
		</div>
	);
}
