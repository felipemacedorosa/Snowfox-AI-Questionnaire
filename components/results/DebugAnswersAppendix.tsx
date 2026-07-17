/**
 * TESTING FEATURE — not part of the real report. Safe to delete.
 *
 * Dumps every answer the user submitted as a plain-text appendix at the
 * bottom of the exported PDF (print-only, never shown on screen).
 *
 * To remove this feature:
 *   1. Delete this file.
 *   2. In components/results/ResultsScreen.tsx, remove the
 *      `DebugAnswersAppendix` import and its <DebugAnswersAppendix /> usage.
 *   3. In app/globals.css, remove the "DEBUG ANSWERS APPENDIX" rule block.
 */
import { AnswerRecord, getAllQuestions, LocalizedQuestion } from "@/app/data";
import { useLanguage } from "@/app/LanguageContext";

function formatAnswer(q: LocalizedQuestion, value: AnswerRecord[string] | undefined): string | null {
  if (value === undefined || value === null) return null;

  if (q.type === "text") {
    const text = typeof value === "string" ? value.trim() : "";
    return text.length > 0 ? text : null;
  }

  if (q.type === "single") {
    const opt = q.options.find(o => o.value === value);
    return opt ? opt.label : null;
  }

  if (q.type === "multi") {
    const values = Array.isArray(value) ? value : [];
    const labels = q.options.filter(o => values.includes(o.value)).map(o => o.label);
    return labels.length > 0 ? labels.join(", ") : null;
  }

  return null;
}

export function DebugAnswersAppendix({ answers }: { answers: AnswerRecord }) {
  const { lang, t } = useLanguage();
  const rows = getAllQuestions(lang)
    .map(q => ({ q, answer: formatAnswer(q, answers[q.id]) }))
    .filter((row): row is { q: LocalizedQuestion; answer: string } => row.answer !== null);

  if (rows.length === 0) return null;

  return (
    <section className="report-section debug-answers-appendix print-only">
      <div className="report-section-heading">
        <div>
          <span className="report-section-number">DEBUG</span>
          <h2>{t.debug.heading}</h2>
        </div>
      </div>
      <p className="report-section-intro">
        {t.debug.intro}
      </p>
      <dl className="debug-answers-list">
        {rows.map(({ q, answer }) => (
          <div key={q.id} className="debug-answers-row">
            <dt>{q.id}: {q.text}</dt>
            <dd>{answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
