interface Props {
	content: string;
}

export default function AIMessage({ content }: Props) {
	return (
		<div className="text-center px-9">
			<p
				className="text-[15px] leading-[1.9] italic"
				style={{ color: "#8892A4", fontFamily: "var(--font-playfair)" }}
			>
				{content}
			</p>
			<div
				className="mx-auto mt-2.5 rounded-full"
				style={{ width: 28, height: 1.5, background: "rgba(124,158,143,0.3)" }}
			/>
		</div>
	);
}
