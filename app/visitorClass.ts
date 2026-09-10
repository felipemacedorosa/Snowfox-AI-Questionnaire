/**
 * Whether a visit produced verified human interaction.
 *
 * Much of the traffic reaching this assessment never touches it: it loads, runs
 * the JavaScript, and leaves. Those visits report page views and foreground
 * time exactly like a respondent does, so they inflate every engagement figure
 * the funnel is read through.
 *
 * This module separates the two populations by asking one question the page can
 * actually answer: did a genuine gesture reach it, and did the visit last long
 * enough to mean something. The verdict rides along as an event parameter, so
 * the funnel stays a single funnel and Analytics can filter it either way.
 *
 * The negative verdict is `unverified`, never `bot`, and the distinction is the
 * whole point. `isTrusted` rejects a script-dispatched click, but automation
 * driven through the devtools protocol injects input at the browser level and
 * produces trusted events, so a quiet visit is not proof of a machine. It is
 * equally the shape of a person who landed, read nothing, and left.
 *
 * Like the rest of the analytics modules, this one is free of React and
 * Firebase, and nothing here identifies a respondent: the verdict describes
 * behaviour, never a person.
 */

import { FIRST_HEARTBEAT_DELAY_MS } from "./assessmentTiming";

/**
 * The parameter every custom event carries.
 *
 * Deliberately not `traffic_type`, which Analytics reserves for its own
 * internal-traffic data filters.
 */
export const VISITOR_PARAM = "visitor_type";

/** A trusted gesture and the minimum dwell were both observed. */
export const VISITOR_HUMAN = "human";

/** Neither verified human nor proven machine: nothing has been demonstrated. */
export const VISITOR_UNVERIFIED = "unverified";

export type VisitorClass = typeof VISITOR_HUMAN | typeof VISITOR_UNVERIFIED;

/**
 * How long a visit must last before a gesture counts.
 *
 * Reused rather than reinvented: this is Analytics' own engaged-session
 * threshold and the moment the first heartbeat reports, so the verdict and the
 * metric it qualifies share one definition of "long enough to matter".
 */
export const MIN_HUMAN_DWELL_MS = FIRST_HEARTBEAT_DELAY_MS;

/**
 * Where an unverified visit's foreground time is reported.
 *
 * Analytics builds average engagement time and engaged sessions from
 * `engagement_time_msec` alone, and no label can remove a value from those
 * built-in metrics after the fact. Reporting unverified time under a name of
 * our own keeps the figure countable without letting it move the headline.
 */
export const UNVERIFIED_ENGAGEMENT_PARAM = "unverified_engagement_msec";

export interface VisitorSignals {
  /** A DOM event with `isTrusted` set has reached the page this load. */
  interacted: boolean;
  /** Foreground milliseconds accrued so far, from the assessment clock. */
  activeMs: number;
  /** An earlier load already verified this browser. Once true, never false. */
  verified: boolean;
}

/**
 * Decide what a visit has demonstrated.
 *
 * Stickiness lives here rather than in the caller, so the rule that a verified
 * visitor never reverts is a property of the function and can be tested.
 */
export function classifyVisitor(signals: VisitorSignals): VisitorClass {
  if (signals.verified) return VISITOR_HUMAN;
  if (!signals.interacted) return VISITOR_UNVERIFIED;
  if (!Number.isFinite(signals.activeMs) || signals.activeMs < MIN_HUMAN_DWELL_MS) {
    return VISITOR_UNVERIFIED;
  }
  return VISITOR_HUMAN;
}

export function isHuman(visitor: VisitorClass): boolean {
  return visitor === VISITOR_HUMAN;
}

/**
 * The label carried by every custom event.
 *
 * Unlike the attribution parameters, which are omitted when empty, this one is
 * always present: an absent parameter reads as "(not set)" and is
 * indistinguishable from a dimension nobody registered.
 */
export function toVisitorParams(visitor: VisitorClass): Record<string, string> {
  return { [VISITOR_PARAM]: visitor };
}

/**
 * Route a heartbeat's engagement delta by what the visit has demonstrated.
 *
 * The time is always reported. Only its name changes, so an unverified visit
 * stays visible and countable while the property's built-in engagement metrics
 * describe verified humans alone.
 */
