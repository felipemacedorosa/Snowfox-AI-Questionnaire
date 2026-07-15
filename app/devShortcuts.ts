// DEV-ONLY TEST SHORTCUT — safe to delete.
// Generates an answer set that scores the best option on every question
// except a couple of intentionally weak sub-answers inside Estratégia, so we
// can eyeball the results page for a "near-perfect score, one soft spot"
// scenario. Used from app/page.tsx via ?debug=strategy-gap.
//
// To remove this test shortcut: delete this file, then remove the
// "DEV SHORTCUT" block in app/page.tsx that imports from it.

import { AnswerRecord, isQuestionVisible, Question, SECTIONS } from "./data";

// Both of these are scored under Estratégia itself (unlike est_q3a, whose
// points are counted under Governança via scorePillar) — so this reliably
// lands the Estratégia pillar around ~90% while every other pillar stays maxed.
const STRATEGY_WEAK_OVERRIDES: AnswerRecord = {
  est_q3: 4, // "Regularmente" patrocinado, one notch below the max
  est_q1a1a: 1, // Roadmap "Nunca" é revisado
};

function bestAnswerFor(q: Question): number | number[] | string {
  if (q.type === "single") {
    return q.options.reduce((best, o) => (o.score > best.score ? o : best)).value;
  }
  if (q.type === "multi") {
    return q.options.filter(o => !o.isNone).map(o => o.value);
  }
  return "Resposta de teste (dados de exemplo).";
}

export function buildStrategyGapTestAnswers(): AnswerRecord {
  const answers: AnswerRecord = {};
  // Multiple passes: answering a question can reveal dependent (showIf) ones.
  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (const section of SECTIONS) {
      for (const q of section.questions) {
        if (q.id in answers) continue;
        if (!isQuestionVisible(q, section.questions, answers)) continue;
        answers[q.id] = STRATEGY_WEAK_OVERRIDES[q.id] ?? bestAnswerFor(q);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return answers;
}
