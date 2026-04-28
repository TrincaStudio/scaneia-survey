import { useEffect, useState } from "react";

function useTypewriter(text, speed = 16) {
	const [displayed, setDisplayed] = useState("");
	const [done, setDone] = useState(false);

	useEffect(() => {
		setDisplayed("");
		setDone(false);

		if (!text) {
			setDone(true);
			return undefined;
		}

		let index = 0;
		const timer = window.setInterval(() => {
			index += 1;
			setDisplayed(text.slice(0, index));

			if (index >= text.length) {
				window.clearInterval(timer);
				setDone(true);
			}
		}, speed);

		return () => window.clearInterval(timer);
	}, [text, speed]);

	return { displayed, done };
}

export default function DiagnosticResult({ diagnosis }) {
	const { displayed, done } = useTypewriter(diagnosis?.summary || "");
	const [showRest, setShowRest] = useState(false);

	useEffect(() => {
		if (done) {
			const timer = window.setTimeout(() => setShowRest(true), 250);
			return () => window.clearTimeout(timer);
		}

		setShowRest(false);
		return undefined;
	}, [done]);

	if (!diagnosis) {
		return null;
	}

	return (
		<div className="fade-up">
			<div style={{ marginBottom: 32 }}>
				<div className="tag" style={{ marginBottom: 12 }}>DIAGNÓSTICO PRELIMINAR</div>
				<h2 className="diagnosis-title">{diagnosis.headline}</h2>
			</div>

			<div className="diag-card" style={{ marginBottom: 20 }}>
				<div className="mono step-label">O QUE A IA IDENTIFICOU</div>
				<p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-soft)" }}>
					{displayed}
					{!done && <span className="cursor" />}
				</p>
			</div>

			{showRest && (
				<>
					<div className="fade-in" style={{ marginBottom: 20 }}>
						<div className="mono muted-label">TRAVÕES DETECTADOS</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
							{(diagnosis.painPoints || []).map((point, index) => (
								<div key={`${point.title}-${index}`} className="pain-row">
									<div className="pain-icon">⚡</div>
									<div>
										<div className="pain-title">{point.title}</div>
										<div className="mono pain-desc">{point.desc}</div>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="fade-in" style={{ marginBottom: 28 }}>
						<div className="mono muted-label">O QUE SE ABRE QUANDO A TRAVA SAI</div>
						<div className="opportunity-card">
							<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
								{(diagnosis.opportunities || []).map((opportunity, index) => (
									<div key={`${opportunity}-${index}`} style={{ display: "flex", gap: 10, alignItems: "center" }}>
										<span style={{ color: "var(--accent)", fontSize: 14 }}>→</span>
										<span style={{ fontSize: 14, color: index > 1 ? "transparent" : "var(--text)", filter: index > 1 ? "blur(5px)" : "none" }}>
											{opportunity}
										</span>
									</div>
								))}
							</div>
							<div className="opportunity-fade">
								<div className="mono opportunity-teaser">
									+ {Math.max((diagnosis.opportunities || []).length - 2, 0)} oportunidades identificadas — veja com a Trinca
								</div>
							</div>
						</div>
					</div>

					<div className="fade-in disclaimer-box">
						<div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
							<span style={{ color: "var(--text)", fontWeight: 600 }}>Este é apenas o começo.</span> O diagnóstico completo — com o mapa de onde você está, para onde quer ir, e o plano para chegar lá — só acontece quando a Trinca mergulha de verdade no seu negócio.
						</div>
					</div>

					<div className="fade-in diag-card result-cta-card">
						<div className="mono step-label">PRÓXIMO PASSO</div>
						<h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
							Pronto pra destrinchar isso com quem entende?
						</h3>
						<p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
							Fala com a Trinca. A gente entra fundo, entende onde dói, onde quer chegar — e abre o que precisa ser aberto.
						</p>
						<div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
							<a href="https://trinca.com" target="_blank" rel="noreferrer" className="cta-primary">
								Quero conversar com a Trinca
								<span>→</span>
							</a>
							<button className="cta-ghost" onClick={() => window.location.reload()}>
								Refazer diagnóstico
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
