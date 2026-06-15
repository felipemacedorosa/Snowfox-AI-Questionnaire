"use client";

import { SECTIONS, TOTAL_Q } from "@/app/data";
import { NavBtn } from "@/components/NavBtn";

export function QuizScreen({ section, answers, onAnswer, onBack, onNext }: {
  section: number;
  answers: Record<string, number>;
  onAnswer: (qid: string, val: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const sec = SECTIONS[section];
  const isLast = section === SECTIONS.length - 1;
  const answeredTotal = Object.keys(answers).length;
  const sectionDone = sec.questions.every(q => answers[q.id] !== undefined);

  let globalNum = 1;
  for (let i = 0; i < section; i++) globalNum += SECTIONS[i].questions.length;

  return (
    <div>
      <div className="glass-card">
        {/* Progress */}
        <div className="mb-9" role="status" aria-live="polite"
          aria-label={`Progress: Pillar ${sec.pillar} of ${SECTIONS.length}, ${answeredTotal} of ${TOTAL_Q} answered`}>
          <div className="flex gap-[5px] mb-3.5">
            {SECTIONS.map((_, i) => (
              <div key={i} className={`progress-seg${i < section ? " done" : i === section ? " active" : ""}`} role="presentation" />
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-m)" }}>
              Pillar {sec.pillar} / {SECTIONS.length} — {sec.title}
            </span>
            <span className="text-[12px] whitespace-nowrap" style={{ color: "rgba(190,175,245,0.50)" }}>
              {answeredTotal} / {TOTAL_Q} answered
            </span>
          </div>
        </div>

        {/* Section header */}
        <div className="pb-7 mb-9" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[12px] font-bold tracking-[0.12em] uppercase mb-2.5" style={{ color: "rgba(167,139,250,0.65)" }}>
            Pillar {sec.pillar} of {SECTIONS.length}
          </p>
          <h2 className="text-[clamp(22px,4vw,30px)] font-bold leading-[1.25] mb-2.5">
            <span style={{ color: "#ffffff" }}>{sec.title}</span>
          </h2>
          <p className="text-[14px] leading-[1.65]" style={{ color: "var(--text-m)" }}>{sec.desc}</p>
        </div>

        {/* Questions */}
        <div className="flex flex-col">
          {sec.questions.map((q, qi) => {
            const num = globalNum + qi;
            const selected = answers[q.id];
            return (
              <div key={q.id} className="py-7 first:pt-0 last:pb-0" style={{ borderBottom: qi < sec.questions.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <p className="text-[10.5px] font-bold tracking-[0.10em] uppercase mb-2.5" style={{ color: "rgba(167,139,250,0.48)" }}>
                  Question {num} of {TOTAL_Q}
                </p>
                <p className="text-[16px] font-medium leading-[1.65] mb-[22px]" style={{ color: "var(--text-h)" }}>{q.text}</p>
                <div className="flex flex-col gap-2" role="group" aria-label={`Maturity score for question ${num}`}>
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
                          <span className="block text-[13px] font-semibold mb-0.5 leading-[1.3] transition-colors"
                            style={{ color: isSel ? "var(--text-h)" : "var(--text-m)" }}>{opt.label}</span>
                          <span className="block text-[12px] leading-[1.5] transition-colors"
                            style={{ color: isSel ? "rgba(210,198,255,0.72)" : "rgba(190,175,245,0.50)" }}>{opt.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 pt-8 mt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {section > 0 ? <NavBtn variant="back" onClick={onBack}>Back</NavBtn> : <span />}
          <span className={`text-[12px] flex-1 text-center${sectionDone ? " text-[rgba(110,231,183,0.80)]" : ""}`}
            style={{ color: sectionDone ? undefined : "rgba(190,175,245,0.50)" }}>
            {sectionDone ? "All questions answered — ready to continue" : "Answer all questions to continue"}
          </span>
          <NavBtn variant="next" disabled={!sectionDone} onClick={onNext}>
            {isLast ? "Complete Assessment" : "Next Section"}
          </NavBtn>
        </div>
      </div>
    </div>
  );
}
