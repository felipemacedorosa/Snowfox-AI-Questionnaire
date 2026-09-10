import { describe, expect, it } from "vitest";
import { FIRST_HEARTBEAT_DELAY_MS } from "./assessmentTiming";
import {
  MIN_HUMAN_DWELL_MS,
  TRUSTED_INTERACTION_EVENTS,
  UNVERIFIED_ENGAGEMENT_PARAM,
  VISIT_VERIFIED_EVENT,
  VISITOR_HUMAN,
  VISITOR_PARAM,
  VISITOR_UNVERIFIED,
  classifyVisitor,
  isHuman,
  parseVisitorClass,
  shouldReportVerification,
  toEngagementParams,
  toVisitorParams,
  type VisitorSignals,
} from "./visitorClass";

const QUIET: VisitorSignals = { interacted: false, activeMs: 0, verified: false };

describe("classifyVisitor", () => {
  it("leaves a long visit that never touched the page unverified", () => {
    // The shape the client is trying to separate out: loads, sits, leaves.
    expect(classifyVisitor({ ...QUIET, activeMs: 600_000 })).toBe(VISITOR_UNVERIFIED);
  });

  it("refuses a gesture that arrives before the minimum dwell", () => {
    expect(classifyVisitor({ interacted: true, activeMs: MIN_HUMAN_DWELL_MS - 1, verified: false }))
      .toBe(VISITOR_UNVERIFIED);
  });

  it("verifies a visitor who both acted and stayed", () => {
    // Inclusive at the boundary, so a visit sitting exactly on the engaged
    // threshold is counted rather than lost.
    expect(classifyVisitor({ interacted: true, activeMs: MIN_HUMAN_DWELL_MS, verified: false }))
      .toBe(VISITOR_HUMAN);
  });

  it("stays human on a later load that has produced no gesture yet", () => {
    // Stickiness: a resumed draft opens already verified, which is why
    // assessment_view can report `human` before anyone has clicked anything.
    expect(classifyVisitor({ interacted: false, activeMs: 0, verified: true })).toBe(VISITOR_HUMAN);
  });

  it("treats a broken clock as unverified rather than guessing", () => {
    for (const activeMs of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      expect(classifyVisitor({ interacted: true, activeMs, verified: false })).toBe(VISITOR_UNVERIFIED);
    }
  });

  it("uses the engaged-session threshold as the dwell", () => {
    // Pinned so the two constants cannot drift apart unnoticed: the verdict and
    // the first heartbeat must agree on what "long enough" means.
    expect(MIN_HUMAN_DWELL_MS).toBe(FIRST_HEARTBEAT_DELAY_MS);
  });

  it("reads the verdict back", () => {
    expect(isHuman(VISITOR_HUMAN)).toBe(true);
    expect(isHuman(VISITOR_UNVERIFIED)).toBe(false);
  });
});

describe("toVisitorParams", () => {
  it("labels an event with the verdict it was sent under", () => {
    expect(toVisitorParams(VISITOR_HUMAN)).toEqual({ [VISITOR_PARAM]: "human" });
    expect(toVisitorParams(VISITOR_UNVERIFIED)).toEqual({ [VISITOR_PARAM]: "unverified" });
  });

  it("never omits the parameter, unlike attribution", () => {
    // An omitted parameter reads as "(not set)" and cannot be told apart from a
    // dimension nobody registered, so an unverified visit must say so outright.
    expect(Object.keys(toVisitorParams(VISITOR_UNVERIFIED))).toHaveLength(1);
    expect(Object.keys(toVisitorParams(VISITOR_HUMAN))).toHaveLength(1);
  });
});

describe("toEngagementParams", () => {
  it("reports a verified human's time where the built-in metrics read it", () => {
    expect(toEngagementParams(VISITOR_HUMAN, 30_000)).toEqual({ engagement_time_msec: 30_000 });
  });

  it("keeps unverified time out of the built-in engagement metrics", () => {
    // The assertion the whole change exists for.
    const params = toEngagementParams(VISITOR_UNVERIFIED, 30_000);
    expect(params).toEqual({ [UNVERIFIED_ENGAGEMENT_PARAM]: 30_000 });
    expect(params).not.toHaveProperty("engagement_time_msec");
  });

  it("still reports the time, so nothing becomes invisible", () => {
    expect(Object.values(toEngagementParams(VISITOR_UNVERIFIED, 30_000))).toEqual([30_000]);
  });

  it("reports a zero delta rather than dropping the parameter", () => {
    expect(toEngagementParams(VISITOR_HUMAN, 0)).toEqual({ engagement_time_msec: 0 });
  });
});

describe("parseVisitorClass", () => {
  it("recovers a stored verification", () => {
    expect(parseVisitorClass({ verified: true })).toBe(VISITOR_HUMAN);
  });

  it("discards malformed storage", () => {
    const malformed = [null, undefined, "human", 1, true, [], {}, { verified: "yes" }, { verified: 1 }, { verified: false }];
    for (const value of malformed) {
      expect(parseVisitorClass(value)).toBe(VISITOR_UNVERIFIED);
    }
  });

  it("round-trips what a verified browser stores", () => {
    expect(parseVisitorClass(JSON.parse(JSON.stringify({ verified: true })))).toBe(VISITOR_HUMAN);
  });
});

describe("trusted interaction events", () => {
  it("excludes scroll, which the assessment fires at itself", () => {
    // app/page.tsx scrolls to the top on every screen and section change, and
    // the engine marks a programmatic scroll trusted, so listening for it would
    // verify visits nobody ever touched.
    expect(TRUSTED_INTERACTION_EVENTS).not.toContain("scroll");
  });

  it("covers mouse, touch, pen and keyboard with two listeners", () => {
    expect(TRUSTED_INTERACTION_EVENTS).toEqual(["pointerdown", "keydown"]);
  });
});

describe("shouldReportVerification", () => {
  it("announces a verified visit that has not announced yet", () => {
    expect(shouldReportVerification(VISITOR_HUMAN, false)).toBe(true);
  });

  it("announces only once per load", () => {
    // The event counts visits, not beats. Firing on every heartbeat would
    // multiply one verified visitor by the length of their session.
    expect(shouldReportVerification(VISITOR_HUMAN, true)).toBe(false);
  });

  it("stays silent while nothing has been demonstrated", () => {
    // Silence is the whole signal: the human share is this event's user count
    // read against the property's total, so an unverified visit must not
    // appear at all rather than appear with a negative label.
    expect(shouldReportVerification(VISITOR_UNVERIFIED, false)).toBe(false);
    expect(shouldReportVerification(VISITOR_UNVERIFIED, true)).toBe(false);
  });
});

describe("analytics naming", () => {
  it("pins the strings that become permanent dimension values", () => {
    // Renaming any of these splits the reporting history in two: past rows keep
    // the old string forever.
    expect(VISITOR_PARAM).toBe("visitor_type");
    expect(VISITOR_HUMAN).toBe("human");
    expect(VISITOR_UNVERIFIED).toBe("unverified");
    expect(UNVERIFIED_ENGAGEMENT_PARAM).toBe("unverified_engagement_msec");
    expect(VISIT_VERIFIED_EVENT).toBe("visit_verified");
  });

  it("stays inside the parameter name and value limits", () => {
    for (const name of [VISITOR_PARAM, UNVERIFIED_ENGAGEMENT_PARAM, VISIT_VERIFIED_EVENT]) {
      expect(name.length).toBeLessThanOrEqual(40);
    }
    for (const value of [VISITOR_HUMAN, VISITOR_UNVERIFIED]) {
      expect(value.length).toBeLessThanOrEqual(100);
    }
  });
});