export function toEngagementParams(visitor: VisitorClass, deltaMs: number): Record<string, number> {
  return isHuman(visitor)
    ? { engagement_time_msec: deltaMs }
    : { [UNVERIFIED_ENGAGEMENT_PARAM]: deltaMs };
}

/**
 * Event announcing that a visit demonstrated human interaction.
 *
 * `visitor_type` answers the same question with more precision, but only in
 * GA4 and only after someone registers it as a custom dimension: an
 * unregistered event parameter is collected and then hidden, and the Firebase
 * console cannot break an event down by parameter at all. An event *name*
 * needs no registration and lists itself in both consoles, so the human share
 * stays readable beside `first_visit` with no reporting setup at all.
 *
 * This duplicates the parameter rather than replacing it. The parameter is
 * what slices the funnel; this only counts.
 */
export const VISIT_VERIFIED_EVENT = "visit_verified";

/**
 * Whether this page load should announce its verification.
 *
 * Once per load rather than once per browser. Both consoles report unique
 * users per event, so a returning visitor re-announcing costs nothing in the
 * figure this event exists to produce, while a resumed draft that opens
 * already verified is still counted instead of silently missing.
 */
export function shouldReportVerification(
  visitor: VisitorClass,
  alreadyReported: boolean
): boolean {
  return !alreadyReported && isHuman(visitor);
}

/** Verification remembered across reloads, so a resumed draft stays verified. */
export const VISITOR_STORAGE_KEY = "snowfox-ai-visitor-v1";

/**
 * Recover a stored verification, treating anything malformed as unverified.
 *
 * Only the positive is ever stored, so a missing or unreadable value already
 * means unverified and there is no negative for a bad write to install.
 */
export function parseVisitorClass(value: unknown): VisitorClass {
  if (typeof value !== "object" || value === null) return VISITOR_UNVERIFIED;
  return (value as Record<string, unknown>).verified === true ? VISITOR_HUMAN : VISITOR_UNVERIFIED;
}

export function readVisitorClass(): VisitorClass {
  try {
    const raw = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    return raw ? parseVisitorClass(JSON.parse(raw)) : VISITOR_UNVERIFIED;
  } catch {
    return VISITOR_UNVERIFIED;
  }
}

export function persistVisitorVerified(): void {
  try {
    window.localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify({ verified: true }));
  } catch {
    // The verdict still holds for this load; only cross-reload recall is lost.
  }
}

/**
 * Forget the verification.
 *
 * Kept for parity with the other analytics modules and for clearing a browser
 * by hand. Restarting the assessment deliberately does not call it: the click
 * that restarts is itself a human gesture, so discarding the proof at that
 * moment would be perverse.
 */
export function clearVisitorClass(): void {
  try {
    window.localStorage.removeItem(VISITOR_STORAGE_KEY);
  } catch {
    // Nothing to do: the verdict is best-effort in both directions.
  }
}

/**
 * The gestures that mean a person acted on this page.
 *
 * `pointerdown` covers mouse, touch, and pen in a single listener, and
 * `keydown` covers a respondent working the form from the keyboard.
 *
 * `scroll` is deliberately absent. The engine dispatches it as trusted even
 * when script caused it, and this assessment scrolls itself to the top on every
 * section change, so including it would verify visits nobody ever touched.
 */
export const TRUSTED_INTERACTION_EVENTS = ["pointerdown", "keydown"] as const;

/**
 * Call `onTrusted` once, the first time a genuine gesture reaches the page.
 *
 * Capturing on the window runs ahead of React's delegation and any component
 * that stops propagation, so nothing downstream can hide the signal. The
 * listeners are passive, so instrumentation can never delay input handling, and
 * they detach after the first qualifying event: the verdict is sticky, so a
 * second gesture carries no further information.
 *
 * Returns a teardown for a visit that ends before any gesture arrives.
 */
export function observeTrustedInteraction(onTrusted: () => void): () => void {
  const options = { passive: true, capture: true } as const;
  let done = false;
  const handle = (event: Event) => {
    if (done || !event.isTrusted) return;
    done = true;
    detach();
    onTrusted();
  };
  const detach = () => {
    for (const name of TRUSTED_INTERACTION_EVENTS) {
      window.removeEventListener(name, handle, options);
    }
  };
  for (const name of TRUSTED_INTERACTION_EVENTS) {
    window.addEventListener(name, handle, options);
  }
  return detach;
}
