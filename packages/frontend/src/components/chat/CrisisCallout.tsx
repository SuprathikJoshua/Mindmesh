interface Props {
	content: string;
}

export default function CrisisCallout({ content }: Props) {
	if (!/suicid|self[- ]?harm|kill myself|end my life|crisis/i.test(content)) return null;

	return (
		<div role="alert" className="rounded-xl border border-red-300/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">
			<p className="font-semibold">You deserve immediate support</p>
			<p className="mt-1">If you may be in immediate danger, contact local emergency services. In India, call iCall at 9152987821 or Vandrevala Foundation at 1860-2662-345.</p>
		</div>
	);
}
