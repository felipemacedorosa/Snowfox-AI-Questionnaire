"use client";

import {
  Check,
  ChevronRight,
  Circle,
  FileText,
  LockKeyhole,
  Save,
  Square,
} from "lucide-react";
import { motion } from "motion/react";
import {
  AnswerRecord,
  getAssessmentProgress,
  getSectionProgress,
  isQuestionVisible,
  SECTIONS,
  Question,
  SingleQuestion,
  MultiQuestion,
  TextQuestion,
} from "@/app/data";
import { NavBtn } from "@/components/NavBtn";
import type { SaveState } from "@/components/Navbar";

export function QuizScreen({
  section,
  answers,
  saveState,
  onAnswer,
  onSectionSelect,
  onBack,
  onNext,
}: {
  section: number;
  answers: AnswerRecord;
  saveState: SaveState;
  onAnswer: (qid: string, val: number | number[] | string | -1) => void;
  onSectionSelect: (section: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const sec = SECTIONS[section];
  const isLast = section === SECTIONS.length - 1;
  const visibleQs = sec.questions.filter(q => isQuestionVisible(q, sec.questions, answers));
  const sectionProgress = getSectionProgress(sec, answers);
  const assessmentProgress = getAssessmentProgress(answers);

  function handleMultiToggle(q: MultiQuestion, optValue: number, isNone: boolean) {
    const current = Array.isArray(answers[q.id]) ? (answers[q.id] as number[]) : [];
    const noneValues = q.options.filter(o => o.isNone).map(o => o.value);
    let next: number[];
    if (isNone) {
      next = current.includes(optValue) ? [] : [optValue];
    } else {
      const withoutNone = current.filter(v => !noneValues.includes(v));
      next = withoutNone.includes(optValue)
        ? withoutNone.filter(v => v !== optValue)
        : [...withoutNone, optValue];
    }
    onAnswer(q.id, next);
  }

  return (
    <div className="quiz-layout page-frame" id="assessment-navigation">
      <aside className="assessment-rail" aria-label="Navegação da avaliação">
        <div className="rail-heading">
          <div>
            <span className="section-kicker"><span className="kicker-line" /> Rota da avaliação</span>
            <strong>5 dimensões</strong>
          </div>
          <motion.span key={assessmentProgress.percent} className="rail-total" initial={{ opacity: 0.35, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>{assessmentProgress.percent}%</motion.span>
        </div>
        <div className="rail-progress" aria-hidden="true"><span style={{ width: `${assessmentProgress.percent}%` }} /></div>
        <ol className="section-list">
          {SECTIONS.map((item, index) => {
            const progress = getSectionProgress(item, answers);
            const isCurrent = index === section;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`section-item${isCurrent ? " is-current" : ""}${progress.complete ? " is-complete" : ""}`}
                  onClick={() => onSectionSelect(index)}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <span className="section-item-number">{progress.complete ? <Check size={14} aria-hidden="true" /> : `0${index + 1}`}</span>
                  <span className="section-item-copy"><strong>{item.title}</strong><small>{progress.answered}/{progress.total} respondidas</small></span>
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>
        <div className="rail-footer">
          <LockKeyhole size={15} aria-hidden="true" />
          <span>Suas respostas ficam neste dispositivo.</span>
        </div>
      </aside>

      <motion.main key={sec.id} className="question-panel" aria-labelledby="questionnaire-title" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}>
        <div className="question-panel-topline">
          <span>Pilar {sec.pillar} de {SECTIONS.length}</span>
          <span className={`save-state save-state-${saveState}`} aria-live="polite">
            <Save size={13} aria-hidden="true" />
            {saveState === "unavailable" ? "Sessão local" : saveState === "saving" ? "Salvando..." : saveState === "saved" ? "Salvo agora" : "Pronto para salvar"}
          </span>
        </div>

        <header className="question-header">
          <div className="question-header-meta">
            <span className="section-kicker"><span className="kicker-line" /> Dimensão {String(sec.pillar).padStart(2, "0")}</span>
            <span>{sectionProgress.answered} de {sectionProgress.total} respondidas</span>
          </div>
          <h1 id="questionnaire-title">{sec.title}</h1>
          <p>{sec.desc}</p>
          <div className="section-progress-track" aria-label={`${sectionProgress.percent}% da dimensão concluída`}>
            <span style={{ width: `${sectionProgress.percent}%` }} />
          </div>
        </header>

        <div className="question-list">
          {visibleQs.map((q, questionIndex) => (
            <QuestionBlock key={q.id} question={q} index={questionIndex} total={visibleQs.length} answers={answers} onAnswer={onAnswer} onMultiToggle={handleMultiToggle} />
          ))}
        </div>

        <footer className="question-footer">
          <div className="question-footer-status" aria-live="polite">
            {sectionProgress.complete ? <><Check size={16} aria-hidden="true" /> Dimensão concluída</> : <><Circle size={13} aria-hidden="true" /> Responda as perguntas obrigatórias para continuar</>}
          </div>
          <div className="question-footer-actions">
            <NavBtn variant="back" onClick={onBack}>{section === 0 ? "Início" : "Voltar"}</NavBtn>
            <NavBtn variant="next" disabled={!sectionProgress.complete} onClick={onNext}>{isLast ? "Ver resultado" : "Próxima dimensão"}</NavBtn>
          </div>
        </footer>
      </motion.main>
    </div>
  );
}

function QuestionBlock({
  question,
  index,
  total,
  answers,
  onAnswer,
  onMultiToggle,
}: {
  question: Question;
  index: number;
  total: number;
  answers: AnswerRecord;
  onAnswer: (qid: string, val: number | number[] | string | -1) => void;
  onMultiToggle: (q: MultiQuestion, value: number, isNone: boolean) => void;
}) {
  return (
    <motion.article className="question-block" id={`question-${question.id}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.045, 0.28), duration: 0.32 }}>
      <div className="question-number">Pergunta {String(index + 1).padStart(2, "0")} <span>/ {String(total).padStart(2, "0")}</span></div>
      <h2>{question.text}</h2>
      {question.type === "single" && <SingleOptions q={question} answers={answers} onAnswer={onAnswer} />}
      {question.type === "multi" && <MultiOptions q={question} answers={answers} onToggle={onMultiToggle} />}
      {question.type === "text" && <TextInput q={question} answers={answers} onAnswer={onAnswer} />}
    </motion.article>
  );
}

function SingleOptions({ q, answers, onAnswer }: {
  q: SingleQuestion;
  answers: AnswerRecord;
  onAnswer: (qid: string, val: number | -1) => void;
}) {
  const selected = typeof answers[q.id] === "number" ? answers[q.id] as number : undefined;
  return (
    <div className="options-list" role="group" aria-label={`Opções para: ${q.text}`}>
      {q.options.map(option => {
        const isSelected = selected === option.value;
        return (
          <motion.button key={option.value} type="button" className={`option-card${isSelected ? " is-selected" : ""}`} aria-pressed={isSelected} onClick={() => onAnswer(q.id, isSelected ? -1 : option.value)} whileTap={{ scale: 0.995 }} transition={{ duration: 0.12 }}>
            <span className="option-marker">{isSelected ? <Check size={16} aria-hidden="true" /> : option.value}</span>
            <span className="option-copy"><strong>{option.label}</strong>{option.note && <span>{option.note}</span>}</span>
            <span className="option-state" aria-hidden="true">{isSelected ? <Check size={15} /> : <Circle size={15} />}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function MultiOptions({ q, answers, onToggle }: {
  q: MultiQuestion;
  answers: AnswerRecord;
  onToggle: (q: MultiQuestion, value: number, isNone: boolean) => void;
}) {
  const selected = Array.isArray(answers[q.id]) ? answers[q.id] as number[] : [];
  return (
    <div className="options-list" role="group" aria-label={`Opções para: ${q.text}`}>
      {q.options.map(option => {
        const isSelected = selected.includes(option.value);
        return (
          <motion.button key={option.value} type="button" className={`option-card${isSelected ? " is-selected" : ""}`} aria-pressed={isSelected} onClick={() => onToggle(q, option.value, !!option.isNone)} whileTap={{ scale: 0.995 }} transition={{ duration: 0.12 }}>
            <span className="option-marker option-marker-check">{isSelected ? <Check size={16} aria-hidden="true" /> : <Square size={15} aria-hidden="true" />}</span>
            <span className="option-copy"><strong>{option.label}</strong>{option.note && <span>{option.note}</span>}</span>
            <span className="option-state" aria-hidden="true">{isSelected ? <Check size={15} /> : null}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function TextInput({ q, answers, onAnswer }: {
  q: TextQuestion;
  answers: AnswerRecord;
  onAnswer: (qid: string, val: string) => void;
}) {
  const value = typeof answers[q.id] === "string" ? answers[q.id] as string : "";
  return (
    <div className="text-answer">
      <div className="text-answer-label"><FileText size={15} aria-hidden="true" /> Contexto adicional</div>
      <textarea
        className="text-input"
        placeholder={q.placeholder ?? "Digite sua resposta..."}
        value={value}
        onChange={event => onAnswer(q.id, event.target.value)}
        rows={4}
      />
      <p>Opcional — sua resposta fica salva, mas não afeta a pontuação.</p>
    </div>
  );
}
