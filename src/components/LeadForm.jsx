import { useState } from "react";

const FIELD_STYLE = {
	width: "100%",
	padding: "14px 16px",
	borderRadius: 8,
	border: "1px solid var(--border)",
	background: "var(--surface)",
	color: "var(--text)",
	fontSize: 15,
	outline: "none",
};

export default function LeadForm({ onSubmit, loading, error }) {
	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		companyName: "",
	});

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((current) => ({ ...current, [name]: value }));
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		onSubmit(form);
	};

	return (
		<div className="fade-up intro-card" style={{ maxWidth: 560, width: "100%" }}>
			<div className="tag" style={{ marginBottom: 18 }}>CAPTAÇÃO DE LEAD</div>
			<h1 style={{ fontSize: "clamp(28px, 6vw, 40px)", lineHeight: 1.08, fontWeight: 800, marginBottom: 14 }}>
				Antes de começar, me passa seus dados.
			</h1>
			<p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: 28, fontSize: 15 }}>
				O acesso ao diagnóstico é liberado depois do cadastro. Em seguida você entra na introdução atual do survey.
			</p>

			<form className="lead-form" onSubmit={handleSubmit}>
				<div className="input-grid">
					<label>
						<span>Nome</span>
						<input name="name" value={form.name} onChange={handleChange} placeholder="Seu nome" style={FIELD_STYLE} />
					</label>
					<label>
						<span>Email</span>
						<input name="email" type="email" value={form.email} onChange={handleChange} placeholder="voce@empresa.com" style={FIELD_STYLE} />
					</label>
					<label>
						<span>Telefone</span>
						<input name="phone" value={form.phone} onChange={handleChange} placeholder="(11) 99999-9999" style={FIELD_STYLE} />
					</label>
					<label>
						<span>Nome da empresa</span>
						<input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Nome da empresa" style={FIELD_STYLE} />
					</label>
				</div>

				{error && <div className="error-banner">{error}</div>}

				<button className="cta-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
					{loading ? "Enviando lead..." : "Liberar diagnóstico"}
					<span>→</span>
				</button>
			</form>
		</div>
	);
}
