"use client";

import { Brain, Smile, MessageSquare, Lock } from "lucide-react";

export default function LandingPage() {
	const handleGoogle = () => {
		// Trigger Google OAuth — replace with your Supabase / Google OAuth URL
		window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
	};

	return (
		<main className="min-h-screen bg-mm-bg flex flex-col items-center justify-center px-6 text-center">
			{/* Logo */}
			<div className="flex items-center gap-3 mb-8">
				<div
					className="w-10 h-10 rounded-xl flex items-center justify-center"
					style={{ background: "#7C9E8F" }}
				>
					<Brain size={20} color="#090E1C" />
				</div>
				<span
					className="text-xl font-semibold tracking-tight"
					style={{ color: "#E8EAF0" }}
				>
					MindMesh
				</span>
			</div>

			{/* Headline */}
			<h1
				className="text-[34px] font-bold leading-[1.18] tracking-tight max-w-[440px] mb-4"
				style={{ fontFamily: "var(--font-playfair)", color: "#E8EAF0" }}
			>
				A calm space to think things through
			</h1>

			<p
				className="text-sm leading-[1.78] max-w-xs mb-8"
				style={{ color: "#8892A4" }}
			>
				Talk to an AI that listens. Track your mood. Understand yourself better
				over time.
			</p>

			{/* CTA */}
			<button
				onClick={handleGoogle}
				className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold mb-9 transition-opacity hover:opacity-90 cursor-pointer border-0"
				style={{ background: "#E8EAF0", color: "#090E1C" }}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Continue with Google
			</button>

			{/* Pills */}
			<div className="flex gap-2.5 flex-wrap justify-center">
				{[
					{ icon: <Smile size={13} color="#C4927A" />, label: "Mood tracking" },
					{
						icon: <MessageSquare size={13} color="#7C9E8F" />,
						label: "AI-guided sessions",
					},
					{
						icon: <Lock size={13} color="#8A9ED4" />,
						label: "Private & secure",
					},
				].map(({ icon, label }) => (
					<div
						key={label}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
						style={{
							background: "rgba(255,255,255,0.05)",
							border: "1px solid rgba(255,255,255,0.08)",
						}}
					>
						{icon}
						<span className="text-xs" style={{ color: "#8892A4" }}>
							{label}
						</span>
					</div>
				))}
			</div>
		</main>
	);
}
