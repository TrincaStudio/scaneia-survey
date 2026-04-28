import { getSupabaseClient } from "./_supabase.js";

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

function validatePayload(payload) {
  const name = normalizeText(payload?.name);
  const email = normalizeText(payload?.email);
  const phone = normalizeText(payload?.phone);
  const companyName = normalizeText(payload?.company_name || payload?.companyName);

  if (!name || !email || !phone || !companyName) {
    return { ok: false, error: "Preencha nome, email, telefone e nome da empresa." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Informe um email válido." };
  }

  return {
    ok: true,
    data: { name, email, phone, companyName },
  };
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

  const validation = validatePayload(payload);

  if (!validation.ok) {
    return json(400, { error: validation.error });
  }

  const supabase = getSupabaseClient();

  const { data: leadRow, error: leadError } = await supabase
    .from("leads")
    .insert({
      name: validation.data.name,
      email: validation.data.email,
      phone: validation.data.phone,
      company_name: validation.data.companyName,
      source: "scaneia-survey",
      status: "new",
    })
    .select("id")
    .single();

  if (leadError) {
    return json(500, { error: "Não foi possível salvar o lead." });
  }

  return json(200, { leadId: leadRow.id });
}