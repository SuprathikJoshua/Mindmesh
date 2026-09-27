interface Props {
	content: string;
}

function renderText(content: string) {
	return content.split("\n").map((line, index) => (
		<span key={`${line}-${index}`}>
			{line.replace(/\*\*(.*?)\*\*/g, "$1")}
			{index < content.split("\n").length - 1 && <br />}
		</span>
	));
}

export default function AIMessage({ content }: Props) {
	return (
		<div className="text-center px-9">
			<p
				className="text-[15px] leading-[1.9] italic"
				style={{ color: "#8892A4", fontFamily: "var(--font-playfair)" }}
			>
				{renderText(content)}
			</p>
			<div
				className="mx-auto mt-2.5 rounded-full"
				style={{ width: 28, height: 1.5, background: "rgba(124,158,143,0.3)" }}
			/>
		</div>
	);
}
