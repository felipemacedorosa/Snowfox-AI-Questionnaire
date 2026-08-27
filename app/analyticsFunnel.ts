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

/**
 * Name of the per-section drop-off event.
 *
 * The coarse funnel above jumps from the first question to the halfway mark to
 * the last one, which cannot say *where* an abandoned assessment stopped. One
 * event per completed section narrows that to a named stretch of the
 * questionnaire while keeping at most five extra events per attempt.
 */
export const SECTION_COMPLETED_EVENT = "section_completed";

/** Key for the section event, qualified so each section is remembered separately. */
export type SectionMilestoneKey = `${typeof SECTION_COMPLETED_EVENT}:${string}`;

/**
 * Anything the fired set can hold.
 *
 * A plain `FunnelEvent` is both the key and the event name. A section key adds
 * the section id after a colon, because "completed a section" is reached five
 * times per attempt and each one has to be remembered on its own.
 */
export type MilestoneKey = FunnelEvent | SectionMilestoneKey;

export function sectionMilestoneKey(sectionId: string): SectionMilestoneKey {
  return `${SECTION_COMPLETED_EVENT}:${sectionId}`;
}

/** The section a key belongs to, or `null` for the coarse funnel events. */
export function parseSectionMilestoneKey(key: string): string | null {
  const prefix = `${SECTION_COMPLETED_EVENT}:`;
  if (!key.startsWith(prefix)) return null;
  const sectionId = key.slice(prefix.length);
  return sectionId === "" || sectionId.includes(":") ? null : sectionId;
}

/** The Analytics event name to report a key under. */
export function milestoneEventName(key: MilestoneKey): string {
  return parseSectionMilestoneKey(key) === null ? key : SECTION_COMPLETED_EVENT;
}

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
  /**
   * Ids of the sections whose every visible question is resolved.
   *
   * Ids rather than a count, so a section that becomes complete out of order --
   * a respondent may jump back and fill a gap -- is still credited to itself.
   */
  completedSectionIds: string[];
  /** The contact-information gate is the screen currently on display. */
  onContactForm: boolean;
  /** The personalized report itself is on display. */
  resultsVisible: boolean;
}

/**
 * Every milestone the given state has reached: the coarse funnel in funnel
 * order, then one key per completed section in section order.
 *
 * Sections trail the coarse events rather than interleaving with them because a
 * section can complete at any point on the progress curve. Each key is reported
 * as its own Analytics event, so this order only decides the sequence of a
 * single flush.
 *
 * `assessment_view` and `contact_info_submitted` are absent by design: they are
 * moments in time rather than properties of the current state, so their callers
 * report them directly.
 */
export function reachedMilestones(state: AssessmentFunnelState): MilestoneKey[] {
  const reached: MilestoneKey[] = [];
  if (state.answered >= 1) reached.push("first_question_completed");
  if (state.percent >= HALFWAY_PERCENT) reached.push("assessment_halfway");
  if (state.complete) reached.push("last_question_completed");
  if (state.onContactForm) reached.push("contact_form_view");
  if (state.resultsVisible) reached.push("results_viewed");
  for (const sectionId of state.completedSectionIds) {
    if (sectionId !== "" && !sectionId.includes(":")) reached.push(sectionMilestoneKey(sectionId));
  }
  return reached;
}

/** Milestones the state has reached that have not been reported yet. */
export function pendingMilestones(
  state: AssessmentFunnelState,
  fired: Iterable<MilestoneKey>
): MilestoneKey[] {
  const already = new Set<string>(fired);
  return reachedMilestones(state).filter(key => !already.has(key));
}

/**
 * Recover a stored milestone list, discarding anything unrecognized.
 *
 * Section keys are accepted on shape alone rather than checked against the
 * current questionnaire, so this module stays independent of `app/data.ts`.
 * A key left behind by a renamed section is inert: nothing reaches it again.
 */
export function parseFiredMilestones(value: unknown): MilestoneKey[] {
  if (!Array.isArray(value)) return [];
  const known = new Set<string>(FUNNEL_EVENTS);
  const seenEvents = new Set<FunnelEvent>();
  const seenSections = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    if (known.has(entry)) {
      seenEvents.add(entry as FunnelEvent);
      continue;
    }
    const sectionId = parseSectionMilestoneKey(entry);
    if (sectionId !== null) seenSections.add(sectionId);
  }
  return [
    ...FUNNEL_EVENTS.filter(event => seenEvents.has(event)),
    ...[...seenSections].map(sectionMilestoneKey),
  ];
}

/**
 * Milestones already reported for this assessment attempt.
 *
 * A browser that refuses local storage simply reports milestones again on the
 * next load; that is a measurement imprecision, never an error.
 */
export function readFiredMilestones(): MilestoneKey[] {
  try {
    const raw = window.localStorage.getItem(FUNNEL_STORAGE_KEY);
    return raw ? parseFiredMilestones(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function persistFiredMilestones(events: Iterable<MilestoneKey>): void {
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
