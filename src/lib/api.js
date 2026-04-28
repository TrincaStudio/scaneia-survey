const API_BASE = "/.netlify/functions";

async function postJson(path, payload) {
	const response = await fetch(`${API_BASE}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		const message = data?.error || data?.message || "Falha inesperada na integração.";
		throw new Error(message);
	}

	return data;
}

export function submitLead(payload) {
	return postJson("/submit-lead", payload);
}

export function generateQuestion(payload) {
	return postJson("/generate-question", payload);
}

export function generateDiagnosis(payload) {
	return postJson("/generate-diagnosis", payload);
}
