import LeadForm from "./LeadForm.jsx";

export default function Intro({ onLeadSubmit, leadLoading, leadError }) {
	return (
		<div className="fade-up intro-card" style={{ textAlign: "center", maxWidth: 560, width: "100%" }}>
			<div className="tag" style={{ marginBottom: 20 }}>DIAGNÓSTICO COMERCIAL</div>
			<h1 style={{ fontSize: "clamp(28px, 6vw, 42px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 16 }}>
				O que está <span style={{ color: "var(--accent)" }}>travando</span> o seu negócio?
			</h1>
			<p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.7, marginBottom: 40, maxWidth: 420, margin: "0 auto 40px" }}>
				Responda 5 perguntas. A IA identifica o gargalo, mapeia as oportunidades e te mostra o próximo passo certo.
			</p>
			<LeadForm onSubmit={onLeadSubmit} loading={leadLoading} error={leadError} />
		</div>
	);
}
