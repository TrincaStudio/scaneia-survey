import { useEffect, useMemo, useState } from "react";
import LeadForm from "./components/LeadForm.jsx";
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
  const [phase, setPhase] = useState("lead");
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

        const nextQuestion = {
          ...fallbackAdaptiveQuestion(adaptiveIndex),
          ...question,
        };

        setAdaptiveQuestions((current) => {
          const next = [...current];
          next[adaptiveIndex] = nextQuestion;
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
      setPhase("intro");
    } catch (error) {
      setLeadError(error.message || "Não foi possível capturar seu lead agora.");
    } finally {
      setLeadLoading(false);
    }
  };

  const handleStartSurvey = () => {
    if (!leadId) {
      setPhase("lead");
      return;
    }

    setPhase("survey");
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
            <div className="brand-mark">
              <span>S</span>
            </div>
            <span className="brand-name">SCANEIA</span>
          </div>

          {phase === "survey" && <div className="mono brand-count">{totalAnswered} / {TOTAL_STEPS} respondidas</div>}
        </div>

        {phase === "lead" && <LeadForm onSubmit={handleLeadSubmit} loading={leadLoading} error={leadError} />}

        {phase === "intro" && <Intro onStart={handleStartSurvey} />}

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

        {phase === "result" && <DiagnosticResult diagnosis={diagnosis} />}
      </div>
    </>
  );
}