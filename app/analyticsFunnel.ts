/**
 * Drop-off funnel for the AI readiness assessment.
 *
 * The module is deliberately free of React and Firebase so the milestone rules
 * stay pure and testable. `app/page.tsx` owns the state, this decides which
 * milestones that state has reached, and `app/firebaseAnalytics.ts` reports
 * them.
 *
 * No respondent identity ever reaches this module.
 */

export const FUNNEL_EVENTS = [
  "assessment_view",
  "first_question_completed",
  "assessment_halfway",
  "last_question_completed",
  "contact_form_view",
  "contact_info_submitted",
  "results_viewed",
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

/** Share of the questionnaire that counts as the halfway milestone. */
export const HALFWAY_PERCENT = 50;

/** Milestones remembered across reloads, so resuming a draft cannot recount them. */
export const FUNNEL_STORAGE_KEY = "snowfox-ai-analytics-funnel-v1";

/**
 * The parts of the assessment that milestones are derived from.
 *
 * `answered`, `percent`, and `complete` come straight from
 * `getAssessmentProgress()`, so the funnel measures the same progress the
 * respondent sees in the UI, including questions skipped by branching.
 */
export interface AssessmentFunnelState {
  /** Questions resolved so far: answered outright or skipped by branching. */
  answered: number;
  /** Completion percentage, 0-100. */
  percent: number;
  /** Every question in every section is resolved. */
  complete: boolean;
  /** The contact-information gate is the screen currently on display. */
  onContactForm: boolean;
  /** The personalized report itself is on display. */
  resultsVisible: boolean;
}

/**
 * Every milestone the given state has reached, in funnel order.
 *
 * `assessment_view` and `contact_info_submitted` are absent by design: they are
 * moments in time rather than properties of the current state, so their callers
 * report them directly.
 */
export function reachedMilestones(state: AssessmentFunnelState): FunnelEvent[] {
  const reached: FunnelEvent[] = [];
  if (state.answered >= 1) reached.push("first_question_completed");
  if (state.percent >= HALFWAY_PERCENT) reached.push("assessment_halfway");
  if (state.complete) reached.push("last_question_completed");
  if (state.onContactForm) reached.push("contact_form_view");
  if (state.resultsVisible) reached.push("results_viewed");
  return reached;
}

/** Milestones the state has reached that have not been reported yet. */
export function pendingMilestones(
  state: AssessmentFunnelState,
  fired: Iterable<FunnelEvent>
): FunnelEvent[] {
  const already = new Set(fired);
  return reachedMilestones(state).filter(event => !already.has(event));
}

/** Recover a stored milestone list, discarding anything unrecognized. */
export function parseFiredMilestones(value: unknown): FunnelEvent[] {
  if (!Array.isArray(value)) return [];
  const known = new Set<string>(FUNNEL_EVENTS);
  const seen = new Set<FunnelEvent>();
  for (const entry of value) {
    if (typeof entry === "string" && known.has(entry)) seen.add(entry as FunnelEvent);
  }
  return FUNNEL_EVENTS.filter(event => seen.has(event));
}

/**
 * Milestones already reported for this assessment attempt.
 *
 * A browser that refuses local storage simply reports milestones again on the
 * next load; that is a measurement imprecision, never an error.
 */
export function readFiredMilestones(): FunnelEvent[] {
  try {
    const raw = window.localStorage.getItem(FUNNEL_STORAGE_KEY);
    return raw ? parseFiredMilestones(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function persistFiredMilestones(events: Iterable<FunnelEvent>): void {
  try {
    window.localStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify([...events]));
  } catch {
    // Nothing to recover: the funnel keeps working from memory for this load.
  }
}

/** Forget the attempt so a restarted assessment enters the funnel again. */
export function clearFiredMilestones(): void {
  try {
    window.localStorage.removeItem(FUNNEL_STORAGE_KEY);
  } catch {
    // Ignored for the same reason as persistFiredMilestones.
  }
}
