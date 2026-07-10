import { ALL_QUESTIONS, PILLAR_CONFIG, SECTIONS } from "@/app/data";

/** Derived from the questionnaire data — never hardcode counts in copy. */
export const SCORED_QUESTION_COUNT = ALL_QUESTIONS.filter(q => q.type !== "text").length;
export const PILLAR_COUNT = PILLAR_CONFIG.length;
export const ROADMAP_QUARTERS = 3;
export const AVG_MINUTES = 10;

/** Short pillar names for chart labels (layout abbreviation, not copy change). */
export const PILLAR_SHORT: Record<string, string> = {
  dados: "Dados",
  estrategia: "Estratégia",
  pessoas: "Pessoas",
  governanca: "Governança",
  tecnologia: "Tecnologia",
};

export function questionCountFor(sectionId: string): number {
  const section = SECTIONS.find(s => s.id === sectionId);
  return section ? section.questions.filter(q => q.type !== "text").length : 0;
}
