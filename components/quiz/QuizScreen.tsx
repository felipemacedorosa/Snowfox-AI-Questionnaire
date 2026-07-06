"use client";

import {
  SECTIONS, AnswerRecord, Question, SingleQuestion, MultiQuestion, TextQuestion,
  isQuestionVisible,
} from "@/app/data";
import { NavBtn } from "@/components/NavBtn";

export function QuizScreen({ section, answers, onAnswer, onBack, onNext }: {
  section: number;
  answers: AnswerRecord;
  onAnswer: (qid: string, val: number | number[] | string | -1) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const sec = SECTIONS[section];
  const isLast = section === SECTIONS.length - 1;

  const visibleQs = sec.questions.filter(q => isQuestionVisible(q, sec.questions, answers));

  const answeredTotal = Object.keys(answers).filter(k => {
    const v = answers[k];
    return typeof v === "number" || (Array.isArray(v) && (v as number[]).length > 0);
  }).length;

  const sectionDone = visibleQs
    .filter(q => q.type !== "text")
    .every(q => {
      const ans = answers[q.id];
      if (q.type === "multi") return Array.isArray(ans) && (ans as number[]).length > 0;
      return typeof ans === "number";
    });

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
    <div>
      <div className="glass-card">
        {/* Progress */}
        <div className="mb-9" role="status" aria-live="polite"
          aria-label={`Progresso: Pilar ${sec.pillar} de ${SECTIONS.length}, ${answeredTotal} perguntas respondidas`}>
          <div className="flex gap-[5px] mb-3.5">
            {SECTIONS.map((_, i) => (
              <div key={i} className={`progress-seg${i < section ? " done" : i === section ? " active" : ""}`} role="presentation" />
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-m)" }}>
              Pilar {sec.pillar} / {SECTIONS.length} — {sec.title}
            </span>
            <span className="text-[12px] whitespace-nowrap" style={{ color: "rgba(190,175,245,0.50)" }}>
              {answeredTotal} respondidas
            </span>
          </div>
        </div>

        {/* Section header */}
        <div className="pb-7 mb-9" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[12px] font-bold tracking-[0.12em] uppercase mb-2.5" style={{ color: "rgba(167,139,250,0.65)" }}>
            Pilar {sec.pillar} de {SECTIONS.length}
          </p>
          <h2 className="text-[clamp(22px,4vw,30px)] font-bold leading-[1.25] mb-2.5">
            <span style={{ color: "#ffffff" }}>{sec.title}</span>
          </h2>
          <p className="text-[14px] leading-[1.65]" style={{ color: "var(--text-m)" }}>{sec.desc}</p>
        </div>

        {/* Questions */}
        <div className="flex flex-col">
          {visibleQs.map((q, qi) => (
            <div key={q.id} className="py-7 first:pt-0 last:pb-0"
              style={{ borderBottom: qi < visibleQs.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <p className="text-[10.5px] font-bold tracking-[0.10em] uppercase mb-2.5" style={{ color: "rgba(167,139,250,0.48)" }}>
                Pergunta {qi + 1} de {visibleQs.length}
              </p>
              <p className="text-[16px] font-medium leading-[1.65] mb-[22px]" style={{ color: "var(--text-h)" }}>{q.text}</p>

              {q.type === "single" && <SingleOptions q={q as SingleQuestion} answers={answers} onAnswer={onAnswer} />}
              {q.type === "multi"  && <MultiOptions  q={q as MultiQuestion}  answers={answers} onToggle={handleMultiToggle} />}
              {q.type === "text"   && <TextInput     q={q as TextQuestion}   answers={answers} onAnswer={onAnswer} />}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 pt-8 mt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {section > 0 ? <NavBtn variant="back" onClick={onBack}>Voltar</NavBtn> : <span />}
          <span className={`text-[12px] flex-1 text-center${sectionDone ? " text-[rgba(110,231,183,0.80)]" : ""}`}
            style={{ color: sectionDone ? undefined : "rgba(190,175,245,0.50)" }}>
            {sectionDone ? "Todas as perguntas respondidas — pronto para continuar" : "Responda todas as perguntas para continuar"}
          </span>
          <NavBtn variant="next" disabled={!sectionDone} onClick={onNext}>
            {isLast ? "Concluir Assessment" : "Próxima Seção"}
          </NavBtn>
        </div>
      </div>
    </div>
  );
}

function SingleOptions({ q, answers, onAnswer }: {
  q: SingleQuestion;
  answers: AnswerRecord;
  onAnswer: (qid: string, val: number | -1) => void;
}) {
  const selected = typeof answers[q.id] === "number" ? (answers[q.id] as number) : undefined;
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={`Opções para: ${q.text}`}>
      {q.options.map(opt => {
        const isSel = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`option-card${isSel ? " selected" : ""}`}
            aria-pressed={isSel}
            onClick={() => onAnswer(q.id, isSel ? -1 : opt.value)}
          >
            <span className="flex-shrink-0 w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-[13px] font-bold transition-all"
              style={isSel
                ? { background: "var(--grad)", border: "1px solid transparent", color: "#fff" }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(190,175,245,0.50)" }}>
              {opt.value}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-semibold leading-[1.5] transition-colors"
                style={{ color: isSel ? "var(--text-h)" : "var(--text-m)" }}>{opt.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MultiOptions({ q, answers, onToggle }: {
  q: MultiQuestion;
  answers: AnswerRecord;
  onToggle: (q: MultiQuestion, val: number, isNone: boolean) => void;
}) {
  const selected = Array.isArray(answers[q.id]) ? (answers[q.id] as number[]) : [];
  return (
    <div className="flex flex-col gap-2" role="group" aria-label={`Opções para: ${q.text}`}>
      {q.options.map(opt => {
        const isSel = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            className={`option-card${isSel ? " selected" : ""}`}
            aria-pressed={isSel}
            onClick={() => onToggle(q, opt.value, !!opt.isNone)}
          >
            <span className="flex-shrink-0 w-[30px] h-[30px] rounded-[8px] flex items-center justify-center transition-all"
              style={isSel
                ? { background: "var(--grad)", border: "1px solid transparent" }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
              {isSel ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 8l3.5 3.5L13 4.5" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="rgba(190,175,245,0.50)" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <rect x="2" y="2" width="12" height="12" rx="2" />
                </svg>
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-semibold leading-[1.5] transition-colors"
                style={{ color: isSel ? "var(--text-h)" : "var(--text-m)" }}>{opt.label}</span>
            </span>
          </button>
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
  const value = typeof answers[q.id] === "string" ? (answers[q.id] as string) : "";
  return (
    <div>
      <textarea
        className="w-full rounded-[10px] px-4 py-3 text-[13px] leading-[1.65] resize-none transition-all"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "var(--text-h)",
          fontFamily: "Poppins, sans-serif",
          minHeight: 100,
          outline: "none",
        }}
        placeholder={q.placeholder ?? "Digite sua resposta..."}
        value={value}
        onChange={e => onAnswer(q.id, e.target.value)}
        onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.50)"; }}
        onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; }}
      />
      <p className="text-[11px] mt-1.5" style={{ color: "rgba(190,175,245,0.40)" }}>
        Opcional — sua resposta é salva mas não afeta a pontuação.
      </p>
    </div>
  );
}
