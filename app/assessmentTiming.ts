/**
 * Active time spent on the AI readiness assessment.
 *
 * Google Analytics measures engagement as a delta: it banks foreground time and
 * attaches it to the *next* event a page sends. This assessment is a single
 * page that reports `page_view` and `assessment_view` milliseconds apart and
 * then stays silent for the whole questionnaire, so there is no later event to
 * carry the time and GA4 books a twenty-minute session as a few milliseconds.
 *
 * This module keeps its own clock instead of trusting that. `app/page.tsx` tells
 * it when the page becomes visible or hidden, it banks the foreground stretches,
 * and the reported figure is ours rather than a by-product of event timing.
 *
 * Like `app/analyticsFunnel.ts`, it is free of React and Firebase so the
 * arithmetic stays pure and testable, and no respondent identity reaches it.
 */

/** How often the page reports accumulated time while it is visible. */
export const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Longest single stretch that may be banked at once.
 *
 * The page banks time on every heartbeat, so a visible stretch should never
 * exceed the interval by much. A far longer one means the clock jumped -- a
 * suspended laptop, a throttled background timer -- and counting it would
 * inflate the figure with time nobody spent reading.
 */
export const MAX_STRETCH_MS = HEARTBEAT_INTERVAL_MS * 2;

/**
 * Active time after which heartbeats stop.
 *
 * A report left open in a forgotten tab must not emit events indefinitely.
 * Beyond this the measurement is no longer interesting anyway.
 */
export const MAX_TRACKED_MS = 30 * 60 * 1000;

/** Timing remembered across reloads, so resuming a draft continues the clock. */
export const TIMING_STORAGE_KEY = "snowfox-ai-timing-v1";

export const HEARTBEAT_EVENT = "assessment_heartbeat";

export interface TimingState {
  /** Foreground milliseconds already banked. */
  activeMs: number;
  /** When the current foreground stretch began, or `null` while hidden. */
  since: number | null;
}

export const IDLE_TIMING: TimingState = Object.freeze({ activeMs: 0, since: null });

/**
 * Length of the stretch running at `now`, clamped.
 *
 * A negative delta means the clock moved backwards; both that and an
 * implausibly long stretch contribute nothing rather than a wrong number.
 */
function stretchMs(state: TimingState, now: number): number {
  if (state.since === null) return 0;
  const elapsed = now - state.since;
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0;
  return Math.min(elapsed, MAX_STRETCH_MS);
}

/** Total active time as of `now`, including a stretch still running. */
export function activeMs(state: TimingState, now: number): number {
  return state.activeMs + stretchMs(state, now);
}

/** Whole active seconds, which is the unit the funnel reports. */
export function activeSeconds(state: TimingState, now: number): number {
  return Math.round(activeMs(state, now) / 1000);
}

/** Begin a foreground stretch. Starting an already-running clock changes nothing. */
export function startStretch(state: TimingState, now: number): TimingState {
  if (state.since !== null) return state;
  return { activeMs: state.activeMs, since: now };
}

/** Bank the running stretch and stop the clock. */
export function stopStretch(state: TimingState, now: number): TimingState {
  if (state.since === null) return state;
  return { activeMs: state.activeMs + stretchMs(state, now), since: null };
}

/**
 * Bank the running stretch without stopping the clock.
 *
 * Called on every heartbeat, which is what keeps a single stretch short enough
 * that `MAX_STRETCH_MS` only ever trims a genuine clock jump.
 */
export function bankStretch(state: TimingState, now: number): TimingState {
  if (state.since === null) return state;
  return { activeMs: state.activeMs + stretchMs(state, now), since: now };
}

/** True once the clock has run past the point where heartbeats stop. */
export function exhausted(state: TimingState, now: number): boolean {
  return activeMs(state, now) >= MAX_TRACKED_MS;
}

/**
 * Recover stored timing, discarding anything malformed.
 *
 * `since` is deliberately dropped: it belongs to a page that is no longer open,
 * and a stretch left running by a closed tab would otherwise bank the time the
 * respondent spent away.
 */
export function parseTimingState(value: unknown): TimingState {
  if (typeof value !== "object" || value === null) return { ...IDLE_TIMING };
  const stored = (value as Record<string, unknown>).activeMs;
  if (typeof stored !== "number" || !Number.isFinite(stored) || stored < 0) return { ...IDLE_TIMING };
  return { activeMs: Math.min(stored, MAX_TRACKED_MS), since: null };
}

export function readTimingState(): TimingState {
  try {
    const raw = window.localStorage.getItem(TIMING_STORAGE_KEY);
    return raw ? parseTimingState(JSON.parse(raw)) : { ...IDLE_TIMING };
  } catch {
    return { ...IDLE_TIMING };
  }
}

export function persistTimingState(state: TimingState): void {
  try {
    window.localStorage.setItem(TIMING_STORAGE_KEY, JSON.stringify({ activeMs: state.activeMs }));
  } catch {
    // The clock keeps running for this load; only cross-reload recall is lost.
  }
}

/** Forget the clock so a restarted assessment is timed from zero. */
export function clearTimingState(): void {
  try {
    window.localStorage.removeItem(TIMING_STORAGE_KEY);
  } catch {
    // Ignored for the same reason as persistTimingState.
  }
}
