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

function normalizeComparableText(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function areQuestionsTooSimilar(currentQuestion, previousQuestion) {
  const current = normalizeComparableText(currentQuestion);
  const previous = normalizeComparableText(previousQuestion);

  if (!current || !previous) {
    return false;
  }

  if (current === previous) {
    return true;
  }

  const currentTokens = current.split(" ").filter(Boolean);
  const previousTokens = previous.split(" ").filter(Boolean);

  if (currentTokens.length === 0 || previousTokens.length === 0) {
    return false;
  }

  const previousTokenSet = new Set(previousTokens);
  const sharedTokens = currentTokens.filter((token) => previousTokenSet.has(token)).length;
  const overlapRatio = sharedTokens / Math.min(currentTokens.length, previousTokens.length);

  return overlapRatio >= 0.7;
}

function buildQuestionContext(answers, questionIndex) {
  const businessFocus = answers?.dor_principal || answers?.adaptive_1?.answer || "operação";
  const previousQuestion = normalizeText(answers?.adaptive_1?.question);

  if (questionIndex === 1) {
    return {
      label: "DIAGNÓSTICO OPERACIONAL",
      stage: "Pergunta 1",
      angle:
        businessFocus === "financeiro"
          ? "Aprofunde o ponto financeiro que mais aperta o crescimento."
          : businessFocus === "marketing"
            ? "Aprofunde onde o comercial trava a conversão dos leads."
            : "Aprofunde a principal trava operacional ou comercial da dor.",
      antiRepeat: "Não repita a formulação das perguntas iniciais do survey e não use uma abertura genérica.",
      previousQuestion,
    };
  }

  return {
    label: "ANÁLISE DE IMPACTO",
    stage: "Pergunta 2",
    angle:
      businessFocus === "financeiro"
        ? "Mostre o efeito dessa trava no caixa, na margem ou na previsibilidade."
        : businessFocus === "comercial"
          ? "Mostre o que já foi tentado no comercial e onde a conversão segue quebrando."
          : businessFocus === "equipe"
            ? "Mostre o impacto da trava na execução do time e no ritmo do negócio."
            : "Mostre o impacto prático da dor e o que já foi tentado para resolver.",
    antiRepeat: previousQuestion
      ? `A pergunta anterior foi: ${previousQuestion}. Gere uma segunda pergunta com foco diferente, sem repetir verbo, abertura ou estrutura.`
      : "Gere uma segunda pergunta com foco diferente, sem repetir verbo, abertura ou estrutura.",
    previousQuestion,
  };
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
    question: businessFocus === "financeiro"
      ? "Onde essa trava mais aperta o caixa hoje?"
      : businessFocus === "comercial"
        ? "Qual etapa do comercial mais derruba a conversão?"
        : businessFocus === "equipe"
          ? "O que mais trava a execução no dia a dia?"
          : "Qual parte dessa trava mais prejudica o resultado no dia a dia?",
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
  const context = buildQuestionContext(answers, questionIndex);

  if (!apiKey) {
    throw new Error("Missing OpenAI API key.");
  }

  const requestBody = {
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
        content: "Você gera apenas um objeto JSON com label, question e options. A pergunta 1 e a pergunta 2 devem ser claramente diferentes entre si. Não use nenhum outro campo.",
      },
      {
        role: "user",
        content: `Lead ID: ${leadId}\n${context.stage}\nRespostas atuais: ${JSON.stringify(answers)}\n\nObjetivo: ${context.angle}\n${context.antiRepeat}\n${context.previousQuestion ? `Pergunta anterior registrada: ${context.previousQuestion}\n` : ""}Regras:\n- Pergunta 1 precisa aprofundar o contexto operacional ou comercial da dor principal.\n- Pergunta 2 precisa explorar o que já foi tentado ou qual impacto essa dor gera no resultado.\n- Não repita a formulação das perguntas iniciais do survey.\n- Não use a mesma abertura, verbo ou estrutura da pergunta anterior.\n- Varie o foco entre processo, execução, conversão, caixa, equipe e prioridade conforme o contexto.\n- Mantenha a pergunta curta, natural e específica ao lead.\n- Use exatamente 4 opções bem distintas entre si.\n- Não adicione texto fora do JSON.`,
      },
    ],
    temperature: 0.8,
    presence_penalty: 0.6,
    frequency_penalty: 0.3,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  const parsedQuestion = JSON.parse(content);

  if (questionIndex === 2 && areQuestionsTooSimilar(parsedQuestion?.question, answers?.adaptive_1?.question)) {
    const retryResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...requestBody,
        messages: [
          requestBody.messages[0],
          {
            role: "user",
            content: `${requestBody.messages[1].content}\n\nA resposta anterior ficou próxima demais da pergunta anterior. Gere uma nova versão que mude de eixo, com foco em impacto, tentativa anterior ou consequência prática.`,
          },
        ],
      }),
    });

    if (retryResponse.ok) {
      const retryData = await retryResponse.json();
      const retryContent = retryData?.choices?.[0]?.message?.content || "{}";
      return JSON.parse(retryContent);
    }
  }

  return parsedQuestion;
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