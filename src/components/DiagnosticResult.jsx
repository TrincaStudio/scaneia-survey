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

function FitDisclosure({ fit, partialFitNote, noFitReason }) {
	const content =
		fit === "none"
			? {
				lead: "Isso não é com a Trinca.",
				body: noFitReason || "A dor descrita não entra no território de atuação da Trinca.",
				tail: "A Trinca atende automação, IA, conversão, dados e UX. Não atende redes sociais, tráfego pago, branding isolado, jurídico ou RH.",
			}
			: fit === "partial"
				? {
					lead: "Uma observação importante.",
					body: partialFitNote || "A dor declarada não é exatamente o território de entrada da Trinca, mas existe uma camada digital por trás que merece ser tratada com precisão.",
					tail: "A Trinca entra quando o problema toca automação, conversão, experiência, dados ou IA. Se não houver essa camada, a gente é direto sobre isso.",
				}
				: {
					lead: "Esse é território da Trinca.",
					body: "A solução aqui passa por automação, IA, UX, conversão, dados ou busca inteligente.",
					tail: "O que fica de fora: redes sociais, mídia paga, branding isolado, jurídico, RH e consultoria financeira.",
				};

	return (
		<div className="fade-in" style={{ marginBottom: 20 }}>
			<div className="diag-card fit-note-card" style={{ background: "#0d0d0b", border: "1px solid var(--border)", padding: "18px 20px" }}>
				<div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
					<span style={{ color: "var(--text)", fontWeight: 600 }}>{content.lead}</span>{" "}
					{content.body}
				</div>
				<div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginTop: 4 }}>
					{content.tail}
				</div>
			</div>
		</div>
	);
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
						<div className="mono muted-label">O QUE IDENTIFICAMOS</div>
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
						<div className="mono muted-label">O QUE SE ABRE</div>
						<div className="opportunity-card" style={{ minHeight: 140 }}>
							<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
								{(diagnosis.opportunities || []).slice(0, 2).map((opportunity, index) => (
									<div key={`${opportunity}-${index}`} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
										<span style={{ color: "var(--accent)", fontSize: 14, flexShrink: 0, marginTop: 2 }}>→</span>
										<span style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{opportunity}</span>
									</div>
								))}
							</div>
							<div className="opportunity-fade" style={{ backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}>
								<div className="mono opportunity-teaser">
									+ {Math.max((diagnosis.opportunities || []).length - 2, 0)} oportunidades identificadas — veja com a Trinca
								</div>
							</div>
						</div>
					</div>

					<FitDisclosure fit={diagnosis.fit} partialFitNote={diagnosis.partialFitNote} noFitReason={diagnosis.noFitReason} />

					{diagnosis.fit === "none" ? (
						<div className="fade-in diag-card" style={{
							background: "var(--surface)",
							border: "1px solid var(--border)",
							textAlign: "center",
							padding: "32px 24px"
						}}>
							<div className="mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 10 }}>
								HONESTIDADE ANTES DE TUDO
							</div>
							<h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
								Isso não é com a Trinca
							</h3>
							<p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8, lineHeight: 1.6 }}>
								{diagnosis.noFitReason || "A dor descrita está fora do território de atuação da Trinca."}
							</p>
							<p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
								Mas se quiser, a gente indica quem faz.
							</p>
							<div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
								<a href="mailto:contato@trinca.studio" className="cta-ghost">
									Quero uma indicação
								</a>
								<button className="cta-ghost" onClick={() => window.location.reload()}>
									Refazer diagnóstico
								</button>
							</div>
						</div>
					) : (
						<>

							{diagnosis.fit === "full" && (
								<div className="fade-in" style={{
									padding: "16px 20px",
									background: "#0d0d0b",
									border: "1px solid var(--border)",
									borderRadius: 8,
									marginBottom: 20
								}}>
									<div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
										<span style={{ color: "var(--text)", fontWeight: 600 }}>Este é apenas o começo.</span>{" "}
										O diagnóstico completo — com o mapa de onde você está, para onde quer ir, e como chegar lá — só acontece quando a Trinca mergulha de verdade no seu negócio.
									</div>
								</div>
							)}

							<div className="fade-in diag-card result-cta-card">
								<div className="mono step-label">PRÓXIMO PASSO</div>
								<h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
									{diagnosis.fit === "partial"
										? "Tem algo aqui que vale uma conversa"
										: "Vamos conversar sobre o seu momento"}
								</h3>
								<p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
									{diagnosis.fit === "partial"
										? "Sem compromisso, sem proposta antecipada. 30 minutos pra entender se faz sentido avançar."
										: "30 minutos. A gente entende o problema de vocês — sem compromisso, sem proposta antecipada. Se fizer sentido avançar, a gente propõe. Se não fizer, a gente indica quem faz."}
								</p>
								<div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
									<a href="https://trinca.studio" target="_blank" rel="noreferrer" className="cta-primary">
										Falar com a Trinca
										<span>→</span>
									</a>
									<button className="cta-ghost" onClick={() => window.location.reload()}>
										Refazer diagnóstico
									</button>
								</div>
							</div>
						</>
					)}
				</>
			)}
		</div>
	);
}
