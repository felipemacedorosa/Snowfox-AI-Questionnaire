import { describe, expect, it } from "vitest";
import {
  IDLE_TIMING,
  MAX_STRETCH_MS,
  MAX_TRACKED_MS,
  activeMs,
  activeSeconds,
  bankStretch,
  engagementDeltaMs,
  exhausted,
  parseTimingState,
  startStretch,
  stopStretch,
  type TimingState,
} from "./assessmentTiming";

const T0 = 1_700_000_000_000;

describe("foreground stretches", () => {
  it("counts nothing before the page becomes visible", () => {
    expect(activeMs(IDLE_TIMING, T0)).toBe(0);
    expect(activeSeconds(IDLE_TIMING, T0)).toBe(0);
  });

  it("counts a stretch that is still running", () => {
    const running = startStretch(IDLE_TIMING, T0);
    expect(activeMs(running, T0 + 8_000)).toBe(8_000);
    expect(activeSeconds(running, T0 + 8_000)).toBe(8);
  });

  it("banks a stretch when the page is hidden and stops counting", () => {
    const hidden = stopStretch(startStretch(IDLE_TIMING, T0), T0 + 5_000);
    expect(hidden.since).toBeNull();
    // An hour in a background tab adds nothing.
    expect(activeMs(hidden, T0 + 3_600_000)).toBe(5_000);
  });

  it("resumes on the next visible stretch without losing banked time", () => {
    const hidden = stopStretch(startStretch(IDLE_TIMING, T0), T0 + 5_000);
    const resumed = startStretch(hidden, T0 + 100_000);
    expect(activeMs(resumed, T0 + 107_000)).toBe(12_000);
  });

  it("ignores a second start on an already-running clock", () => {
    const running = startStretch(IDLE_TIMING, T0);
    expect(startStretch(running, T0 + 9_000)).toBe(running);
  });

  it("is a no-op to stop or bank a clock that is not running", () => {
    expect(stopStretch(IDLE_TIMING, T0)).toBe(IDLE_TIMING);
    expect(bankStretch(IDLE_TIMING, T0)).toBe(IDLE_TIMING);
  });
});

describe("banking on heartbeat", () => {
  it("keeps the total unchanged while restarting the stretch", () => {
    const banked = bankStretch(startStretch(IDLE_TIMING, T0), T0 + 30_000);
    expect(banked.activeMs).toBe(30_000);
    expect(banked.since).toBe(T0 + 30_000);
    expect(activeMs(banked, T0 + 45_000)).toBe(45_000);
  });
});

describe("clock jumps", () => {
  it("refuses to bank a stretch longer than a suspended machine could earn", () => {
    const running = startStretch(IDLE_TIMING, T0);
    // Laptop asleep for two hours with the tab still nominally visible.
    expect(activeMs(running, T0 + 7_200_000)).toBe(MAX_STRETCH_MS);
  });

  it("contributes nothing when the clock moves backwards", () => {
    const running = startStretch(IDLE_TIMING, T0);
    expect(activeMs(running, T0 - 10_000)).toBe(0);
  });
});

describe("heartbeat exhaustion", () => {
  it("stops once the tracked ceiling is reached", () => {
    const long: TimingState = { activeMs: MAX_TRACKED_MS - 1, since: null };
    expect(exhausted(long, T0)).toBe(false);
    expect(exhausted({ activeMs: MAX_TRACKED_MS, since: null }, T0)).toBe(true);
  });
});

describe("parseTimingState", () => {
  it("recovers banked time and never a running stretch", () => {
    // `since` belongs to a page that is already closed: counting it would bank
    // the time the respondent spent away from the assessment entirely.
    expect(parseTimingState({ activeMs: 42_000, since: T0 })).toEqual({ activeMs: 42_000, since: null });
  });

  it("discards malformed storage", () => {
    for (const bad of [null, "42", 42, [], { activeMs: "42" }, { activeMs: -1 }, { activeMs: NaN }, {}]) {
      expect(parseTimingState(bad)).toEqual({ activeMs: 0, since: null });
    }
  });

  it("clamps a stored total past the ceiling", () => {
    expect(parseTimingState({ activeMs: MAX_TRACKED_MS * 10 }).activeMs).toBe(MAX_TRACKED_MS);
  });
});

describe("engagement reported to Analytics", () => {
  it("reports the stretch since the last beat, not the running total", () => {
    expect(engagementDeltaMs(30_000, 0)).toBe(30_000);
    expect(engagementDeltaMs(60_000, 30_000)).toBe(30_000);
    expect(engagementDeltaMs(90_000, 60_000)).toBe(30_000);
  });

  it("reports nothing when no time has passed since the last beat", () => {
    expect(engagementDeltaMs(30_000, 30_000)).toBe(0);
  });

  it("never reports negative engagement if the clock moves backwards", () => {
    expect(engagementDeltaMs(10_000, 30_000)).toBe(0);
    expect(engagementDeltaMs(Number.NaN, 0)).toBe(0);
  });

  it("skips time banked by an earlier load when a draft resumes", () => {
    // A previous visit banked two minutes; this load has added ten seconds.
    expect(engagementDeltaMs(130_000, 120_000)).toBe(10_000);
  });
});
