"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/api";

const labels = ["Very low", "Low", "Moderate", "Good", "Excellent"];

export default function MoodPage() {
	const router = useRouter();
	const [score, setScore] = useState<number | null>(null);
	const [note, setNote] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		if (!score) {
			setError("Please select how you feel before beginning.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			const session = await createSession(score, note.trim() || undefined);
			router.push(`/chat/${session.id}`);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Unable to start session.");
			setSaving(false);
		}
	}

	return (
		<main className="min-h-screen bg-mm-bg flex items-center justify-center px-6">
			<form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl p-6 bg-[#0D1428] border border-white/10">
				<button type="button" onClick={() => router.push("/dashboard")} className="text-sm text-mm-muted mb-6">Back</button>
				<h1 className="text-2xl text-mm-text font-semibold">How are you feeling today?</h1>
				<p className="text-sm text-mm-muted mt-2">A quick check-in helps set the tone for your session.</p>
				<div className="grid grid-cols-5 gap-2 mt-8">
					{labels.map((label, index) => {
						const value = index + 1;
						return <button key={label} type="button" onClick={() => setScore(value)} aria-pressed={score === value} className="p-3 rounded-xl border text-xs" style={{ borderColor: score === value ? "#7C9E8F" : "rgba(255,255,255,.1)", color: score === value ? "#7C9E8F" : "#8892A4" }}>{value}<span className="block mt-1">{label}</span></button>;
					})}
				</div>
				<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={4} placeholder="Anything you'd like to share before we begin?" className="w-full mt-6 rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-mm-text outline-none" />
				<p className="text-right text-xs text-mm-muted">{note.length}/500</p>
				{error && <p role="alert" className="text-sm text-red-300 mt-3">{error}</p>}
				<button disabled={saving} className="w-full mt-5 rounded-xl bg-[#7C9E8F] text-[#090E1C] py-3 font-semibold disabled:opacity-50">{saving ? "Starting..." : "Begin session"}</button>
			</form>
		</main>
	);
}