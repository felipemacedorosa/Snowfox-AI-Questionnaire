"use client";

import { motion } from "motion/react";
import { AnswerRecord, MultiQuestion, SingleQuestion } from "@/app/data";
import { Keycap } from "@/components/ui/Keycap";
import { staggerChildren } from "@/lib/motion";

const optionVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

/** Check mark that draws in when a row becomes selected. */
function DrawnCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="flex-shrink-0">
      <motion.path
        d="M3 8.5l3.5 3.5L13 5"
        stroke="var(--violet-300)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
    </svg>
  );
}

function OptionRow({ displayIndex, label, note, selected, pressed, onClick }: {
  displayIndex: number;
  label: string;
  note?: string;
  selected: boolean;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      variants={optionVariant}
      type="button"
      data-option-btn
      className={`option-card${selected ? " selected" : ""}`}
      aria-pressed={selected}
      onClick={onClick}
      style={note ? { alignItems: "flex-start" } : undefined}
    >
      <Keycap label={displayIndex} selected={selected} pressed={pressed} className={note ? "mt-0.5" : undefined} />
      <span className="flex-1 min-w-0">
        <span
          className="block text-[13.5px] font-semibold leading-[1.5] transition-colors"
          style={{ color: selected ? "var(--text-h)" : "var(--text-m)" }}
        >
          {label}
        </span>
        {note && (
          <span
            className="block text-[12px] leading-[1.55] mt-1 transition-colors"
            style={{ color: selected ? "var(--text-m)" : "var(--text-p)" }}
          >
            {note}
          </span>
        )}
      </span>
      {selected && <DrawnCheck />}
    </motion.button>
  );
}

export function SingleOptionList({ q, answers, pressedIndex, onSelect }: {
  q: SingleQuestion;
  answers: AnswerRecord;
  pressedIndex: number | null;
  onSelect: (q: SingleQuestion, value: number) => void;
}) {
  const selected = typeof answers[q.id] === "number" ? (answers[q.id] as number) : undefined;
  return (
    <motion.div
      className="flex flex-col gap-2.5"
      role="group"
      aria-label={`Opções para: ${q.text}`}
      variants={staggerChildren(0.035, 0.06)}
      initial="hidden"
      animate="visible"
    >
      {q.options.map((opt, i) => (
        <OptionRow
          key={opt.value}
          displayIndex={i + 1}
          label={opt.label}
          note={opt.note}
          selected={selected === opt.value}
          pressed={pressedIndex === i}
          onClick={() => onSelect(q, opt.value)}
        />
      ))}
    </motion.div>
  );
}

export function MultiOptionList({ q, answers, pressedIndex, onToggle }: {
  q: MultiQuestion;
  answers: AnswerRecord;
  pressedIndex: number | null;
  onToggle: (q: MultiQuestion, value: number, isNone: boolean) => void;
}) {
  const selected = Array.isArray(answers[q.id]) ? (answers[q.id] as number[]) : [];
  return (
    <motion.div
      className="flex flex-col gap-2.5"
      role="group"
      aria-label={`Opções para: ${q.text}`}
      variants={staggerChildren(0.035, 0.06)}
      initial="hidden"
      animate="visible"
    >
      {q.options.map((opt, i) => (
        <OptionRow
          key={opt.value}
          displayIndex={i + 1}
          label={opt.label}
          note={opt.note}
          selected={selected.includes(opt.value)}
          pressed={pressedIndex === i}
          onClick={() => onToggle(q, opt.value, !!opt.isNone)}
        />
      ))}
      <p className="mt-1 text-[11.5px] text-[var(--text-p)]">Selecione todas que se aplicam.</p>
    </motion.div>
  );
}
