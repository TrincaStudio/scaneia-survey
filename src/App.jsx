import { useEffect, useMemo, useState } from "react";
import Intro from "./components/Intro.jsx";
import Question from "./components/Question.jsx";
import LoadingQuestion from "./components/LoadingQuestion.jsx";
import GeneratingDiagnostic from "./components/GeneratingDiagnostic.jsx";
import DiagnosticResult from "./components/DiagnosticResult.jsx";
import INITIAL_QUESTIONS from "./data/initialQuestions.js";
import { generateDiagnosis, generateQuestion, submitLead } from "./lib/api.js";

const TOTAL_STEPS = INITIAL_QUESTIONS.length + 2;

function fallbackAdaptiveQuestion(index) {
  return {
    label: index === 0 ? "DIAGNÓSTICO OPERACIONAL" : "APROFUNDANDO A DOR",
    question: index === 0
      ? "Se você pudesse corrigir uma única parte do processo hoje, qual seria?"
      : "Qual parte dessa trava mais prejudica o resultado no dia a dia?",
    options: [
      { value: "processo", label: "Processo e rotina", sub: "Muito retrabalho e variação" },
      { value: "comercial", label: "Comercial e vendas", sub: "Leads sem conversão" },
      { value: "equipe", label: "Equipe e execução", sub: "Dependência do dono" },
      { value: "financeiro", label: "Financeiro e margem", sub: "Preço, caixa ou inadimplência" },
    ],
  };
}

