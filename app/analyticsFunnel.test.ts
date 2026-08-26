import { describe, expect, it } from "vitest";
import {
  FUNNEL_EVENTS,
  HALFWAY_PERCENT,
  parseFiredMilestones,
  pendingMilestones,
  reachedMilestones,
  type AssessmentFunnelState,
} from "./analyticsFunnel";

const untouched: AssessmentFunnelState = {
  answered: 0,
  percent: 0,
  complete: false,
  onContactForm: false,
  resultsVisible: false,
};

function state(overrides: Partial<AssessmentFunnelState>): AssessmentFunnelState {
  return { ...untouched, ...overrides };
}

describe("reachedMilestones", () => {
  it("reports nothing for an assessment nobody has started", () => {
    expect(reachedMilestones(untouched)).toEqual([]);
  });

  it("reports the first question once a single answer is resolved", () => {
    expect(reachedMilestones(state({ answered: 1, percent: 2 }))).toEqual(["first_question_completed"]);
  });

  it("treats exactly half the questionnaire as the halfway milestone", () => {
    expect(reachedMilestones(state({ answered: 20, percent: HALFWAY_PERCENT - 1 })))
      .toEqual(["first_question_completed"]);
    expect(reachedMilestones(state({ answered: 21, percent: HALFWAY_PERCENT })))
      .toEqual(["first_question_completed", "assessment_halfway"]);
  });

  it("reports the final question only when every section is resolved", () => {
    expect(reachedMilestones(state({ answered: 40, percent: 98, complete: false })))
      .not.toContain("last_question_completed");
    expect(reachedMilestones(state({ answered: 41, percent: 100, complete: true })))
      .toContain("last_question_completed");
  });

  it("separates seeing the contact form from seeing the report", () => {
    expect(reachedMilestones(state({ answered: 41, percent: 100, complete: true, onContactForm: true })))
      .toEqual([
        "first_question_completed",
        "assessment_halfway",
        "last_question_completed",
        "contact_form_view",
      ]);
    expect(reachedMilestones(state({ answered: 41, percent: 100, complete: true, resultsVisible: true })))
      .toEqual([
        "first_question_completed",
        "assessment_halfway",
        "last_question_completed",
        "results_viewed",
      ]);
  });

  it("never derives the two moment-in-time events from state", () => {
    const everything = reachedMilestones(state({
      answered: 41,
      percent: 100,
      complete: true,
      onContactForm: true,
      resultsVisible: true,
    }));
    expect(everything).not.toContain("assessment_view");
    expect(everything).not.toContain("contact_info_submitted");
  });
});

describe("pendingMilestones", () => {
  it("withholds milestones already reported for this attempt", () => {
    const reached = state({ answered: 21, percent: HALFWAY_PERCENT });
    expect(pendingMilestones(reached, ["first_question_completed"])).toEqual(["assessment_halfway"]);
    expect(pendingMilestones(reached, ["first_question_completed", "assessment_halfway"])).toEqual([]);
  });

  it("reports a milestone skipped over by a resumed draft", () => {
    // A respondent who resumes straight into a finished questionnaire still
    // has to pass through every earlier step of the funnel.
    expect(pendingMilestones(state({ answered: 41, percent: 100, complete: true }), [])).toEqual([
      "first_question_completed",
      "assessment_halfway",
      "last_question_completed",
    ]);
  });

  it("stops reporting a milestone after the answer that triggered it is withdrawn", () => {
    expect(pendingMilestones(untouched, ["first_question_completed"])).toEqual([]);
  });
});

describe("parseFiredMilestones", () => {
  it("recovers a stored list in funnel order without duplicates", () => {
    expect(parseFiredMilestones(["assessment_halfway", "first_question_completed", "assessment_halfway"]))
      .toEqual(["first_question_completed", "assessment_halfway"]);
  });

  it("discards unrecognized and malformed storage", () => {
    expect(parseFiredMilestones(["first_question_completed", "made_up_event", 7, null]))
      .toEqual(["first_question_completed"]);
    expect(parseFiredMilestones("first_question_completed")).toEqual([]);
    expect(parseFiredMilestones(null)).toEqual([]);
    expect(parseFiredMilestones({ 0: "first_question_completed" })).toEqual([]);
  });

  it("round-trips the complete funnel", () => {
    expect(parseFiredMilestones([...FUNNEL_EVENTS])).toEqual([...FUNNEL_EVENTS]);
  });
});
