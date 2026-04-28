export default function LoadingQuestion() {
	return (
		<div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			<div className="mono step-label">IA CALIBRANDO PRÓXIMA PERGUNTA...</div>
			<div className="typing-dots">
				<span />
				<span />
				<span />
			</div>
		</div>
	);
}
