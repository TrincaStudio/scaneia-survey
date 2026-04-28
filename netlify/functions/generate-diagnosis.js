import { getSupabaseClient } from "./_supabase.js";
import { Resend } from "resend";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(body),
  };
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function fallbackDiagnosis() {
  return {
    headline: "Negócio com potencial travado",
    summary: "Identificamos bloqueios claros no seu negócio que estão limitando o crescimento. A combinação de fatores comerciais e operacionais cria um ciclo que precisa ser quebrado com clareza estratégica.",
    painPoints: [
      { title: "Foco difuso", desc: "Energia espalhada em frentes que não geram resultado proporcional" },
      { title: "Processo não escalável", desc: "O que funciona hoje trava o crescimento de amanhã" },
      { title: "Decisão sem dados", desc: "Escolhas importantes sendo feitas no feeling" },
    ],
    opportunities: [
      "Receita previsível com processo comercial estruturado",
      "Time operando sem depender 100% do dono",
      "Margem recuperada com precificação correta",
      "Novos mercados acessíveis com posicionamento claro",
      "Empresa preparada para crescer sem quebrar",
    ],
  };
}

function formatContext(answers) {
  return Object.entries(answers || {})
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`)
    .join("\n");
}

function normalizeDiagnosis(diagnosis) {
  const fallback = fallbackDiagnosis();

  return {
    headline: normalizeText(diagnosis?.headline) || fallback.headline,
    summary: normalizeText(diagnosis?.summary) || fallback.summary,
    painPoints: Array.isArray(diagnosis?.painPoints) && diagnosis.painPoints.length > 0
      ? diagnosis.painPoints.map((point, index) => ({
          title: normalizeText(point?.title) || fallback.painPoints[index % fallback.painPoints.length].title,
          desc: normalizeText(point?.desc) || fallback.painPoints[index % fallback.painPoints.length].desc,
        }))
      : fallback.painPoints,
    opportunities: Array.isArray(diagnosis?.opportunities) && diagnosis.opportunities.length > 0
      ? diagnosis.opportunities.map((item) => normalizeText(item)).filter(Boolean)
      : fallback.opportunities,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderAnswersHtml(answers) {
  const entries = Object.entries(answers || {});

  if (entries.length === 0) {
    return "<p>Sem respostas registradas.</p>";
  }

  const rows = entries
    .map(([key, value]) => {
      const prettyValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      return `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(prettyValue)}</li>`;
    })
    .join("");

  return `<ul>${rows}</ul>`;
}

function renderDiagnosisList(items, itemRenderer) {
  if (!Array.isArray(items) || items.length === 0) {
    return "<p>Sem itens.</p>";
  }

  return `<ul>${items.map(itemRenderer).join("")}</ul>`;
}

function buildDiagnosisEmailHtml({ lead, answers, diagnosis }) {
  const leadBlock = `
    <h2>1. Dados do lead</h2>
    <p><strong>Nome:</strong> ${escapeHtml(lead?.name || "-")}</p>
    <p><strong>Email:</strong> ${escapeHtml(lead?.email || "-")}</p>
    <p><strong>Telefone:</strong> ${escapeHtml(lead?.phone || "-")}</p>
    <p><strong>Empresa:</strong> ${escapeHtml(lead?.company_name || "-")}</p>
  `;

  const answersBlock = `
    <h2>2. Respostas do survey</h2>
    ${renderAnswersHtml(answers)}
  `;

  const diagnosisBlock = `
    <h2>3. Diagnóstico</h2>
    <p><strong>Headline:</strong> ${escapeHtml(diagnosis?.headline || "-")}</p>
    <p><strong>Summary:</strong> ${escapeHtml(diagnosis?.summary || "-")}</p>
  `;

  const painPointsBlock = `
    <h2>4. Travões (painPoints)</h2>
    ${renderDiagnosisList(diagnosis?.painPoints, (point) => `<li><strong>${escapeHtml(point?.title || "-")}:</strong> ${escapeHtml(point?.desc || "-")}</li>`)}
  `;

  const opportunitiesBlock = `
    <h2>5. Oportunidades</h2>
    ${renderDiagnosisList(diagnosis?.opportunities, (item) => `<li>${escapeHtml(item)}</li>`)}
  `;

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h1>Novo diagnóstico Scaneia</h1>
      ${leadBlock}
      ${answersBlock}
      ${diagnosisBlock}
      ${painPointsBlock}
      ${opportunitiesBlock}
    </div>
  `;
}

async function sendDiagnosisEmail({ lead, answers, diagnosis }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const trincaEmail = process.env.TRINCA_EMAIL;
  const comercialEmail = process.env.COMERCIAL_EMAIL;

  if (!resendApiKey || !trincaEmail || !comercialEmail) {
    throw new Error("Missing email configuration.");
  }

  const resend = new Resend(resendApiKey);

  await resend.emails.send({
    from: "Scaneia <no-reply@mail.trincastudio.com>",
    to: [trincaEmail, comercialEmail],
    subject: "Novo diagnóstico Scaneia",
    html: buildDiagnosisEmailHtml({ lead, answers, diagnosis }),
  });
}

async function requestDiagnosisFromOpenAI({ leadId, answers }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OpenAI API key.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Você gera diagnósticos comerciais em JSON válido, com headline, summary, painPoints e opportunities.",
        },
        {
          role: "user",
          content: `Lead ID: ${leadId}\nRespostas: ${formatContext(answers)}`,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed.");
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return json(200, {});
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  let payload;

  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Corpo da requisição inválido." });
  }

  const leadId = normalizeText(payload?.leadId);
  const answers = payload?.answers || {};

  if (!leadId) {
    return json(400, { error: "leadId é obrigatório." });
  }

  const supabase = getSupabaseClient();

  let diagnosis;

  try {
    diagnosis = normalizeDiagnosis(await requestDiagnosisFromOpenAI({ leadId, answers }));
  } catch (error) {
    console.error("generate-diagnosis fallback:", error);
    diagnosis = fallbackDiagnosis();
  }

  const { error: insertError } = await supabase.from("diagnostics").insert({
    lead_id: leadId,
    answers,
    diagnosis,
  });

  if (insertError) {
    return json(500, { error: "Não foi possível salvar o diagnóstico." });
  }

  await supabase
    .from("leads")
    .update({ status: "diagnosed" })
    .eq("id", leadId);

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, name, email, phone, company_name")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) {
    console.error("Failed to fetch lead for diagnosis email:", leadError);
  }

  try {
    await sendDiagnosisEmail({
      lead,
      answers,
      diagnosis,
    });
  } catch (error) {
    console.error("Diagnosis email failed:", error);
  }

  return json(200, diagnosis);
}