import { useEffect, useState } from "react";

export default function GeneratingDiagnostic() {
	const steps = [
		"Cruzando respostas...",
		"Identificando gargalos...",
		"Mapeando alavancas de crescimento...",
		"Gerando diagnóstico...",
	];
	const [step, setStep] = useState(0);

	useEffect(() => {
		const timer = window.setInterval(() => {
			setStep((current) => Math.min(current + 1, steps.length - 1));
		}, 1200);

		return () => window.clearInterval(timer);
	}, []);

	return (
		<div className="fade-in scan-wrap generating-card">
			<div className="mono step-label">SCANEIA.COM — PROCESSANDO</div>
			<div className="shimmer-text" style={{ fontSize: 18, fontWeight: 700 }}>
				{steps[step]}
			</div>
			<div className="progress-rail">
				<div className="progress-rail-fill" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
			</div>
		</div>
	);
}