function normalizeComparableText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isQuestionTooSimilar(currentQuestion, previousQuestion) {
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

function buildDistinctAdaptiveQuestion(index, answers) {
  const previousQuestion = answers?.adaptive_1?.question || "";

  if (index === 1) {
    const focus = answers?.adaptive_1?.answer || answers?.dor_principal || "operação";

    return {
      label: "ANÁLISE DE IMPACTO",
      question:
        focus === "financeiro"
          ? "Além desse aperto, o que hoje mais pressiona caixa, margem ou previsibilidade?"
          : focus === "comercial"
            ? "Além da conversão, o que mais ficou travado depois das tentativas de ajuste?"
            : focus === "equipe"
              ? "Além da execução, onde a operação segue perdendo ritmo ou prioridade?"
              : "Além da dor principal, qual impacto mais pesa no resultado hoje?",
      options: [
        { value: "impacto_caixa", label: "Pressão no caixa", sub: "Afeta previsibilidade e fôlego" },
        { value: "impacto_receita", label: "Perda de receita", sub: "Segue limitando faturamento" },
        { value: "impacto_equipe", label: "Ruído no time", sub: "Gera retrabalho e desalinhamento" },
        { value: "impacto_prioridade", label: "Prioridade difusa", sub: "Consome energia sem avanço claro" },
      ],
      previousQuestion,
    };
  }

  return fallbackAdaptiveQuestion(index);
}

function fallbackDiagnosis() {
  return {
    fit: "partial",
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
    partialFitNote: "A dor declarada pode não ser exatamente o território de entrada da Trinca, mas existe uma camada digital por trás que merece ser tratada com precisão.",
    noFitReason: "",
  };
}

function buildAdaptiveAnswers(answers, question, answerValue, index) {
  return {
    ...answers,
    [`adaptive_${index + 1}`]: {
      question: question.question,
      answer: answerValue,
      label: question.label,
    },
  };
}

export default function App() {
  const [phase, setPhase] = useState("intro");
  const [leadId, setLeadId] = useState("");
  const [leadError, setLeadError] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedValue, setSelectedValue] = useState("");

  const [adaptiveQuestions, setAdaptiveQuestions] = useState([]);
  const [adaptiveIndex, setAdaptiveIndex] = useState(0);
  const [loadingAdaptive, setLoadingAdaptive] = useState(false);

  const [diagnosis, setDiagnosis] = useState(null);

  const totalAnswered = Object.keys(answers).length;
  const progress = useMemo(() => Math.round((totalAnswered / TOTAL_STEPS) * 100), [totalAnswered]);
  const isInitialPhase = currentStep < INITIAL_QUESTIONS.length;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase, currentStep, adaptiveIndex]);

  useEffect(() => {
    if (phase !== "survey" || !leadId) {
      return undefined;
    }

    if (isInitialPhase || adaptiveIndex >= 2 || adaptiveQuestions[adaptiveIndex]) {
      return undefined;
    }

    let cancelled = false;
    setLoadingAdaptive(true);

    generateQuestion({
      leadId,
      questionIndex: adaptiveIndex + 1,
      answers,
    })
      .then((question) => {
        if (cancelled) {
          return;
        }

        const previousQuestion = adaptiveIndex > 0 ? adaptiveQuestions[adaptiveIndex - 1]?.question : "";
        const nextQuestion = {
          ...fallbackAdaptiveQuestion(adaptiveIndex),
          ...question,
        };

        const safeQuestion =
          adaptiveIndex === 1 && isQuestionTooSimilar(nextQuestion.question, previousQuestion)
            ? buildDistinctAdaptiveQuestion(adaptiveIndex, answers)
            : nextQuestion;

        setAdaptiveQuestions((current) => {
          const next = [...current];
          next[adaptiveIndex] = safeQuestion;
          return next;
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setAdaptiveQuestions((current) => {
          const next = [...current];
          next[adaptiveIndex] = fallbackAdaptiveQuestion(adaptiveIndex);
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAdaptive(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [phase, leadId, currentStep, adaptiveIndex, answers, adaptiveQuestions, isInitialPhase]);

  const handleLeadSubmit = async (formValues) => {
    setLeadLoading(true);
    setLeadError("");

    try {
      const response = await submitLead({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        companyName: formValues.companyName.trim(),
      });

      setLeadId(response.leadId);
      setPhase("survey");
    } catch (error) {
      setLeadError(error.message || "Não foi possível capturar seu lead agora.");
    } finally {
      setLeadLoading(false);
    }
  };

  const handleInitialAnswer = (value) => {
    const question = INITIAL_QUESTIONS[currentStep];
    const nextAnswers = {
      ...answers,
      [question.id]: value,
    };

    setSelectedValue(value);

    window.setTimeout(() => {
      setAnswers(nextAnswers);
      setSelectedValue("");

      if (currentStep < INITIAL_QUESTIONS.length - 1) {
        setCurrentStep((step) => step + 1);
        return;
      }

      setCurrentStep(INITIAL_QUESTIONS.length);
    }, 140);
  };

  const handleAdaptiveAnswer = (value) => {
    const question = adaptiveQuestions[adaptiveIndex] || fallbackAdaptiveQuestion(adaptiveIndex);
    const nextAnswers = buildAdaptiveAnswers(answers, question, value, adaptiveIndex);

    setSelectedValue(value);

    window.setTimeout(async () => {
      setAnswers(nextAnswers);
      setSelectedValue("");

      if (adaptiveIndex < 1) {
        setAdaptiveIndex((index) => index + 1);
        return;
      }

      setPhase("generating");

      try {
        const result = await generateDiagnosis({
          leadId,
          answers: nextAnswers,
        });

        setDiagnosis(result);
      } catch {
        setDiagnosis(fallbackDiagnosis());
      } finally {
        setPhase("result");
      }
    }, 140);
  };

  return (
    <>
      {phase === "survey" && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="app-shell">
        <div className="brand-row">
          <div className="brand-lockup">
            <div className="brand-mark" aria-label="Scaneia logo">
              <img src="/logo-scaneia360.svg" alt="Scaneia" className="brand-logo" />
            </div>
          </div>

          {phase === "survey" && <div className="mono brand-count">{totalAnswered} / {TOTAL_STEPS} respondidas</div>}
        </div>

        {phase === "intro" && (
          <Intro
            onLeadSubmit={handleLeadSubmit}
            leadLoading={leadLoading}
            leadError={leadError}
          />
        )}

        {phase === "survey" && (
          <div className="content-shell">
            {isInitialPhase ? (
              <Question
                key={currentStep}
                data={INITIAL_QUESTIONS[currentStep]}
                onAnswer={handleInitialAnswer}
                selectedValue={selectedValue}
              />
            ) : (
              <>
                {loadingAdaptive && !adaptiveQuestions[adaptiveIndex] && <LoadingQuestion />}

                {!loadingAdaptive && adaptiveQuestions[adaptiveIndex] && (
                  <Question
                    key={`adaptive-${adaptiveIndex}`}
                    data={adaptiveQuestions[adaptiveIndex]}
                    onAnswer={handleAdaptiveAnswer}
                    selectedValue={selectedValue}
                  />
                )}
              </>
            )}
          </div>
        )}

        {phase === "generating" && <GeneratingDiagnostic />}

        {phase === "result" && (
          <div className="content-shell">
            <DiagnosticResult diagnosis={diagnosis} />
          </div>
        )}
      </div>
    </>
  );
}