interface Props {
	content: string;
}

export default function MessageBubble({ content }: Props) {
	return (
		<div className="flex justify-end">
			<div
				className="max-w-[66%] px-4 py-3 text-sm leading-[1.75]"
				style={{
					background: "#17263D",
					border: "1px solid rgba(255,255,255,0.08)",
					borderRadius: "16px 16px 4px 16px",
					color: "#D8DCE8",
				}}
			>
				{content}
			</div>
		</div>
	);
}
