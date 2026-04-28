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

function fallbackQuestion(answers, questionIndex) {
  const businessFocus = answers?.dor_principal || answers?.adaptive_1?.answer || "operação";

  if (questionIndex === 1) {
    return {
      label: "DIAGNÓSTICO OPERACIONAL",
      question: businessFocus === "financeiro"
        ? "Qual ponto financeiro mais aperta o crescimento hoje?"
        : businessFocus === "marketing"
          ? "O que mais impede seus leads de virarem venda?"
          : "Se você pudesse corrigir uma única parte do processo hoje, qual seria?",
      options: [
        { value: "processo", label: "Processo e rotina", sub: "Muito retrabalho e variação" },
        { value: "comercial", label: "Comercial e vendas", sub: "Leads sem conversão" },
        { value: "equipe", label: "Equipe e execução", sub: "Dependência do dono" },
        { value: "financeiro", label: "Financeiro e margem", sub: "Preço, caixa ou inadimplência" },
      ],
    };
  }

  return {
    label: "APROFUNDANDO A DOR",
    question: "Qual parte dessa trava mais prejudica o resultado no dia a dia?",
    options: [
      { value: "tempo", label: "Consome tempo demais", sub: "Muita energia para pouco retorno" },
      { value: "receita", label: "Corta receita", sub: "Impacta faturamento diretamente" },
      { value: "equipe", label: "Desorganiza o time", sub: "Gera ruído na execução" },
      { value: "caixa", label: "Pressiona o caixa", sub: "Afeta previsibilidade financeira" },
    ],
  };
}

function normalizeQuestion(question, answers, questionIndex) {
  const fallback = fallbackQuestion(answers, questionIndex);
  const options = Array.isArray(question?.options) && question.options.length > 0 ? question.options : fallback.options;

  return {
    label: normalizeText(question?.label) || fallback.label,
    question: normalizeText(question?.question) || fallback.question,
    options: options.map((option, index) => ({
      value: normalizeText(option?.value) || `opt_${index + 1}`,
      label: normalizeText(option?.label) || `Opção ${index + 1}`,
      sub: normalizeText(option?.sub || option?.description),
    })),
  };
}

async function requestQuestionFromOpenAI({ leadId, answers, questionIndex }) {
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
          content: "Você gera perguntas adaptativas de diagnóstico comercial em JSON válido.",
        },
        {
          role: "user",
          content: `Lead ID: ${leadId}\nPergunta adaptativa número ${questionIndex}\nRespostas: ${JSON.stringify(answers)}`,
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
  const questionIndex = Number(payload?.questionIndex || 1);
  const answers = payload?.answers || {};

  if (!leadId) {
    return json(400, { error: "leadId é obrigatório." });
  }

  try {
    const question = await requestQuestionFromOpenAI({ leadId, answers, questionIndex });
    return json(200, normalizeQuestion(question, answers, questionIndex));
  } catch (error) {
    console.error("generate-question fallback:", error);
    return json(200, fallbackQuestion(answers, questionIndex));
  }
}