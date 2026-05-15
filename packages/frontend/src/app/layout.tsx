import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
	title: "MindMesh — A calm space to think things through",
	description:
		"AI-guided therapy sessions, mood tracking, and personal insights.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="dark">
			<body
				className={`${GeistSans.variable} antialiased bg-mm-bg text-mm-text`}
			>
				{children}
			</body>
		</html>
	);
}
