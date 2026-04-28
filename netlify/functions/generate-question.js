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
  const legacyQuestion = Array.isArray(question?.perguntas) && question.perguntas[0] ? question.perguntas[0] : null;
  const options = Array.isArray(question?.options) && question.options.length > 0
    ? question.options
    : Array.isArray(legacyQuestion?.opcoes) && legacyQuestion.opcoes.length > 0
      ? legacyQuestion.opcoes
      : fallback.options;

  return {
    label: normalizeText(question?.label) || normalizeText(question?.tema) || fallback.label,
    question: normalizeText(question?.question) || normalizeText(question?.pergunta) || normalizeText(legacyQuestion?.pergunta) || fallback.question,
    options: options.map((option, index) => ({
      value: normalizeText(option?.value) || `opt_${index + 1}`,
      label: normalizeText(option?.label) || normalizeText(option?.texto) || `Opção ${index + 1}`,
      sub: normalizeText(option?.sub || option?.description || option?.descricao),
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
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "adaptive_question",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["label", "question", "options"],
            properties: {
              label: { type: "string" },
              question: { type: "string" },
              options: {
                type: "array",
                minItems: 4,
                maxItems: 4,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["value", "label", "sub"],
                  properties: {
                    value: { type: "string" },
                    label: { type: "string" },
                    sub: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content: "Você gera apenas um objeto JSON com label, question e options. Não use nenhum outro campo.",
        },
        {
          role: "user",
          content: `Lead ID: ${leadId}\nPergunta adaptativa número ${questionIndex}\nRespostas: ${JSON.stringify(answers)}\n\nRegras: escreva uma pergunta única, objetiva e aprofundada; use exatamente 4 opções; não adicione texto fora do JSON.`,
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "{}";

  return JSON.parse(content);
}

async function handler(event) {
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

module.exports = { handler };