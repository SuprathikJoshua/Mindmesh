"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain } from "lucide-react";
import { syncAuth } from "@/lib/api";

const STEPS = [
	"Syncing your account...",
	"Personalizing your space...",
	"Almost there!",
];

export default function AuthCallbackPage() {
	const router = useRouter();
	const [step, setStep] = useState(0);

	useEffect(() => {
		const run = async () => {
			// Extract token from URL hash or search params (Supabase / Google OAuth)
			const hash = window.location.hash;
			const params = new URLSearchParams(hash.replace("#", "?"));
			const accessToken =
				params.get("access_token") ??
				new URLSearchParams(window.location.search).get("code") ??
				"";

			if (!accessToken) {
				router.push("/");
				return;
			}

			try {
				// Step 1
				setStep(0);
				const { token } = await syncAuth(accessToken);
				localStorage.setItem("mm_token", token);

				// Step 2
				setStep(1);
				await new Promise((r) => setTimeout(r, 800));

				// Step 3
				setStep(2);
				await new Promise((r) => setTimeout(r, 600));

				router.push("/dashboard");
			} catch {
				router.push("/");
			}
		};

		run();
	}, [router]);

	const pct = ((step + 1) / STEPS.length) * 100;

	return (
		<div
			className="min-h-screen flex flex-col items-center justify-center text-center px-6"
			style={{ background: "#090E1C" }}
		>
			<div
				className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
				style={{
					background: "rgba(124,158,143,0.10)",
					border: "1px solid rgba(124,158,143,0.2)",
				}}
			>
				<Brain size={26} color="#7C9E8F" />
			</div>

			<h2
				className="text-[19px] font-semibold mb-2"
				style={{ fontFamily: "var(--font-playfair)", color: "#E8EAF0" }}
			>
				Setting up your space
			</h2>
			<p className="text-[13px] mb-8" style={{ color: "#8892A4" }}>
				Just a moment while we get everything ready...
			</p>

			{/* Progress bar */}
			<div
				className="w-44 h-0.5 rounded-full overflow-hidden mb-4"
				style={{ background: "rgba(255,255,255,0.07)" }}
			>
				<div
					className="h-full rounded-full transition-all duration-700 ease-out"
					style={{ width: `${pct}%`, background: "#7C9E8F" }}
				/>
			</div>

			<p className="text-xs transition-all" style={{ color: "#445566" }}>
				{STEPS[step]}
			</p>
		</div>
	);
}
