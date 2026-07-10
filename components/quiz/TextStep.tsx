"use client";

import { AnswerRecord, TextQuestion } from "@/app/data";

export function TextStep({ q, answers, onAnswer }: {
  q: TextQuestion;
  answers: AnswerRecord;
  onAnswer: (qid: string, val: string) => void;
}) {
  const value = typeof answers[q.id] === "string" ? (answers[q.id] as string) : "";
  return (
    <div>
      <textarea
        className="w-full rounded-[12px] px-4 py-3 text-[13.5px] leading-[1.65] resize-none transition-colors"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--line-2)",
          color: "var(--text-h)",
          minHeight: 120,
          outline: "none",
        }}
        placeholder={q.placeholder ?? "Digite sua resposta..."}
        value={value}
        onChange={e => onAnswer(q.id, e.target.value)}
        onFocus={e => { e.currentTarget.style.borderColor = "var(--line-brand)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "var(--line-2)"; }}
      />
      <p className="text-[11.5px] mt-2 text-[var(--text-p)]">
        Opcional — sua resposta é salva mas não afeta a pontuação. Ctrl+Enter para continuar.
      </p>
    </div>
  );
}
