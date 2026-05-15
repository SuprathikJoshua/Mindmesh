"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	MessageSquare,
	LineChart,
	Smile,
	Settings,
	Brain,
} from "lucide-react";

const NAV = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/sessions", label: "Sessions", icon: MessageSquare },
	{ href: "/insights", label: "Insights", icon: LineChart },
	{ href: "/mood", label: "Mood log", icon: Smile },
	{ href: "/settings", label: "Settings", icon: Settings },
];

interface Props {
	user?: { name: string; email: string };
}

export default function Sidebar({ user }: Props) {
	const path = usePathname();

	const initials = user?.name
		? user.name
				.split(" ")
				.map((w) => w[0])
				.join("")
				.slice(0, 2)
				.toUpperCase()
		: "MM";

	return (
		<aside
			className="w-46.5 shrink-0 flex flex-col"
			style={{
				background: "#0D1428",
				borderRight: "1px solid rgba(255,255,255,0.06)",
			}}
		>
			{/* Logo */}
			<div
				className="flex items-center gap-2 px-4 py-4"
				style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
			>
				<div
					className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
					style={{ background: "#7C9E8F" }}
				>
					<Brain size={14} color="#090E1C" />
				</div>
				<span className="text-sm font-semibold text-mm-text">MindMesh</span>
			</div>

			{/* Nav */}
			<nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
				{NAV.map(({ href, label, icon: Icon }) => {
					const active = path === href || path.startsWith(href + "/");
					return (
						<Link
							key={href}
							href={href}
							className="flex items-center gap-2.5 px-2.5 py-1.75 rounded-lg text-xs transition-colors"
							style={{
								background: active ? "rgba(124,158,143,0.14)" : "transparent",
								color: active ? "#7C9E8F" : "#8892A4",
								fontWeight: active ? 500 : 400,
							}}
						>
							<Icon size={15} />
							{label}
						</Link>
					);
				})}
			</nav>

			{/* User */}
			<div
				className="flex items-center gap-2.5 px-3 py-3"
				style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
			>
				<div
					className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
					style={{
						background: "rgba(124,158,143,0.2)",
						color: "#7C9E8F",
					}}
				>
					{initials}
				</div>
				<div className="min-w-0">
					<p className="text-xs font-medium text-mm-text truncate">
						{user?.name ?? "Guest"}
					</p>
					<p className="text-[10px] text-mm-muted">Free plan</p>
				</div>
			</div>
		</aside>
	);
}
