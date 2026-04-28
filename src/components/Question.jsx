export default function Question({ data, onAnswer, selectedValue }) {
	return (
		<div className="fade-up">
			<div className="mono step-label">◆ {data.label}</div>
			<h2 className="question-title">{data.question}</h2>
			<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
				{data.options.map((option) => (
					<button
						key={option.value}
						className={`opt-btn ${selectedValue === option.value ? "selected" : ""}`}
						onClick={() => onAnswer(option.value)}
					>
						<div style={{ fontWeight: 600 }}>{option.label}</div>
						{option.sub && <div className="mono opt-sub">{option.sub}</div>}
					</button>
				))}
			</div>
		</div>
	);
}
